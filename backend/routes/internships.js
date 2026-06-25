const express = require('express');
const router  = express.Router();
const Internship = require('../models/Internship');
const { scrapeAll } = require('../services/webScraperService');

/* ─── Helpers ─────────────────────────────────────────────────────── */
const TECH_KEYWORDS = [
  'developer', 'engineer', 'software', 'frontend', 'backend', 'fullstack',
  'full stack', 'react', 'node', 'python', 'java', 'javascript', 'typescript',
  'angular', 'vue', 'devops', 'cloud', 'data', 'ml', 'machine learning', 'ai',
  'mobile', 'android', 'ios', 'flutter', 'blockchain', 'cybersecurity',
  'qa', 'testing', 'sre', 'systems', 'infrastructure', 'api', 'microservices',
  'product', 'ui', 'ux', 'design', 'intern',
];

const isTech = (title = '', description = '') => {
  const c = `${title} ${description}`.toLowerCase();
  return TECH_KEYWORDS.some(kw => c.includes(kw));
};

const scoreForSkills = (internship, skills = []) => {
  if (!skills.length) return 0;
  const required = (internship.requiredSkills || []).map(s => s.toLowerCase());
  const matched  = skills.filter(s => required.includes(s.toLowerCase()));
  return matched.length / skills.length;
};

/* ─── GET /api/internships ─────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const internships = await Internship.find().sort('-postedAt').limit(limit);
    res.json({ success: true, data: internships });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* ─── GET /api/internships/latest ─────────────────────────────────── */
// Returns tech-only internships — Adzuna results pinned at top
router.get('/latest', async (req, res) => {
  try {
    const limit      = parseInt(req.query.limit) || 50;
    const skillsParam = req.query.skills || '';
    const userSkills  = skillsParam ? skillsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    const refresh     = req.query.refresh === 'true';

    // Trigger fresh scrape if requested
    if (refresh) {
      try { await scrapeAll(); } catch (scrapeErr) {
        console.error('[/latest] Refresh scrape error:', scrapeErr.message);
      }
    }

    // Auto-scrape if DB is thin
    const count = await Internship.countDocuments();
    if (count < 5) {
      try { await scrapeAll(); } catch {}
    }

    // Fetch all internships
    const all      = await Internship.find().sort('-postedAt').limit(300);
    const techOnly = all.filter(i => isTech(i.title, i.description));

    // Separate Adzuna from others
    const adzunaItems = techOnly.filter(i => i.isAdzuna);
    const otherItems  = techOnly.filter(i => !i.isAdzuna);

    // Skill-score if user provided skills
    const applyScore = (items) => {
      if (userSkills.length > 0) {
        return items
          .map(i => ({ ...i.toObject(), _matchScore: scoreForSkills(i, userSkills) }))
          .sort((a, b) => b._matchScore - a._matchScore);
      }
      return items.map(i => i.toObject ? i.toObject() : i);
    };

    // Adzuna ALWAYS first, then skill-sorted others
    const results = [
      ...applyScore(adzunaItems),
      ...applyScore(otherItems),
    ].slice(0, limit);

    res.json({ internships: results, adzunaCount: adzunaItems.length });
  } catch (err) {
    console.error('/internships/latest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ─── GET /api/internships/discover ───────────────────────────────── */
// Adzuna results pinned first, then paginated
router.get('/discover', async (req, res) => {
  try {
    const limit   = parseInt(req.query.limit)  || 9;
    const page    = parseInt(req.query.page)   || 1;
    const skills  = req.query.skills ? req.query.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const search  = req.query.search || '';

    const all      = await Internship.find().sort('-postedAt').limit(500);
    let techOnly   = all.filter(i => isTech(i.title, i.description));

    // Apply text search filter if provided
    if (search) {
      const q = search.toLowerCase();
      techOnly = techOnly.filter(i => {
        const company = (i.company?.name || i.company || '').toLowerCase();
        return (
          (i.title || '').toLowerCase().includes(q) ||
          company.includes(q) ||
          (i.location || '').toLowerCase().includes(q) ||
          (i.domain || '').toLowerCase().includes(q)
        );
      });
    }

    // Separate Adzuna vs others, apply skill scoring to each
    const applyScore = (items) => {
      if (skills.length > 0) {
        return items
          .map(i => ({ ...i.toObject(), _matchScore: scoreForSkills(i, skills) }))
          .sort((a, b) => b._matchScore - a._matchScore);
      }
      return items.map(i => i.toObject ? i.toObject() : i);
    };

    const adzunaItems = techOnly.filter(i => i.isAdzuna);
    const otherItems  = techOnly.filter(i => !i.isAdzuna);

    // Final ordered list: Adzuna first
    const ordered = [
      ...applyScore(adzunaItems),
      ...applyScore(otherItems),
    ];

    const total  = ordered.length;
    const pages  = Math.ceil(total / limit);
    const skip   = (page - 1) * limit;
    const paged  = ordered.slice(skip, skip + limit);

    res.json({
      success:      true,
      internships:  paged,
      data:         paged,
      adzunaCount:  adzunaItems.length,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* ─── POST /api/internships/refresh ───────────────────────────────── */
router.post('/refresh', async (req, res) => {
  try {
    const result   = await scrapeAll();
    const adzunaR  = await Internship.find({ isAdzuna: true }).sort('-postedAt').limit(15);
    const otherR   = await Internship.find({ isAdzuna: { $ne: true } }).sort('-postedAt').limit(35);
    const techOnly = [...adzunaR, ...otherR].filter(i => isTech(i.title, i.description));
    res.json({ success: true, ...result, internships: techOnly });
  } catch (err) {
    console.error('/internships/refresh error:', err);
    res.status(500).json({ success: false, message: 'Scrape failed: ' + err.message });
  }
});

module.exports = router;
