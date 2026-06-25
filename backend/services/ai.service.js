const axios = require('axios');
let EdgeTTS;
try { EdgeTTS = require('edge-tts-universal').EdgeTTS; } catch(e) { EdgeTTS = null; }

// ─── Fireworks AI Configuration ──────────────────────────────────────────────
const FIREWORKS_API_URL = 'https://api.fireworks.ai/inference/v1/chat/completions';
const FIREWORKS_MODEL = 'accounts/fireworks/models/deepseek-v4-pro';

const callFireworks = async (systemPrompt, userPrompt, maxTokens = 131072) => {
    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) throw new Error('FIREWORKS_API_KEY is not configured');

    try {
        const response = await axios.post(
            FIREWORKS_API_URL,
            {
                model: FIREWORKS_MODEL,
                max_tokens: maxTokens,
                temperature: 0.6,
                top_p: 1,
                top_k: 40,
                presence_penalty: 0,
                frequency_penalty: 0,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000 // Increased to 2 minutes for Deepseek processing
            }
        );

        let content = response.data.choices[0].message.content;
        // Strip <think>...</think> tags from reasoning models
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try { return JSON.parse(jsonMatch[0]); }
            catch (e) { console.error('JSON parse failed on extracted block:', jsonMatch[0].substring(0, 100)); throw e; }
        }
        return JSON.parse(content);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            throw new Error(`Fireworks API timeout: ${error.message}`);
        }
        throw error;
    }
};

// ─── Filler Detection ─────────────────────────────────────
const FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of', 'right', 'okay'];

const countFillers = (text) => {
    if (!text) return 0;
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(w => FILLERS.includes(w.replace(/[.,!?;:]/g, ''))).length;
};

const getFillerDetails = (text) => {
    if (!text) return { total: 0, breakdown: {} };
    const words = text.toLowerCase().split(/\s+/);
    const breakdown = {};
    for (const w of words) {
        const clean = w.replace(/[.,!?;:]/g, '');
        if (FILLERS.includes(clean)) {
            breakdown[clean] = (breakdown[clean] || 0) + 1;
        }
    }
    return { total: Object.values(breakdown).reduce((a, b) => a + b, 0), breakdown };
};

// ─── Audio Metrics from Whisper Segments ─────────────────────────────────────
// Uses real segment timestamps from Whisper verbose_json for accurate metrics
const buildMetricsFromSegments = (transcript, segments = [], duration = 0) => {
    const words = (transcript || '').split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const fillers = countFillers(transcript);
    const fillerDetails = getFillerDetails(transcript);

    // If no segment data, fall back to basic estimation
    if (!segments || segments.length === 0) {
        const estDurationMin = wordCount > 0 ? wordCount / 130 : 0;
        return {
            transcript,
            speech_rate: wordCount > 0 ? 130 : 0,
            filler_count: fillers,
            filler_details: fillerDetails,
            pause_ratio: 0,
            long_pauses: 0,
            energy: 0,
            energy_variance: 0,
            pace_stability: 0,
            voice_breaks: 0,
            confidence: wordCount > 5 ? 75 : wordCount > 0 ? 40 : 0
        };
    }

    // --- Compute from real segment timestamps ---
    const totalDuration = duration || (segments.length > 0 ? segments[segments.length - 1].end : 0);
    const totalDurationMin = totalDuration / 60;

    // Speech rate (words per minute)
    const speechRate = totalDurationMin > 0 ? Math.round(wordCount / totalDurationMin) : 0;

    // Total speaking time vs total time → pause ratio
    let totalSpeechTime = 0;
    for (const seg of segments) {
        totalSpeechTime += (seg.end - seg.start);
    }
    const pauseTime = Math.max(0, totalDuration - totalSpeechTime);
    const pauseRatio = totalDuration > 0 ? pauseTime / totalDuration : 0;

    // Count gaps between segments
    let longPauses = 0;
    let voiceBreaks = 0;
    const gapDurations = [];
    for (let i = 1; i < segments.length; i++) {
        const gap = segments[i].start - segments[i - 1].end;
        if (gap > 0.1) { // any noticeable gap
            voiceBreaks++;
            gapDurations.push(gap);
        }
        if (gap > 2.0) { // long pause > 2 seconds
            longPauses++;
        }
    }

    // Pace stability (coefficient of variation of segment durations) 
    const segDurations = segments.map(s => s.end - s.start).filter(d => d > 0);
    let paceStability = 0;
    if (segDurations.length > 1) {
        const mean = segDurations.reduce((a, b) => a + b, 0) / segDurations.length;
        const variance = segDurations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / segDurations.length;
        paceStability = mean > 0 ? Math.sqrt(variance) / mean : 0; // CV: lower = steadier
    }

    // Energy variance estimate from gap patterns (more gaps = more variance)
    const energyVariance = gapDurations.length > 0
        ? Math.round(
            (gapDurations.reduce((sum, g) => sum + Math.pow(g - (gapDurations.reduce((a, b) => a + b, 0) / gapDurations.length), 2), 0)
            / gapDurations.length) * 10000
          ) / 10000
        : 0;

    // Confidence based on speech-to-silence ratio and word count
    let confidence = 0;
    if (wordCount > 20 && pauseRatio < 0.3) confidence = 85;
    else if (wordCount > 10 && pauseRatio < 0.5) confidence = 70;
    else if (wordCount > 5) confidence = 50;
    else if (wordCount > 0) confidence = 30;

    return {
        transcript,
        speech_rate: speechRate,
        filler_count: fillers,
        filler_details: fillerDetails,
        pause_ratio: Math.round(pauseRatio * 10000) / 10000,
        long_pauses: longPauses,
        energy: totalSpeechTime > 0 ? Math.round((totalSpeechTime / totalDuration) * 1000) / 1000 : 0,
        energy_variance: energyVariance,
        pace_stability: Math.round(paceStability * 10000) / 10000,
        voice_breaks: voiceBreaks,
        confidence
    };
};

// For backward compat (used when no audio, just transcript from browser)
const estimateAudioMetrics = (transcript, durationMs = 0) => {
    return buildMetricsFromSegments(transcript, [], durationMs / 1000);
};

// ─── STT: Transcription via Fireworks Whisper ────────────────────────────────
const transcribeAudio = async (audioBuffer, filename = 'audio.wav') => {
    if (!audioBuffer || audioBuffer.length < 500) {
        console.warn('Audio buffer very small or empty, skipping STT.');
        return { text: '', segments: [], duration: 0, confidence: 0 };
    }

    // 1. Try Groq if GROQ_API_KEY is configured (Generous free tier, OpenAI-compatible)
    if (process.env.GROQ_API_KEY) {
        try {
            console.log('Using Groq API for audio transcription...');
            const FormData = require('form-data');
            const form = new FormData();
            form.append('file', audioBuffer, { filename, contentType: 'audio/webm' });
            form.append('model', 'whisper-large-v3');
            form.append('response_format', 'verbose_json');

            const response = await axios.post(
                'https://api.groq.com/openai/v1/audio/transcriptions',
                form,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        ...form.getHeaders()
                    },
                    timeout: 45000
                }
            );
            const data = response.data;
            return {
                text: data.text || '',
                segments: data.segments || [],
                duration: data.duration || 0,
                confidence: 85
            };
        } catch (err) {
            console.error('Groq STT Error:', err.response?.data || err.message);
        }
    }

    // 2. Try Deepgram if DEEPGRAM_API_KEY is configured (Best performance, low-latency)
    if (process.env.DEEPGRAM_API_KEY) {
        try {
            console.log('Using Deepgram API for audio transcription...');
            const response = await axios.post(
                'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true',
                audioBuffer,
                {
                    headers: {
                        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
                        'Content-Type': 'audio/webm'
                    },
                    timeout: 45000
                }
            );
            const data = response.data;
            const alternative = data?.results?.channels?.[0]?.alternatives?.[0];
            if (alternative) {
                const text = alternative.transcript || '';
                const words = alternative.words || [];
                const segments = [];
                let currentSegmentWords = [];
                for (let i = 0; i < words.length; i++) {
                    const w = words[i];
                    currentSegmentWords.push(w);
                    const nextWord = words[i + 1];
                    const hasGap = nextWord ? (nextWord.start - w.end > 1.0) : false;
                    const hasPunctuation = /[.!?]$/.test(w.word);
                    if (i === words.length - 1 || hasGap || hasPunctuation || currentSegmentWords.length >= 10) {
                        segments.push({
                            start: currentSegmentWords[0].start,
                            end: currentSegmentWords[currentSegmentWords.length - 1].end,
                            text: currentSegmentWords.map(sw => sw.word).join(' ')
                        });
                        currentSegmentWords = [];
                    }
                }
                const duration = words.length > 0 ? words[words.length - 1].end : 0;
                return { text, segments, duration, confidence: 90 };
            }
        } catch (err) {
            console.error('Deepgram STT Error:', err.response?.data || err.message);
        }
    }

    console.error('No audio transcription API key (Groq or Deepgram) configured or active.');
    return { text: '', segments: [], duration: 0, confidence: 0 };
};

// ─── Full Audio Analysis Pipeline ────────────────────────────────────────────
const analyzeAudio = async (audioBuffer, filename) => {
    const sttResult = await transcribeAudio(audioBuffer, filename);
    const transcript = sttResult.text || '';
    const metrics = buildMetricsFromSegments(transcript, sttResult.segments, sttResult.duration);
    metrics.transcript = transcript;
    metrics.confidence = sttResult.confidence;
    return metrics;
};

// ─── TTS: Text to Speech via edge-tts ────────────────────────────────────────
const _ttsServerCache = new Map();
const TTS_CACHE_MAX = 50;
const TTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const speakText = async (text, voice = 'en-US-AriaNeural') => {
    if (!text || !text.trim()) throw new Error('Text cannot be empty');

    const cacheKey = `${text}|${voice}`;
    const cached = _ttsServerCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < TTS_CACHE_TTL) {
        return cached.buf;
    }

    let buf;
    try {
        if (!EdgeTTS) throw new Error('edge-tts-universal not installed');
        const tts = new EdgeTTS(text, voice, { rate: '+0%', pitch: '+0Hz', volume: '+0%' });
        const result = await tts.synthesize();
        const arrayBuffer = await result.audio.arrayBuffer();
        buf = Buffer.from(arrayBuffer);
    } catch (err) {
        console.warn(`[TTS] Failed for voice ${voice}:`, err.message);
        if (!EdgeTTS) throw new Error('TTS service unavailable - please install edge-tts-universal: npm install edge-tts-universal');
        console.warn(`Retrying with fallback voice en-US-AriaNeural`);
        const fallbackVoice = 'en-US-AriaNeural';
        const tts = new EdgeTTS(text, fallbackVoice, { rate: '+0%', pitch: '+0Hz', volume: '+0%' });
        const result = await tts.synthesize();
        const arrayBuffer = await result.audio.arrayBuffer();
        buf = Buffer.from(arrayBuffer);
    }

    // Evict oldest if at capacity
    if (_ttsServerCache.size >= TTS_CACHE_MAX) {
        const oldest = _ttsServerCache.keys().next().value;
        _ttsServerCache.delete(oldest);
    }
    _ttsServerCache.set(cacheKey, { buf, ts: Date.now() });

    return buf;
};

// ─── Interview: Generate Questions ───────────────────────────────────────────
const generateQuestionsV2 = async (jobRole, interviewType, resumeText = '', difficulty = 'medium') => {
    const isEasy = difficulty.toLowerCase() === 'easy';
    
    // Clean and maximize extracted resume text up to the safe upper limit (12,000 characters / ~2,000 words)
    let cleanResume = '';
    if (resumeText) {
        cleanResume = resumeText.replace(/\s+/g, ' ').trim();
        const UPPER_LIMIT = 12000;
        if (cleanResume.length > UPPER_LIMIT) {
            cleanResume = cleanResume.substring(0, UPPER_LIMIT) + '... [Resume text truncated to safe upper limit]';
        }
    }

    const systemPrompt = `You are an expert interviewer for a ${jobRole} position.
    Generate 5 high-quality ${interviewType} interview questions.
    The difficulty level should be: ${difficulty}.
    ${cleanResume ? `Candidate's Resume Context: ${cleanResume}` : ''}
    
    Guidelines:
    - Stick to the specified difficulty level: ${difficulty}.
    ${isEasy ? '- Include simple, generic, and foundational questions. Focus on definitions and basic concepts (e.g., "What is React?", "What is a REST API?", etc.).' : ''}
    - If a resume is provided, personalize at least 2 questions to their experience ${isEasy ? '(keep them simple)' : ''}.
    - Keep each "ideal_answer" concise, highly focused, and strictly under 150 words.
    - Keep reasoning brief to avoid token limits, and return ONLY the final JSON object.
    - Return ONLY a JSON object with:
    {
      "role_clear": true,
      "questions": [
        { "id": 1, "question": "...", "difficulty": "${difficulty}", "topic": "...", "ideal_answer": "a high-quality, comprehensive sample answer that would score 100% for this role" }
      ]
    }
    If the job role is nonsense, return "role_clear": false and suggestions for valid roles.`;
    return await callFireworks(systemPrompt, `Generate ${interviewType} questions for ${jobRole} at ${difficulty} difficulty`, 8000);
};

// ─── Interview: Evaluate Single Answer ───────────────────────────────────────
const evaluateAnswer = async (question, transcript, metrics, jobRole) => {
    const systemPrompt = `You are a professional and fair technical interviewer evaluating a candidate for a ${jobRole} role.
    Your goal is to provide an accurate but constructive assessment of the candidate's performance.
    
    IMPORTANT: The "Candidate's Answer Transcript" is generated using Speech-to-Text (STT).
    - Ignore missing or incorrect punctuation (commas, exclamation marks, etc.).
    - Be lenient with minor spelling or phonetic mistakes that are common STT artifacts (e.g., "to" vs "too", "there" vs "their", or similar sounding words).
    - Focus on the substance and technical accuracy of the speech rather than transcript perfection.
    
    Audio Metrics provided: ${JSON.stringify(metrics)}
    
    ### GRADING GUIDELINES ###
    1. TECHNICAL ACCURACY: Evaluate if the candidate understands the core concepts. Credit should be given for correct identification of technologies, patterns, and logic, even if the delivery is not perfect.
    2. SCORING RANGE: 
       - 80-100: Excellent understanding with specific details and clear explanation.
       - 60-79: Good understanding of the core concept with some minor omissions.
       - 40-59: Basic understanding but lacks depth or has some technical inaccuracies.
       - 0-39: Significant misunderstanding or failed to answer the question.
    3. CONSTRUCTIVE FEEDBACK: Identify what was good and specifically what could be improved.
    
    ### OUTPUT FORMAT ###
    For the "technical_pointers" field, provide 2-4 specific bullet points auditing the technical accuracy of their answer.
    
    Return ONLY a JSON object with strictly this schema:
    {
      "answer_score": 0-100,
      "communication_score": 0-100,
      "technical_pointers": ["specific critique 1", "specific critique 2"],
      "model_answer": "a concise, high-quality sample answer that would score 100% for this specific role and question",
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "suggestions": ["..."]
    }`;
    const evaluation = await callFireworks(systemPrompt, `Question: ${question}\nCandidate's Answer Transcript: ${transcript}`);
    
    if (evaluation) {
        // Map any camelCase or naming variations back to snake_case schema
        if (evaluation.answerScore !== undefined && evaluation.answer_score === undefined) {
            evaluation.answer_score = evaluation.answerScore;
        }
        if (evaluation.communicationScore !== undefined && evaluation.communication_score === undefined) {
            evaluation.communication_score = evaluation.communicationScore;
        }
        if (evaluation.content_score !== undefined && evaluation.answer_score === undefined) {
            evaluation.answer_score = evaluation.content_score;
        }
        if (evaluation.contentScore !== undefined && evaluation.answer_score === undefined) {
            evaluation.answer_score = evaluation.contentScore;
        }
        if (evaluation.delivery_score !== undefined && evaluation.communication_score === undefined) {
            evaluation.communication_score = evaluation.delivery_score;
        }
        if (evaluation.deliveryScore !== undefined && evaluation.communication_score === undefined) {
            evaluation.communication_score = evaluation.deliveryScore;
        }
        // Fallbacks if missing
        if (evaluation.answer_score === undefined) evaluation.answer_score = 0;
        if (evaluation.communication_score === undefined) evaluation.communication_score = 0;
    }
    return evaluation;
};

// ─── Interview: Generate Final Report ────────────────────────────────────────
const generateReport = async (answers, jobRole) => {
    const hasContent = answers.some(a =>
        (a.transcript || '').trim() || (a.answer || '').trim()
    );

    if (!hasContent) {
        return {
            status: 'success',
            data: {
                overall_score: 0,
                confidence_score: 0,
                fluency_score: 0,
                technical_accuracy: 0,
                spoken_english: {
                    score: 0,
                    feedback: 'No verbal answers were provided to evaluate communication.',
                    strengths: [],
                    weaknesses: ['No spoken responses.']
                },
                answer_evaluation: {
                    score: 0,
                    feedback: 'No content was provided to evaluate technical accuracy.',
                    strengths: [],
                    weaknesses: ['Questions were skipped or left unanswered.']
                },
                suggestions: ['To receive a performance evaluation, please ensure you answer the questions during the session.']
            }
        };
    }

    const systemPrompt = `Generate a comprehensive and balanced performance scorecard for a ${jobRole || 'General'} interview.
    Synthesize the candidate's performance across all questions: ${JSON.stringify(answers)}
    
    The scorecard MUST be divided into two main sections:
    1. Spoken English Evaluation (focusing on communication, fluency, and confidence)
    2. Answer Content Evaluation (focusing on technical accuracy, relevance, and depth of answers)

    SCORING PHILOSOPHY:
    1. HOLISTIC EVALUATION: The overall_score should be a fair weighted average of technical accuracy and communication skills.
    2. FAIRNESS: Do not use arbitrary score caps. If a candidate provided reasonable answers, their score should reflect their actual performance level.
    3. RECOGNITION: Acknowledge when a candidate correctly identifies core concepts, even if they miss advanced details.
    4. DETAILED BREAKDOWN: Provide specific, actionable feedback. Instead of "work on technical skills," mention the specific topics or gaps identified.
    5. ENCOURAGEMENT: Maintain a professional and constructive tone that helps the candidate grow.
    
    Return ONLY a JSON object with:
    {
      "overall_score": 0-100,
      "confidence_score": 0-100,
      "fluency_score": 0-100,
      "technical_accuracy": 0-100,
      "spoken_english": {
        "score": 0-100,
        "feedback": "...",
        "strengths": [],
        "weaknesses": []
      },
      "answer_evaluation": {
        "score": 0-100,
        "feedback": "...",
        "strengths": [],
        "weaknesses": []
      },
      "suggestions": []
    }`;

    const reportData = await callFireworks(systemPrompt, 'Process interview results strictly.');

    // Compute audio metrics from answers
    const speechRates = [], fillerCounts = [], pauseRatios = [], 
          clarityScores = [], energyVariances = [], longPauseCounts = [];

    for (const ans of answers) {
        const an = ans.analysis || {};
        if (an.speech_rate) speechRates.push(an.speech_rate);
        if (an.filler_count !== undefined) fillerCounts.push(an.filler_count);
        if (an.pause_ratio) pauseRatios.push(an.pause_ratio);
        if (an.confidence) clarityScores.push(an.confidence);
        if (an.energy_variance) energyVariances.push(an.energy_variance);
        if (an.long_pauses !== undefined) longPauseCounts.push(an.long_pauses);
    }

    reportData.audio_metrics = {
        avg_speech_rate: speechRates.length ? Math.round(speechRates.reduce((a, b) => a + b) / speechRates.length * 10) / 10 : 0,
        total_filler_words: fillerCounts.reduce((a, b) => a + b, 0),
        avg_pause_ratio: pauseRatios.length ? Math.round(pauseRatios.reduce((a, b) => a + b) / pauseRatios.length * 100) / 100 : 0,
        avg_clarity: clarityScores.length ? Math.round(clarityScores.reduce((a, b) => a + b) / clarityScores.length * 10) / 10 : 0,
        avg_modulation: energyVariances.length ? Math.round(energyVariances.reduce((a, b) => a + b) / energyVariances.length * 10000) / 10000 : 0,
        total_long_pauses: longPauseCounts.reduce((a, b) => a + b, 0),
    };

    return { status: 'success', data: reportData };
};

// ─── English Tutor: Evaluate Speaking Test ───────────────────────────────────
const evaluateSpeakingTest = async (responses) => {
    const tasksText = JSON.stringify(responses, null, 2);
    const systemPrompt = `You are a professional CEFR English examiner. Analyze several spoken responses.
    
    IMPORTANT: The responses are provided as Speech-to-Text (STT) transcripts.
    - Ignore punctuation errors (missing commas, periods, etc.).
    - Ignore minor spelling mistakes or homophones (words that sound the same but are spelled differently) as these are often STT errors.
    - Evaluate the student's proficiency based on the intended meaning and spoken performance, not transcript perfection.
    
    Evaluation Rubric:
    1. Overall CEFR Level (A1-C2).
    2. Suggested Start Level (1-5) based on proficiency:
       - Level 1: A1 (Beginner)
       - Level 2: A2 (Elementary)
       - Level 3: B1 (Intermediate)
       - Level 4: B2 (Upper-Intermediate)
       - Level 5: C1+ (Advanced)
    3. Detailed feedback per task.
    4. Identify "missing words" (words from the prompt that were NOT in the transcript).
    5. Provide scores (0-10) for: Fluency, Vocabulary, Grammar, Pronunciation.
    
    Return ONLY a JSON object:
    {
      "overall_cefr": "...",
      "suggested_level": 1-5,
      "scores": { "fluency": 0, "vocabulary": 0, "grammar": 0, "pronunciation": 0 },
      "analysis": "...",
      "detailed_breakdown": [
        { "task_name": "...", "feedback": "...", "missing_words": [] }
      ]
    }
    
    IMPORTANT: Make sure the JSON key is "scores" and NOT "scares" or any other typo.`;
    const result = await callFireworks(systemPrompt, `Evaluate proficiency test: ${tasksText}`);
    
    // Normalize evaluation format
    let evaluation = result || {};
    
    // Check for "scares" typo
    if (!evaluation.scores && evaluation.scares) {
        evaluation.scores = evaluation.scares;
        delete evaluation.scares;
    }
    
    // If scores is missing, initialize
    if (!evaluation.scores) {
        evaluation.scores = {};
    }
    
    // Normalize root scores to scores object if present
    const rootKeys = ['fluency', 'grammar', 'vocabulary', 'pronunciation'];
    rootKeys.forEach(k => {
        if (evaluation[k] !== undefined && evaluation.scores[k] === undefined) {
            evaluation.scores[k] = evaluation[k];
        }
    });
    
    // Ensure all scores are present
    const defaultScore = evaluation.suggested_level !== undefined ? Math.min(10, evaluation.suggested_level * 2) : 8;
    evaluation.scores.fluency = evaluation.scores.fluency ?? defaultScore;
    evaluation.scores.grammar = evaluation.scores.grammar ?? defaultScore;
    evaluation.scores.vocabulary = evaluation.scores.vocabulary ?? defaultScore;
    evaluation.scores.pronunciation = evaluation.scores.pronunciation ?? defaultScore;
    
    // Normalize 0-100 scale down to 0-10
    rootKeys.forEach(k => {
        if (typeof evaluation.scores[k] === 'number' && evaluation.scores[k] > 10) {
            evaluation.scores[k] = Math.round(evaluation.scores[k] / 10);
        }
    });

    return { status: 'success', data: evaluation };
};

// ─── English Tutor: Generate Lesson Content ──────────────────────────────────
const DIFFICULTY_LEVELS = {
    1: 'Absolute Beginner (A1) - Simple greetings, personal info, numbers, basic colors.',
    2: 'Beginner (A1) - Daily routines, family, shopping, basic food.',
    3: 'Elementary (A2) - Travel, hobbies, simple past events, describing people.',
    4: 'Pre-Intermediate (A2+) - Work, health, future plans, basic comparisons.',
    5: 'Intermediate (B1) - Opinions, life experiences, environmental issues, news.',
    6: 'Upper-Intermediate (B1+) - Cultural differences, technology, complex social issues.',
    7: 'Advanced (B2) - Professional debates, abstract concepts, storytelling with nuances.',
    8: 'Upper-Advanced (B2+) - Idiomatic expressions, sarcasm, formal presentation skills.',
    9: 'Expert (C1) - Academic lectures, complex literature analysis, legal/professional English.',
    10: 'Master (C2) - Near-native fluency, specialized philosophy, high-level scientific discourse.'
};

const generateLessonContent = async (level, lessonIndex) => {
    const safeLevel = Math.max(1, level || 1);
    
    let difficultyDesc = "";
    if (safeLevel <= 1) {
        difficultyDesc = "Absolute Beginner (A1) - Simple greetings, personal info, basic nouns.";
    } else if (safeLevel === 2) {
        difficultyDesc = "Beginner (A1) - Daily routines, family, basic food.";
    } else if (safeLevel === 3) {
        difficultyDesc = "Elementary (A2) - Travel, hobbies, simple past events, describing people.";
    } else if (safeLevel === 4) {
        difficultyDesc = "Pre-Intermediate (A2+) - Work, health, future plans, basic comparisons.";
    } else if (safeLevel === 5) {
        difficultyDesc = "Intermediate (B1) - Opinions, life experiences, environmental issues, news.";
    } else if (safeLevel === 6) {
        difficultyDesc = "Upper-Intermediate (B1+) - Cultural differences, technology, complex social issues.";
    } else if (safeLevel === 7) {
        difficultyDesc = "Advanced (B2) - Professional debates, abstract concepts, storytelling with nuances.";
    } else if (safeLevel === 8) {
        difficultyDesc = "Upper-Advanced (B2+) - Idiomatic expressions, sarcasm, formal presentation skills.";
    } else if (safeLevel === 9) {
        difficultyDesc = "Expert (C1) - Academic lectures, complex literature analysis, legal/professional English.";
    } else {
        difficultyDesc = `Master (C2 or higher, Level ${safeLevel}) - Near-native fluency, specialized philosophy, high-level scientific and academic discourse. Make it extremely challenging.`;
    }

    const systemPrompt = `You are an expert AI English Tutor. Generate a unique, interactive English learning lesson.
    The lesson difficulty must correspond to: ${difficultyDesc}.
    The lesson index is ${lessonIndex}. Provide a topic suitable for this level.
    
    You must output ONLY a JSON object matching this schema:
    {
      "title": "A short, engaging title for the lesson",
      "content": "A short passage, dialogue, or description (1-4 sentences/lines) representing the core text of this lesson.",
      "vocabulary": [
        { "word": "A key word from the content", "definition": "A clear, simple explanation of the word" }
      ],
      "tasks": [
        {
          "id": 1,
          "type": "repeat", // or "question", "describe_image", "roleplay", "idiom_usage", "debate", "free_speech"
          "prompt": "An instruction for the student to speak their response",
          "text_to_repeat": "For repeat tasks, the exact text to repeat. Omit for other tasks.",
          "correct_answer_hint": "For question tasks, a short answer hint. Omit for other tasks.",
          "image_url": "For describe_image tasks, a valid image URL. Omit for other tasks.",
          "roleplay_scenario": "For roleplay tasks, a short context or instruction. Omit for other tasks.",
          "target_idiom": "For idiom_usage tasks, the idiom to use. Omit for other tasks.",
          "debate_stance": "For debate tasks, the stance to argue. Omit for other tasks."
        }
      ]
    }
    
    Guidelines:
    - Include 3 to 4 tasks in the "tasks" array.
    - Vary the task types based on what is appropriate for the level (lower levels should have repeat, question, describe_image; higher levels should have roleplay, debate, idiom_usage, free_speech).
    - Ensure all output is grammatically correct and appropriate.
    - Output ONLY the raw JSON object. No explanation, no markdown wrap.`;

    try {
        const result = await callFireworks(systemPrompt, `Generate a level ${safeLevel} lesson content`);
        return { status: 'success', data: result };
    } catch (err) {
        console.error('Dynamic lesson generation failed:', err.message);
        return { status: 'error', message: err.message };
    }
};

// ─── English Tutor: Evaluate Lesson Task ─────────────────────────────────────
const evaluateLessonTask = async (taskType, transcript, metrics, context) => {
    const systemPrompt = `Evaluate a student's spoken English response for a '${taskType}' task.
    Context (Original Task/Text): ${JSON.stringify(context)}
    Audio Metrics: ${JSON.stringify(metrics)}
    
    IMPORTANT: The user transcript is from a Speech-to-Text (STT) engine.
    - Ignore missing or incorrect punctuation.
    - Ignore minor spelling mistakes or phonetic misinterpretations (e.g., 'there' vs 'their', 'accept' vs 'except') that are likely STT artifacts.
    - Focus on the content and meaning of the spoken response.
    
    Goals:
    - If task is 'repeat', check accuracy against 'text_to_repeat'.
    - If task is 'question', check relevance and grammar.
    - If task is 'free_speech', check fluency and vocabulary usage.
    - If task is 'describe_image', check descriptive language and relevance to the visual keywords.
    - If task is 'roleplay', check contextual appropriateness and conversational flow.
    - If task is 'idiom_usage', check if the idiom was used correctly and naturally.
    - If task is 'debate', check argument logic, persuasive vocabulary, and counter-points.
    
    Return ONLY a JSON object:
    {
      "scores": {
        "overall": 0-100,
        "fluency": 0-100,
        "grammar": 0-100,
        "vocabulary": 0-100,
        "pronunciation": 0-100
      },
      "feedback": "Encouraging and constructive feedback",
      "corrections": "Specific grammar or pronunciation corrections",
      "error_tags": ["grammar", "pronunciation", "vocabulary", "fluency"],
      "missing_words": ["Words from the requested text that were skipped"],
      "pronunciation_tip": "One specific tip for improvement"
    }
    
    IMPORTANT RULES FOR SCORING:
    - ALL scores MUST be on a scale of 0 to 100.
    - For the 'repeat' task: Be highly lenient. If the transcript proves they repeated the 'text_to_repeat' accurately (allowing for STT misinterpretation of similar-sounding words), they MUST receive a passing overall score (80-100). Do not fail a perfect repetition for a pause or a minor STT error.
    - Double check that your output JSON contains the exact key "scores" and NOT "scares" or any other misspelling.
    - NEVER use the word "prompt" in your feedback or tips. Always refer to it naturally as "the text", "the sentence", or "the task".`;
    const result = await callFireworks(systemPrompt, `User transcript: ${transcript}`);
    
    // Normalize evaluation format
    let evaluation = result || {};
    
    // Check for "scares" typo
    if (!evaluation.scores && evaluation.scares) {
        evaluation.scores = evaluation.scares;
        delete evaluation.scares;
    }
    
    // If scores is missing, initialize
    if (!evaluation.scores) {
        evaluation.scores = {};
    }
    
    // Normalize root scores to scores object if present
    const rootKeys = ['overall', 'fluency', 'grammar', 'vocabulary', 'pronunciation'];
    rootKeys.forEach(k => {
        if (evaluation[k] !== undefined && evaluation.scores[k] === undefined) {
            evaluation.scores[k] = evaluation[k];
        }
    });
    
    // Ensure all scores are present
    const defaultScore = evaluation.scores.overall !== undefined ? evaluation.scores.overall : (evaluation.score || 85);
    evaluation.scores.overall = evaluation.scores.overall ?? defaultScore;
    evaluation.scores.fluency = evaluation.scores.fluency ?? defaultScore;
    evaluation.scores.grammar = evaluation.scores.grammar ?? defaultScore;
    evaluation.scores.vocabulary = evaluation.scores.vocabulary ?? defaultScore;
    evaluation.scores.pronunciation = evaluation.scores.pronunciation ?? defaultScore;
    
    // Normalize 0-10 scale to 0-100
    rootKeys.forEach(k => {
        if (typeof evaluation.scores[k] === 'number' && evaluation.scores[k] <= 10) {
            evaluation.scores[k] = Math.round(evaluation.scores[k] * 10);
        }
    });

    return {
        status: 'success',
        data: {
            evaluation,
            transcript,
            metrics
        }
    };
};

// ─── Exports ─────────────────────────────────────────────────────────────────
module.exports = {
    callFireworks,
    // Audio
    transcribeAudio,
    analyzeAudio,
    speakText,
    buildMetricsFromSegments,
    // Filler detection
    countFillers,
    getFillerDetails,
    estimateAudioMetrics,
    // Interview
    generateQuestionsV2,
    evaluateAnswer,
    generateReport,
    // English Tutor
    evaluateSpeakingTest,
    generateLessonContent,
    evaluateLessonTask,
};
