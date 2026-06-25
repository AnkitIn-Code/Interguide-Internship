const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const aiService = require('../services/ai.service');
const subscriptionHelper = require('../utils/subscriptionHelper');
const InterviewReport = require('../models/InterviewReport');

exports.getReports = catchAsync(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const reports = await InterviewReport.find({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('jobRole interviewType difficulty report createdAt totalQuestions answeredQuestions questionResults');
    res.status(200).json({ status: 'success', data: { reports } });
});

exports.startInterview = catchAsync(async (req, res, next) => {
    const { job_role, interview_type, difficulty } = req.body;

    // Check quota
    const quota = await subscriptionHelper.checkQuota(req.user.id, 'interviews');
    if (!quota.allowed) {
        if (quota.payPerUseRequired) {
            return res.status(403).json({
                status: 'quota_exhausted',
                payPerUseRequired: true,
                amount: quota.amount,
                featureType: 'INTERVIEW',
                message: 'Your monthly interview quota has been exhausted. Please pay to continue.'
            });
        } else {
            return next(new AppError(quota.reason || 'Quota exceeded', 400));
        }
    }

    let resumeText = '';
    if (req.file) {
        try {
            const pdf = require('pdf-parse');
            let data;
            if (typeof pdf === 'function') {
                data = await pdf(req.file.buffer);
            } else {
                const parser = new pdf.PDFParse({ data: req.file.buffer });
                data = await parser.getText();
                await parser.destroy().catch(() => {});
            }
            resumeText = data.text || '';
            console.log(`[Interview] Extracted ${resumeText.length} chars from resume`);
        } catch (err) {
            console.error('Resume PDF extraction failed:', err.message);
        }
    }

    const result = await aiService.generateQuestionsV2(
        job_role || 'Software Engineer',
        interview_type || 'behavioral',
        resumeText,
        difficulty || 'medium'
    );

    if (!result.role_clear) {
        return res.status(200).json({
            status: 'success',
            data: {
                role_clear: false,
                suggestions: result.suggestions || []
            }
        });
    }

    // Increment usage since session successfully generated questions
    await subscriptionHelper.incrementUsage(req.user.id, 'interviews');

    // Save interview session to DB
    let interviewReportId = null;
    try {
        const report = await InterviewReport.create({
            userId: req.user._id || req.user.id,
            jobRole: job_role || 'Software Engineer',
            interviewType: interview_type || 'behavioral',
            difficulty: difficulty || 'medium',
            status: 'in-progress',
            totalQuestions: (result.questions || []).length,
            questionResults: (result.questions || []).map(q => ({
                questionText: typeof q === 'string' ? q : q.question || q.text || '',
                questionType: interview_type || 'behavioral'
            }))
        });
        interviewReportId = report._id;
        console.log(`[Interview] Saved to DB: ${report._id}`);
    } catch (dbErr) {
        console.error('[Interview] DB save failed (non-critical):', dbErr.message);
    }

    console.log(`[Interview] Started: role=${job_role}, questions generated`);
    res.status(200).json({
        status: 'success',
        data: {
            role_clear: true,
            questions: result.questions || [],
            interviewReportId
        }
    });
});

exports.processAnswer = catchAsync(async (req, res, next) => {
    const { question, job_role } = req.body;
    if (!req.file) {
        return next(new AppError('Please upload audio file', 400));
    }

    console.log(`[Interview] Evaluating answer for: ${question.substring(0, 60)}...`);

    // Transcribe audio
    const sttResult = await aiService.transcribeAudio(req.file.buffer, req.file.originalname);
    const transcript = sttResult.text || '';

    // Build audio metrics from Whisper segment timestamps
    const analysis = aiService.buildMetricsFromSegments(transcript, sttResult.segments, sttResult.duration);
    analysis.transcript = transcript;
    analysis.confidence = sttResult.confidence;

    // AI Evaluation
    const evaluation = await aiService.evaluateAnswer(
        question,
        transcript,
        analysis,
        job_role
    );

    res.status(200).json({
        status: 'success',
        data: {
            analysis,
            evaluation
        }
    });
});

exports.generateReport = catchAsync(async (req, res, next) => {
    const { answers, job_role, interviewReportId } = req.body;
    const result = await aiService.generateReport(answers, job_role);

    // Save completed report to DB
    if (req.user) {
        try {
            const userId = req.user._id || req.user.id;
            const reportData = result.data || result;
            const overallScore = reportData.overall_score || reportData.overallScore || 0;

            // Build question results from answers array
            const questionResults = (answers || []).map(a => ({
                questionText: a.question || '',
                questionType: a.type || 'behavioral',
                userAnswer: a.transcript || a.answer || '',
                evaluation: {
                    score: a.evaluation?.score || a.score || 0,
                    feedback: a.evaluation?.feedback || a.feedback || '',
                    strengths: a.evaluation?.strengths || [],
                    improvements: a.evaluation?.improvements || a.evaluation?.areas_for_improvement || []
                },
                timeTaken: a.timeTaken || 0
            }));

            if (interviewReportId) {
                // Update existing report
                await InterviewReport.findByIdAndUpdate(interviewReportId, {
                    status: 'completed',
                    questionResults,
                    answeredQuestions: questionResults.filter(q => q.userAnswer).length,
                    report: {
                        overallScore,
                        summary: reportData.summary || reportData.overall_feedback || '',
                        strengths: reportData.strengths || [],
                        areasForImprovement: reportData.areas_for_improvement || reportData.weaknesses || [],
                        recommendations: reportData.recommendations || [],
                        rawReport: reportData
                    }
                });
            } else {
                // Create new report if no ID provided
                await InterviewReport.create({
                    userId,
                    jobRole: job_role || 'Software Engineer',
                    status: 'completed',
                    questionResults,
                    totalQuestions: questionResults.length,
                    answeredQuestions: questionResults.filter(q => q.userAnswer).length,
                    report: {
                        overallScore,
                        summary: reportData.summary || reportData.overall_feedback || '',
                        strengths: reportData.strengths || [],
                        areasForImprovement: reportData.areas_for_improvement || reportData.weaknesses || [],
                        recommendations: reportData.recommendations || [],
                        rawReport: reportData
                    }
                });
            }
            console.log(`[Interview] Report saved to DB for user ${userId}`);
        } catch (err) {
            console.error('[Interview] Failed to save report to DB (non-critical):', err.message);
        }

        // Optional: Send notification after report generation
        try {
            const Notification = require('../models/Notification');
            if (Notification) {
                await Notification.create({
                    userId: req.user._id || req.user.id,
                    title: 'Interview Report Generated',
                    message: `Your AI interview for ${job_role} is complete. Overall Score: ${result.data?.overall_score || 'N/A'}/100.`,
                    type: 'INTERVIEW_REPORT',
                    link: '/ai-interview'
                });
            }
        } catch (err) {
            // Non-critical, don't fail the request
        }
    }

    res.status(200).json(result);
});

exports.transcribeAudio = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload audio file', 400));
    }
    const analysis = await aiService.analyzeAudio(req.file.buffer, req.file.originalname);
    res.status(200).json({
        status: 'success',
        data: { analysis }
    });
});

exports.speakText = catchAsync(async (req, res, next) => {
    const { text, voice } = req.body;
    if (!text) {
        return next(new AppError('Please provide text to convert to speech', 400));
    }
    const audioBuffer = await aiService.speakText(text, voice);
    res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength
    });
    res.send(Buffer.from(audioBuffer));
});
