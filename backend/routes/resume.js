const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const { analyzeResume, extractJDRequirements, analyzeResumeAgainstJD } = require('../services/resumeAnalyzer');
const User = require('../models/User');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* ─── DeepSeek via Fireworks AI helper ──────────────────────────────────── */
const callDeepSeek = async (prompt) => {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) throw new Error('Fireworks API key not configured');

  const response = await axios.post(
    'https://api.fireworks.ai/inference/v1/chat/completions',
    {
      model: 'accounts/fireworks/models/deepseek-v4-pro',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return response.data.choices?.[0]?.message?.content?.trim() || '';
};

// @route   POST /api/resume/analyze
// @desc    Upload and analyze resume, persist to DB
router.post('/analyze', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const extractedData = await analyzeResume(req.file.buffer, req.file.mimetype);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ── Merge skills ──────────────────────────────────────────────
    const techSkills = Array.isArray(extractedData.technicalSkills) ? extractedData.technicalSkills : [];
    const softSkills = Array.isArray(extractedData.softSkills)      ? extractedData.softSkills      : [];
    user.technicalSkills = Array.from(new Set([...user.technicalSkills, ...techSkills]));
    user.softSkills      = Array.from(new Set([...user.softSkills,      ...softSkills]));

    // ── Persist education & experience to user profile ────────────
    if (extractedData.education?.length > 0) user.education = extractedData.education;
    if (extractedData.experience?.length > 0) user.experience = extractedData.experience;

    // ── Save full resume to user.resume (persists across logins) ─
    user.resume = {
      fileName:   req.file.originalname,
      uploadedAt: new Date(),
      text:       extractedData.rawText || '',
      skills:     techSkills,
      atsScore:   extractedData.atsScore   ?? 0,
      experience: extractedData.experience || [],
      education:  extractedData.education  || [],
    };

    await user.save();

    // ── Build response with ATS info ──────────────────────────────
    const response = {
      message: 'Resume analyzed successfully',
      resume: {
        contactInfo:     extractedData.contactInfo     || {},
        skills:          techSkills,
        softSkills:      softSkills,
        education:       extractedData.education       || [],
        experience:      extractedData.experience      || [],
        missingElements: extractedData.missingElements || [],
      },
      profileStrength: extractedData.profileStrength ?? 0,
      atsScore:        extractedData.atsScore         ?? 0,
    };

    res.json(response);
  } catch (err) {
    console.error('Analyze resume error:', err.message);
    res.status(500).json({ message: 'Error analyzing resume', error: err.message });
  }
});

// ─── AI Optimize Summary (DeepSeek via Fireworks) ───────────────────────────
// @route POST /api/resume/optimize-summary
router.post('/optimize-summary', protect, async (req, res) => {
  try {
    const { text, role } = req.body;
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ message: 'Please provide a summary to optimize.' });
    }

    const prompt = `You are an expert resume writer. Rewrite the following career summary for a ${role || 'Software Engineer'} role.
Make it professional, concise (2-4 sentences), ATS-friendly, and impactful.
Only return the improved summary text, no labels, no explanations, no markdown.

Original summary:
${text}`;

    const optimizedText = await callDeepSeek(prompt);
    res.json({ success: true, optimizedText });
  } catch (err) {
    console.error('Optimize summary error:', err.message);
    res.status(500).json({ message: err.message || 'AI optimization failed' });
  }
});

// ─── AI Optimize Experience / Projects (DeepSeek via Fireworks) ─────────────
// @route POST /api/resume/optimize-experience
router.post('/optimize-experience', protect, async (req, res) => {
  try {
    const { text, type, role } = req.body;
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ message: 'Please provide content to optimize.' });
    }

    const isProject = type === 'projects';
    const prompt = `You are an expert resume writer. ${isProject ? 'Rewrite these project bullet points' : 'Rewrite these work experience bullet points'} for a ${role || 'Software Engineer'} resume.

Guidelines:
- Use strong action verbs (Developed, Built, Optimized, Led, Implemented, etc.)
- Quantify achievements where possible (e.g., reduced load time by 40%)
- Keep bullets concise (1-2 lines each)
- Make it ATS-friendly
- Return ONLY bullet points, one per line starting with "• "
- Produce 3-5 bullets maximum
- No markdown, no labels, no explanations

Original content:
${text}`;

    const optimizedText = await callDeepSeek(prompt);
    res.json({ success: true, optimizedText });
  } catch (err) {
    console.error('Optimize experience error:', err.message);
    res.status(500).json({ message: err.message || 'AI optimization failed' });
  }
});

// ─── Resume Download verification stub ───────────────────────────────────────
// @route POST /api/resume/download
router.post('/download', protect, async (req, res) => {
  res.json({ success: true });
});

// ─── Resume Upload ────────────────────────────────────────────────────────────
// @route POST /api/resume/upload
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const extractedData = await analyzeResume(req.file.buffer, req.file.mimetype);
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.profile) user.profile = {};
    user.profile.resume = {
      fileName: req.file.originalname,
      uploadedAt: new Date(),
      extractedText: extractedData.text || ''
    };

    await user.save();

    res.json({
      message: 'Resume uploaded successfully',
      data: {
        fileName: req.file.originalname,
        uploadedAt: new Date(),
        text: extractedData.text,
        skills: extractedData.technicalSkills || []
      }
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ message: 'Error uploading resume', error: err.message });
  }
});

// ─── Get My Resume ────────────────────────────────────────────────────────────
// @route GET /api/resume/my-resume
router.get('/my-resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.profile || !user.profile.resume) {
      return res.status(404).json({ message: 'No resume found' });
    }
    res.json({
      success: true,
      data: {
        fileName: user.profile.resume.fileName,
        uploadedAt: user.profile.resume.uploadedAt,
        text: user.profile.resume.extractedText
      }
    });
  } catch (err) {
    console.error('Get resume error:', err);
    res.status(500).json({ message: 'Error retrieving resume', error: err.message });
  }
});

// ─── Delete Resume ────────────────────────────────────────────────────────────
// @route DELETE /api/resume/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.profile) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    user.profile.resume = undefined;
    await user.save();
    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Delete resume error:', err);
    res.status(500).json({ message: 'Error deleting resume', error: err.message });
  }
});

// ─── Resume Improvement (DeepSeek via Fireworks) ─────────────────────────────
// @route POST /api/resume/improve
router.post('/improve', protect, async (req, res) => {
  try {
    const { text, role } = req.body;
    if (!text) return res.status(400).json({ message: 'Resume text is required' });

    const prompt = `You are an expert resume writer. Improve the following resume for a ${role || 'Software Engineer'} position.

Guidelines:
- Enhance language and clarity
- Add quantifiable achievements
- Use strong action verbs
- Make it ATS-friendly
- Keep it professional and concise

Original Resume:
${text}

Return a valid JSON object (no markdown, no code blocks) with these exact fields:
{
  "improvedText": "The complete improved resume text",
  "keywords": ["keyword1", "keyword2", ...top 10 ATS keywords],
  "improvedBullets": ["bullet1", "bullet2", ...5 best bullet points],
  "summary": "A brief 1-sentence improvement summary"
}`;

    const responseText = await callDeepSeek(prompt);
    
    let parsedResponse;
    try {
      // Strip markdown code blocks if any
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedResponse = JSON.parse(cleaned);
    } catch {
      parsedResponse = {
        improvedText: responseText,
        keywords: [],
        improvedBullets: [],
        summary: 'Resume improved successfully'
      };
    }

    res.json({ success: true, message: 'Resume improved successfully', ...parsedResponse });
  } catch (err) {
    console.error('Resume improve error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to improve resume' });
  }
});

// ─── ATS Analyze (Two-Step Pipeline) ─────────────────────────────────────────
// @route POST /api/resume/ats-analyze
// @desc  Two-step ATS analysis: Step 1 extract JD requirements, Step 2 compare with resume
//        Requires a resume source and a job description
router.post('/ats-analyze', protect, upload.single('resume'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const useStoredResume = String(req.body.useStoredResume ?? 'true') !== 'false';

    let resumeText = '';

    // Priority 1: freshly uploaded file
    if (req.file) {
      const extracted = await analyzeResume(req.file.buffer, req.file.mimetype);
      resumeText = extracted.rawText || '';
      // Persist the new resume to DB
      user.resume = {
        fileName:   req.file.originalname,
        uploadedAt: new Date(),
        text:       resumeText,
        skills:     extracted.technicalSkills || [],
        atsScore:   0,
        experience: extracted.experience || [],
        education:  extracted.education  || [],
      };
    }

    // Priority 2: resume text from request body
    if (!resumeText && req.body.resumeText) {
      resumeText = req.body.resumeText;
    }

    // Priority 3: already-stored resume in DB, only when explicitly enabled
    if (!resumeText && useStoredResume && user.resume?.text) {
      resumeText = user.resume.text;
    }

    if (!resumeText || resumeText.trim().length < 30) {
      return res.status(400).json({
        message: 'No resume found. Please upload a resume file or ensure you have a saved resume.'
      });
    }

    const jobDescription = req.body.jobDescription || '';
    if (!jobDescription.trim() || jobDescription.trim().length < 30) {
      return res.status(400).json({
        message: 'Job description is required. Please paste the full job description before analyzing.'
      });
    }

    // ── Step 1: Extract JD Requirements ──────────────────────────────────
    let jdRequirements = null;
    let jdExtracted = false;
    try {
      jdRequirements = await extractJDRequirements(jobDescription);
      jdExtracted = true;
    } catch (jdErr) {
      console.warn('JD extraction failed, falling back to generic analysis:', jdErr.message);
    }

    // ── Step 2: Full ATS Analysis ─────────────────────────────────────────
    const atsResult = await analyzeResumeAgainstJD(resumeText, jdRequirements);

    // Persist updated ATS score to DB
    if (user.resume) {
      user.resume.atsScore = atsResult.atsScore;
    }
    await user.save();

    res.json({
      success: true,
      jdExtracted,
      jdRequirements: jdExtracted ? jdRequirements : null,
      ...atsResult,
    });
  } catch (err) {
    console.error('ATS analyze error:', err.message);
    res.status(500).json({ message: err.message || 'ATS analysis failed' });
  }
});

module.exports = router;
