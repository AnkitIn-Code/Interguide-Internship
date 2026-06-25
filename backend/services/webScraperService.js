/**
 * webScraperService.js
 *
 * Fetches 45-60 TECH-ONLY internships from multiple free public APIs.
 * Sources:
 *  1. Adzuna (paid free-tier API) — PINNED at top
 *  2. Arbeitnow (free API)        — tech keywords filter
 *  3. Remotive (free API)         — software / dev category
 *  4. Findwork.dev (free)         — tech filter
 */

const axios    = require('axios');
const https    = require('https');
const Internship = require('../models/Internship');

const ADZUNA_APP_ID  = process.env.ADZUNA_APP_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;

/* ─── Tech keywords ──────────────────────────────────────────────── */
const TECH_KEYWORDS = [
  'developer', 'engineer', 'intern', 'software', 'frontend', 'backend',
  'fullstack', 'full stack', 'react', 'node', 'python', 'java', 'javascript',
  'typescript', 'angular', 'vue', 'devops', 'cloud', 'data', 'ml',
  'machine learning', 'ai', 'artificial intelligence', 'mobile', 'android',
  'ios', 'flutter', 'kotlin', 'swift', 'blockchain', 'cybersecurity',
  'qa', 'testing', 'sre', 'systems', 'infrastructure', 'api', 'microservices',
  'product', 'ui', 'ux', 'design',
];

const SKILL_KEYWORDS = [
  'react', 'node', 'python', 'java', 'javascript', 'typescript', 'sql', 'aws',
  'docker', 'git', 'linux', 'css', 'html', 'mongodb', 'postgresql', 'redis',
  'graphql', 'rest', 'api', 'django', 'flask', 'spring', 'kubernetes',
  'terraform', 'azure', 'gcp', 'pandas', 'numpy', 'scikit', 'tensorflow',
  'pytorch', 'flutter', 'kotlin', 'swift', 'go', 'rust', 'c++', 'c#',
  'angular', 'vue', 'next.js', 'express', 'fastapi', 'microservices',
];

const isTechRole = (title, description = '') => {
  const combined = `${title} ${description}`.toLowerCase();
  return TECH_KEYWORDS.some(kw => combined.includes(kw));
};

const extractSkills = (text = '') => {
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter(skill => lower.includes(skill));
};

function stripHtml(s = '') {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ─── Source 1: Adzuna (PINNED at top) ───────────────────────────── */
const fetchAdzuna = async () => {
  const results = [];
  if (!ADZUNA_APP_ID || !ADZUNA_API_KEY) {
    console.warn('[Adzuna] No credentials found — skipping');
    return results;
  }
  try {
    // Search for internships specifically using "intern" keyword in India
    const resp = await axios.get(
      'https://api.adzuna.com/v1/api/jobs/in/search/1',
      {
        params: {
          app_id:           ADZUNA_APP_ID,
          app_key:          ADZUNA_API_KEY,
          what:             'intern',
          results_per_page: 20,
          sort_by:          'date',
          content_type:     'application/json',
        },
        httpsAgent: new https.Agent({ family: 4 }),
        timeout: 10000,
      }
    );

    const jobs = resp.data?.results || [];
    for (const job of jobs) {
      const descPlain = stripHtml(job.description || '');
      if (!isTechRole(job.title, descPlain)) continue;
      results.push({
        externalId:    `adzuna-${job.id}`,
        title:         job.title,
        company:       job.company?.display_name || 'Unknown',
        description:   descPlain.slice(0, 500),
        url:           job.redirect_url,
        source:        'Adzuna',
        isAdzuna:      true,
        location:      job.location?.display_name || 'India',
        isRemote:      false,
        domain:        'Technology',
        stipend:       job.salary_min ? Math.round(job.salary_min / 12) : undefined,
        requiredSkills: extractSkills(descPlain),
        postedAt:      job.created ? new Date(job.created) : new Date(),
      });
      if (results.length >= 15) break;
    }
    console.log(`[Adzuna] Fetched ${results.length} internships`);
  } catch (err) {
    console.error('[Adzuna] Error:', err.message);
  }
  return results;
};

/* ─── Source 2: Arbeitnow ────────────────────────────────────────── */
const fetchArbeitnow = async () => {
  const results = [];
  try {
    const resp = await axios.get('https://www.arbeitnow.com/api/job-board-api', { timeout: 8000 });
    const jobs = resp.data?.data || [];
    for (const job of jobs) {
      if (!isTechRole(job.title, job.description)) continue;
      results.push({
        externalId:    `arbeitnow-${job.slug}`,
        title:         job.title,
        company:       job.company_name || 'Unknown',
        description:   (job.description || '').slice(0, 500),
        url:           job.url,
        source:        'Arbeitnow',
        isAdzuna:      false,
        location:      job.location || 'Remote',
        isRemote:      Boolean(job.remote),
        domain:        'Technology',
        requiredSkills: extractSkills(job.description),
        postedAt:      job.created_at ? new Date(job.created_at * 1000) : new Date(),
      });
      if (results.length >= 20) break;
    }
  } catch (err) {
    console.error('[Arbeitnow] Error:', err.message);
  }
  return results;
};

/* ─── Source 3: Remotive ─────────────────────────────────────────── */
const fetchRemotive = async () => {
  const results = [];
  try {
    const resp = await axios.get(
      'https://remotive.com/api/remote-jobs?category=software-dev&limit=40',
      { timeout: 8000 }
    );
    const jobs = resp.data?.jobs || [];
    for (const job of jobs) {
      if (!isTechRole(job.title, job.description)) continue;
      results.push({
        externalId:    `remotive-${job.id}`,
        title:         job.title,
        company:       job.company_name || 'Unknown',
        description:   (job.description || '').replace(/<[^>]+>/g, '').slice(0, 500),
        url:           job.url,
        source:        'Remotive',
        isAdzuna:      false,
        location:      job.candidate_required_location || 'Remote',
        isRemote:      true,
        domain:        'Software Development',
        requiredSkills: extractSkills(job.description || ''),
        postedAt:      job.publication_date ? new Date(job.publication_date) : new Date(),
      });
      if (results.length >= 15) break;
    }
  } catch (err) {
    console.error('[Remotive] Error:', err.message);
  }
  return results;
};

/* ─── Source 4: Findwork.dev ─────────────────────────────────────── */
const fetchFindwork = async () => {
  const results = [];
  try {
    const resp = await axios.get(
      'https://findwork.dev/api/jobs/?role=software+engineer&order_by=-date',
      { timeout: 8000 }
    );
    const jobs = resp.data?.results || [];
    for (const job of jobs) {
      if (!isTechRole(job.role, job.text)) continue;
      results.push({
        externalId:    `findwork-${job.id}`,
        title:         job.role,
        company:       job.company_name || 'Unknown',
        description:   (job.text || '').slice(0, 500),
        url:           job.url,
        source:        'Findwork',
        isAdzuna:      false,
        location:      job.location || 'Remote',
        isRemote:      job.remote,
        domain:        'Software Engineering',
        requiredSkills: Array.isArray(job.keywords) ? job.keywords.slice(0, 10) : extractSkills(job.text || ''),
        postedAt:      job.date_posted ? new Date(job.date_posted) : new Date(),
      });
      if (results.length >= 12) break;
    }
  } catch (err) {
    console.error('[Findwork] Error:', err.message);
  }
  return results;
};

/* ─── Main: scrapeAll — fetch fresh data, upsert into DB ─────────── */
const scrapeAll = async () => {
  console.log('[Scraper] Starting tech internship scrape (Adzuna + Arbeitnow + Remotive + Findwork)...');

  const [adzuna, arbeitnow, remotive, findwork] = await Promise.allSettled([
    fetchAdzuna(),
    fetchArbeitnow(),
    fetchRemotive(),
    fetchFindwork(),
  ]);

  // Adzuna results first so they get pinned at the top of DB queries
  const allJobs = [
    ...(adzuna.status    === 'fulfilled' ? adzuna.value    : []),
    ...(arbeitnow.status === 'fulfilled' ? arbeitnow.value : []),
    ...(remotive.status  === 'fulfilled' ? remotive.value  : []),
    ...(findwork.status  === 'fulfilled' ? findwork.value  : []),
  ];

  let added   = 0;
  let updated = 0;

  for (const job of allJobs) {
    try {
      const existing = await Internship.findOne({ externalId: job.externalId });
      if (!existing) {
        await Internship.create({
          ...job,
          lastSeenAt: new Date(),
        });
        added++;
      } else {
        await Internship.findOneAndUpdate(
          { externalId: job.externalId },
          {
            $set: {
              title: job.title,
              company: job.company,
              description: job.description,
              url: job.url,
              source: job.source,
              location: job.location,
              isRemote: job.isRemote,
              isAdzuna: job.isAdzuna,
              domain: job.domain,
              stipend: job.stipend,
              duration: job.duration,
              requiredSkills: job.requiredSkills,
              lastSeenAt: new Date(),
            },
          }
        );
        updated++;
      }
    } catch (err) {
      if (!err.code || err.code !== 11000) {
        console.error('[Scraper] Insert error:', err.message);
      }
    }
  }

  console.log(`[Scraper] Done — added: ${added}, updated: ${updated}, total fetched: ${allJobs.length}`);
  return { added, updated, total: allJobs.length };
};

/* ─── getFreshTechInternships — Adzuna pinned at top ─────────────── */
const getFreshTechInternships = async (limit = 50) => {
  const adzunaResults = await Internship.find({ isAdzuna: true })
    .sort('-postedAt')
    .limit(15);

  const otherResults = await Internship.find({ isAdzuna: { $ne: true }, domain: { $exists: true } })
    .sort('-postedAt')
    .limit(limit - adzunaResults.length);

  return [...adzunaResults, ...otherResults];
};

module.exports = { scrapeAll, getFreshTechInternships };
