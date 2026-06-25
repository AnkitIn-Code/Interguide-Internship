const pdfParse  = require('pdf-parse');
const mammoth   = require('mammoth');
const axios     = require('axios');

/* ─── Extract raw text from buffer ────────────────────────────────────── */
const extractText = async (fileBuffer, mimeType) => {
  if (mimeType === 'application/pdf') {
    const buf = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    const data = await pdfParse(buf);
    return data.text || '';
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const buf = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value || '';
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
};

/* ─── Call DeepSeek v4 Pro via Fireworks ──────────────────────────────── */
const callDeepSeek = async (prompt, maxTokens = 4096) => {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) throw new Error('FIREWORKS_API_KEY not set in environment');

  const response = await axios.post(
    'https://api.fireworks.ai/inference/v1/chat/completions',
    {
      model: 'accounts/fireworks/models/deepseek-v4-pro',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.1,       // lower temperature → more deterministic JSON
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 90000,         // 90 seconds
    }
  );

  return response.data.choices?.[0]?.message?.content?.trim() || '';
};

/* ─── Strip markdown code fences ──────────────────────────────────────── */
const stripCodeFences = (text) =>
  text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

/* ─── Robust JSON fixer: tries to recover truncated/malformed JSON ──────── */
const tryParseJSON = (raw) => {
  const cleaned = stripCodeFences(raw);

  // First attempt: direct parse
  try { return JSON.parse(cleaned); } catch (_) {}

  // Second attempt: extract the outermost {...} block
  const firstBrace = cleaned.indexOf('{');
  const lastBrace  = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)); } catch (_) {}
  }

  // Third attempt: try to close truncated JSON by appending closing braces
  if (firstBrace !== -1) {
    let partial = cleaned.slice(firstBrace);
    // Count unclosed brackets
    let opens  = 0;
    let arrOpen = 0;
    let inStr   = false;
    let escape  = false;
    for (const ch of partial) {
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inStr) { escape = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') opens++;
      if (ch === '}') opens--;
      if (ch === '[') arrOpen++;
      if (ch === ']') arrOpen--;
    }
    // Close any dangling string, arrays and objects
    let patched = partial;
    if (inStr) patched += '"';         // close open string
    patched += ']'.repeat(Math.max(0, arrOpen));
    patched += '}'.repeat(Math.max(0, opens));
    try { return JSON.parse(patched); } catch (_) {}
  }

  return null;
};

/* ─── Main analyzeResume ───────────────────────────────────────────────── */
const analyzeResume = async (fileBuffer, mimeType) => {
  /* 1. Extract text */
  let rawText = '';
  try {
    rawText = await extractText(fileBuffer, mimeType);
  } catch (e) {
    console.error('Text extraction error:', e.message);
    throw e;
  }

  if (!rawText || rawText.trim().length < 30) {
    throw new Error('No readable text found in the uploaded file.');
  }

  /* 2. Trim to ~3500 chars to leave room for the response */
  const truncatedText = rawText.slice(0, 3500);

  /* 3. Build AI prompt — keep schema small, use compact JSON notation */
  const prompt = `You are an expert ATS resume analyzer. Analyze the resume and return ONLY a valid JSON object with NO markdown fences, NO explanations, just raw JSON.

Schema (fill all fields):
{"contactInfo":{"fullName":"","email":"","phone":"","linkedin":""},"technicalSkills":[],"softSkills":[],"education":[{"degree":"","institution":"","field":"","year":""}],"experience":[{"title":"","company":"","duration":"","description":""}],"profileStrength":0,"atsScore":0,"missingElements":[]}

Rules:
- technicalSkills: ALL technical skills, languages, tools, frameworks found
- softSkills: communication, teamwork, leadership etc.
- profileStrength: 0-100 based on completeness
- atsScore: 0-100 based on keyword density and structure
- missingElements: what is missing from the resume
- Use empty string or [] for missing data
- Return ONLY the JSON object

RESUME:
${truncatedText}`;

  /* 4. Call DeepSeek with higher token budget */
  let rawResponse = '';
  try {
    rawResponse = await callDeepSeek(prompt, 4096);
  } catch (e) {
    console.error('DeepSeek API error:', e.response?.data || e.message);
    throw new Error(`AI analysis failed: ${e.message}`);
  }

  /* 5. Parse JSON with fallback recovery */
  let parsed = tryParseJSON(rawResponse);
  if (!parsed) {
    console.warn('JSON parse failed, using default structure. Raw (first 500):', rawResponse.slice(0, 500));
    parsed = {
      contactInfo: {},
      technicalSkills: [],
      softSkills: [],
      education: [],
      experience: [],
      profileStrength: 0,
      atsScore: 0,
      missingElements: ['AI analysis could not parse the resume structure'],
    };
  }

  /* 6. Attach raw text for storage */
  parsed.rawText = rawText;

  return parsed;
};

/* ─── Step 1: Extract structured requirements from a JD ───────────────── */
const extractJDRequirements = async (jobDescription) => {
  const prompt = `Extract structured requirements from this job description.
Return ONLY a valid JSON object (no markdown):
{"requiredSkills":[],"preferredSkills":[],"tools":[],"technologies":[],"softSkills":[],"educationRequirements":[],"experienceRequirements":[],"keywords":[]}

Job Description:
${jobDescription.slice(0, 2500)}`;

  const raw = await callDeepSeek(prompt, 2048);
  const parsed = tryParseJSON(raw);
  if (parsed) return parsed;
  return {
    requiredSkills: [], preferredSkills: [], tools: [], technologies: [],
    softSkills: [], educationRequirements: [], experienceRequirements: [], keywords: []
  };
};

/* ─── Step 2: Full ATS analysis against extracted JD requirements ──────── */
const analyzeResumeAgainstJD = async (resumeText, jdRequirements) => {
  const jdContext = jdRequirements
    ? `\n\nJOB REQUIREMENTS:\n${JSON.stringify(jdRequirements)}`
    : '';

  const prompt = `You are an expert ATS Resume Analyzer.

Evaluate the resume against the job requirements and return ONLY valid raw JSON (no markdown):
{"atsScore":0,"skillMatchScore":0,"experienceScore":0,"projectScore":0,"keywordCoverageScore":0,"educationScore":0,"structureScore":0,"qualityScore":0,"matchedSkills":[],"missingSkills":[],"matchedKeywords":[],"missingKeywords":[],"strengths":[],"weaknesses":[],"recommendations":[],"resumeSections":{"contactInfo":true,"education":true,"experience":true,"skills":true,"projects":false,"certifications":false,"achievements":false},"recommendedLearningTopics":[],"recommendedInternshipDomains":[],"summary":""}

Scoring (total=100):
- skillMatchScore: 30pts (skill match)
- experienceScore: 20pts (experience relevance)
- projectScore: 15pts (project relevance)
- keywordCoverageScore: 20pts (keyword presence)
- educationScore: 5pts
- structureScore: 5pts
- qualityScore: 5pts

Return ONLY the JSON. Be objective and strict.

RESUME:
${resumeText.slice(0, 3500)}${jdContext}`;

  const raw = await callDeepSeek(prompt, 4096);
  const parsed = tryParseJSON(raw);

  if (!parsed) {
    console.error('ATS JSON parse error — raw (first 500):', raw.slice(0, 500));
    // Return a partial result rather than throwing — the frontend can show what we have
    return {
      atsScore: 0, skillMatchScore: 0, experienceScore: 0, projectScore: 0,
      keywordCoverageScore: 0, educationScore: 0, structureScore: 0, qualityScore: 0,
      matchedSkills: [], missingSkills: [], matchedKeywords: [], missingKeywords: [],
      strengths: [], weaknesses: [],
      recommendations: ['AI response was incomplete. Please try again.'],
      resumeSections: {},
      recommendedLearningTopics: [], recommendedInternshipDomains: [],
      summary: 'Analysis could not be completed. Please retry.',
    };
  }

  return {
    atsScore:               parsed.atsScore               ?? 0,
    skillMatchScore:        parsed.skillMatchScore        ?? 0,
    experienceScore:        parsed.experienceScore        ?? 0,
    projectScore:           parsed.projectScore           ?? 0,
    keywordCoverageScore:   parsed.keywordCoverageScore   ?? 0,
    educationScore:         parsed.educationScore         ?? 0,
    structureScore:         parsed.structureScore         ?? 0,
    qualityScore:           parsed.qualityScore           ?? 0,
    matchedSkills:          parsed.matchedSkills          ?? [],
    missingSkills:          parsed.missingSkills          ?? [],
    matchedKeywords:        parsed.matchedKeywords        ?? [],
    missingKeywords:        parsed.missingKeywords        ?? [],
    strengths:              parsed.strengths              ?? [],
    weaknesses:             parsed.weaknesses             ?? [],
    recommendations:        parsed.recommendations        ?? [],
    resumeSections:         parsed.resumeSections         ?? {},
    recommendedLearningTopics:    parsed.recommendedLearningTopics    ?? [],
    recommendedInternshipDomains: parsed.recommendedInternshipDomains ?? [],
    summary:                parsed.summary               ?? '',
  };
};

module.exports = { analyzeResume, extractJDRequirements, analyzeResumeAgainstJD };
