const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const https   = require('https');
const ADZUNA_APP_ID  = process.env.ADZUNA_APP_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;
const RAPIDAPI_KEY   = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST  = process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com';
const FINDWORK_KEY   = process.env.FINDWORK_API_KEY;
const JOOBLE_KEY     = process.env.JOOBLE_API_KEY;
const CAREERJET_KEY  = process.env.CAREERJET_API_KEY;
const MUSE_KEY       = process.env.MUSE_API_KEY;
const USAJOBS_KEY    = process.env.USAJOBS_API_KEY;
const USAJOBS_EMAIL  = process.env.USAJOBS_EMAIL;
const SERPAPI_KEY    = process.env.SERPAPI_KEY;
const cache        = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;
function getCacheKey(role, location, type) {
    return `${(role||'').toLowerCase()}|${(location||'').toLowerCase()}|${(type||'')}`;
}
const healthMap       = {};
const FAIL_THRESHOLD  = 3;
const COOLDOWN_MS     = 5 * 60 * 1000;
function isHealthy(name) {
    const h = healthMap[name];
    if (!h || h.failures < FAIL_THRESHOLD) return true;
    if (Date.now() - h.lastFail > COOLDOWN_MS) {
        healthMap[name] = { failures: 0, lastFail: null };
        return true;
    }
    return false;
}
function markFailed(name) {
    if (!healthMap[name]) healthMap[name] = { failures: 0, lastFail: null };
    healthMap[name].failures++;
    healthMap[name].lastFail = Date.now();
}
function markOk(name) { if (healthMap[name]) healthMap[name].failures = 0; }
function stripHtml(s = '') {
    let out = s
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"').replace(/&#x2F;/g, '/').replace(/&#39;/g, "'");
    out = out.replace(/<[^>]*>/g, ' ');
    return out.replace(/\s+/g, ' ').trim();
}
function snippet(s = '') { return stripHtml(s).slice(0, 200) + '...'; }
function titleMatchesRole(title = '', role = '') {
    if (!role || role.trim().length === 0) return true;
    const words  = role.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const tLower = title.toLowerCase();
    return words.length > 0 && words.some(w => tLower.includes(w));
}
function deduplicate(jobs) {
    const seen = new Set();
    return jobs.filter(j => {
        const k = `${(j.title||'').toLowerCase().trim()}|${(j.company||'').toLowerCase().trim()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}
function pickRandom(arr, n) {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}
function parseRSS(xml) {
    const items = [];
    const itemRx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRx.exec(xml)) !== null) {
        const raw = m[1];
        const get = tag => {
            const r = raw.match(new RegExp(
                `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`
            ));
            return r ? (r[1] || r[2] || '').trim() : '';
        };
        const link = get('link') || (raw.match(/<link>([^<]+)<\/link>/)||[])[1] || '';
        items.push({ title: get('title'), link, description: get('description'), pubDate: get('pubDate') });
    }
    return items;
}
async function safeFetch(name, fn) {
    for (let i = 0; i <= 1; i++) {
        try { const jobs = await fn(); markOk(name); return jobs; }
        catch (err) {
            if (i === 1) { markFailed(name); throw err; }
            await new Promise(r => setTimeout(r, 700));
        }
    }
}
const DIV = '─'.repeat(60);
function logDivider() { console.log(DIV); }
router.get('/search', async (req, res) => {
    try {
        let { role, location, type } = req.query;
        const isRecent = (!role && !location);

        if (!role) role = '';
        const cacheKey = getCacheKey(role, location, type);
        const cached   = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            if (cached.jobs && cached.jobs.length > 0) {
                logDivider();
                console.log(`  📦 CACHE HIT — "${role}" → ${cached.jobs.length} jobs  (no API calls)`);
                logDivider();
                return res.json({ success: true, count: cached.jobs.length, jobs: cached.jobs, fromCache: true });
            } else {
                logDivider();
                console.log(`  📦 CACHE HIT BUT 0 JOBS — "${role}" → fetching fresh data`);
                logDivider();
            }
        }
        const isRemote = !location || location.toLowerCase() === 'remote';
        const indiaLoc = !isRemote && location ? `${location}, India` : 'India';
        const pool = [];
        if (ADZUNA_APP_ID && ADZUNA_API_KEY && !isRecent) {
            pool.push({
                name: 'Adzuna', region: 'IN',
                fetch: () => axios.get('https://api.adzuna.com/v1/api/jobs/in/search/1', {
                    params: {
                        app_id: ADZUNA_APP_ID, app_key: ADZUNA_API_KEY,
                        what: role, where: !isRemote ? location : undefined,
                        results_per_page: 20, sort_by: 'date',
                    },
                    httpsAgent: new https.Agent({ family: 4 }),
                }).then(r => {
                    if (!r.data?.results?.length) return [];
                    let jobs = r.data.results.map(item => ({
                        title:    item.title,
                        company:  item.company?.display_name || 'Unknown',
                        location: item.location?.display_name || 'India',
                        type:     item.contract_time || 'Any',
                        salary:   item.salary_min && item.salary_max
                                    ? `₹${Math.round(item.salary_min).toLocaleString('en-IN')} – ₹${Math.round(item.salary_max).toLocaleString('en-IN')}`
                                    : 'Not specified',
                        link:    item.redirect_url,
                        snippet: snippet(item.description),
                        source: 'Adzuna', logo: null,
                    }));
                    if (type && type !== 'any') jobs = jobs.filter(j => j.type?.toLowerCase() === type.toLowerCase());
                    return jobs;
                }),
            });
        }
        if (JOOBLE_KEY && !isRecent) {
            pool.push({
                name: 'Jooble', region: 'IN',
                fetch: () => axios.post(
                    `https://jooble.org/api/${JOOBLE_KEY}`,
                    { keywords: role, location: indiaLoc, page: '1', resultonpage: '20' },
                    { headers: { 'Content-Type': 'application/json' } }
                ).then(r => {
                    if (!r.data?.jobs?.length) return [];
                    return r.data.jobs.map(item => ({
                        title:    stripHtml(item.title),
                        company:  item.company || 'Unknown',
                        location: item.location || 'India',
                        type:     item.type || 'Full-time',
                        salary:   item.salary || 'Not specified',
                        link:     item.link,
                        snippet:  snippet(item.snippet),
                        source: 'Jooble', logo: null,
                    }));
                }),
            });
        }
        if (CAREERJET_KEY && !isRecent) {
            pool.push({
                name: 'Careerjet', region: 'IN',
                fetch: () => axios.get('http://public.api.careerjet.net/search', {
                    params: {
                        keywords:  role,
                        location:  isRemote ? 'India' : indiaLoc,
                        affid:     CAREERJET_KEY,
                        pagesize:  20,
                        page:      1,
                        sort:      'date',
                        locale_code: 'en_IN',
                    },
                }).then(r => {
                    if (!r.data?.jobs?.length) return [];
                    return r.data.jobs.map(item => ({
                        title:    item.title,
                        company:  item.company || 'Unknown',
                        location: item.locations || 'India',
                        type:     item.jobtype || 'Full-time',
                        salary:   item.salary || 'Not specified',
                        link:     item.url,
                        snippet:  snippet(item.description),
                        source: 'Careerjet', logo: null,
                    }));
                }),
            });
        }
        if (FINDWORK_KEY && !isRecent) {
            pool.push({
                name: 'FindWork', region: 'IN',
                fetch: () => axios.get('https://findwork.dev/api/jobs/', {
                    params: { search: role, ...(isRemote ? { remote: true } : { location }), sort_by: 'date' },
                    headers: { Authorization: `Token ${FINDWORK_KEY}` },
                }).then(r => {
                    if (!r.data?.results?.length) return [];
                    return r.data.results.slice(0, 20).map(item => ({
                        title:    item.role,
                        company:  item.company_name,
                        location: item.location || (item.remote ? 'Remote' : 'On-site'),
                        type:     item.employment_type || 'Full-time',
                        salary:   'Not specified',
                        link:     item.url,
                        snippet:  snippet(item.text),
                        source: 'FindWork', logo: null,
                    }));
                }),
            });
        }
        if (RAPIDAPI_KEY && !isRecent) {
            pool.push({
                name: 'JSearch', region: 'IN',
                fetch: () => axios.request({
                    method:  'GET',
                    url:     `https://${RAPIDAPI_HOST}/search`,
                    params:  { query: isRemote ? role : `${role} ${indiaLoc}`, page: '1', num_pages: '2' },
                    headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST },
                }).then(r => {
                    if (!r.data?.data?.length) return [];
                    return r.data.data.slice(0, 20).map(item => ({
                        title:    item.job_title,
                        company:  item.employer_name,
                        location: item.job_city ? `${item.job_city}, ${item.job_country}` : 'Remote',
                        type:     item.job_employment_type || 'Full-time',
                        salary:   item.job_min_salary ? `$${item.job_min_salary} – $${item.job_max_salary}` : 'Not specified',
                        link:     item.job_apply_link || item.job_google_link || item.employer_website,
                        snippet:  snippet(item.job_description),
                        source: 'JSearch', logo: item.employer_logo || null,
                    }));
                }),
            });
        }
        pool.push({
            name: 'The Muse', region: 'IN',
            fetch: () => {
                const params = { page: Math.floor(Math.random() * 5), descending: true };
                if (MUSE_KEY && MUSE_KEY !== 'not_required') params.api_key = MUSE_KEY;
                return axios.get('https://www.themuse.com/api/public/jobs', { params }).then(r => {
                    if (!r.data?.results?.length) return [];
                    return r.data.results
                        .filter(item => titleMatchesRole(item.name, role))
                        .slice(0, 15)
                        .map(item => ({
                            title:    item.name,
                            company:  item.company?.name || 'Unknown',
                            location: item.locations?.map(l => l.name).join(', ') || 'Multiple',
                            type:     item.levels?.map(l => l.name).join(', ') || 'Full-time',
                            salary:   'Not specified',
                            link:     item.refs?.landing_page || '#',
                            snippet:  snippet(item.contents),
                            source: 'The Muse', logo: item.company?.refs?.logo_image || null,
                        }));
                });
            },
        });
        pool.push({
            name: 'Arbeitnow', region: 'IN',
            fetch: () => axios.get('https://www.arbeitnow.com/api/job-board-api', {
                params: { search: role, ...(isRemote ? { remote: true } : {}) },
            }).then(r => {
                if (!r.data?.data?.length) return [];
                return r.data.data.slice(0, 20).map(item => ({
                    title:    item.title,
                    company:  item.company_name || 'Unknown',
                    location: item.location || (item.remote ? 'Remote' : 'On-site'),
                    type:     item.job_types?.join(', ') || 'Full-time',
                    salary:   'Not specified',
                    link:     item.url,
                    snippet:  snippet(item.description),
                    source: 'Arbeitnow', logo: null,
                }));
            }),
        });
        if (SERPAPI_KEY && !isRecent) {
            pool.push({
                name: 'Google Jobs', region: 'IN',
                fetch: () => axios.get('https://serpapi.com/search', {
                    params: {
                        engine:   'google_jobs',
                        q:        isRemote ? role : `${role} ${indiaLoc}`,
                        location: isRemote ? 'India' : indiaLoc,
                        api_key:  SERPAPI_KEY,
                        hl:       'en',
                    },
                }).then(r => {
                    if (!r.data?.jobs_results?.length) return [];
                    return r.data.jobs_results.slice(0, 20).map(item => ({
                        title:    item.title,
                        company:  item.company_name,
                        location: item.location || 'India',
                        type:     item.detected_extensions?.schedule_type || 'Full-time',
                        salary:   item.detected_extensions?.salary || 'Not specified',
                        link:     item.related_links?.[0]?.link || item.share_link || '#',
                        snippet:  snippet(item.description),
                        source: 'Google Jobs', logo: item.thumbnail || null,
                    }));
                }),
            });
        }
        pool.push({
            name: 'RemoteOK', region: 'GLB',
            fetch: () => axios.get(`https://remoteok.com/api?tags=${encodeURIComponent(role)}`).then(r => {
                if (!Array.isArray(r.data) || r.data.length <= 1) return [];
                return r.data.slice(1, 21).map(item => ({
                    title:    item.position,
                    company:  item.company,
                    location: item.location || 'Remote',
                    type:     'Full-time',
                    salary:   item.salary_min ? `$${item.salary_min} – $${item.salary_max}` : 'Not specified',
                    link:     item.url,
                    snippet:  snippet(item.description),
                    source: 'RemoteOK', logo: item.company_logo || null,
                }));
            }),
        });
        pool.push({
            name: 'Jobicy', region: 'GLB',
            fetch: () => axios.get('https://jobicy.com/api/v2/remote-jobs', {
                params: { count: 20, tag: role.split(' ')[0] },
            }).then(r => {
                if (!r.data?.jobs?.length) return [];
                return r.data.jobs.slice(0, 20).map(item => ({
                    title:    item.jobTitle,
                    company:  item.companyName,
                    location: item.jobGeo || 'Remote',
                    type:     item.jobType || 'Full-time',
                    salary:   item.annualSalaryMin
                                ? `$${item.annualSalaryMin} – $${item.annualSalaryMax} ${item.salaryCurrency || 'USD'}`
                                : 'Not specified',
                    link:     item.url,
                    snippet:  snippet(item.jobExcerpt),
                    source: 'Jobicy', logo: item.companyLogo || null,
                }));
            }),
        });
        if (USAJOBS_KEY && USAJOBS_EMAIL && !isRecent) {
            pool.push({
                name: 'USAJobs', region: 'GLB',
                fetch: () => axios.get('https://data.usajobs.gov/api/search', {
                    params: { Keyword: role, ResultsPerPage: 20 },
                    headers: {
                        'Authorization-Key': USAJOBS_KEY,
                        'User-Agent':        USAJOBS_EMAIL,
                        'Host':              'data.usajobs.gov',
                    },
                }).then(r => {
                    const items = r.data?.SearchResult?.SearchResultItems;
                    if (!items?.length) return [];
                    return items.slice(0, 20).map(item => {
                        const m = item.MatchedObjectDescriptor;
                        return {
                            title:    m.PositionTitle,
                            company:  m.OrganizationName || 'US Government',
                            location: m.PositionLocation?.[0]?.LocationName || 'USA',
                            type:     m.PositionSchedule?.[0]?.Name || 'Full-time',
                            salary:   m.PositionRemuneration?.[0]
                                        ? `$${m.PositionRemuneration[0].MinimumRange} – $${m.PositionRemuneration[0].MaximumRange}`
                                        : 'Not specified',
                            link:     m.PositionURI,
                            snippet:  snippet(m.QualificationSummary || m.UserArea?.Details?.Requirements || ''),
                            source: 'USAJobs', logo: null,
                        };
                    });
                }),
            });
        }
        const healthyPool  = pool.filter(api => isHealthy(api.name));
        const skippedNames = pool.filter(api => !isHealthy(api.name)).map(a => a.name);
        const indianPool = healthyPool.filter(a => a.region === 'IN');
        const globalPool = healthyPool.filter(a => a.region === 'GLB');
        const picked = [
            ...pickRandom(indianPool, 3),
            ...pickRandom(globalPool, 2),
        ].sort(() => Math.random() - 0.5);
        logDivider();
        console.log(`  🔍 JOB SEARCH`);
        console.log(`     Role     : "${role}"`);
        console.log(`     Location : "${location || 'anywhere'}"   Remote: ${isRemote}`);
        console.log(`     Type     : "${type || 'any'}"`);
        logDivider();
        console.log(`  📡 Calling ${picked.length} of ${healthyPool.length} healthy  (pool: ${pool.length} sources)`);
        picked.forEach((api, i) => {
            const flag = api.region === 'IN' ? '🇮🇳' : '🌍';
            console.log(`     ${i + 1}. ${flag}  ${api.name}`);
        });
        if (skippedNames.length) console.log(`  ⚠️  Cooling down: ${skippedNames.join(', ')}`);
        console.log('');
        const t0      = Date.now();
        const results = await Promise.allSettled(
            picked.map(api =>
                safeFetch(api.name, api.fetch)
                    .then(jobs => { console.log(`  ✅ ${api.name.padEnd(18)} → ${jobs.length} jobs`); return jobs; })
                    .catch(err  => { console.error(`  ❌ ${api.name.padEnd(18)} → ${err.message}`); return []; })
            )
        );
        let allJobs = [];
        results.forEach(r => {
            if (r.status === 'fulfilled' && Array.isArray(r.value)) allJobs = allJobs.concat(r.value);
        });
        const raw     = allJobs.length;
        allJobs       = deduplicate(allJobs);
        if (location && location.trim().toLowerCase() !== 'remote') {
            const locLower = location.toLowerCase().trim();
            const locMain = locLower.split(',')[0].trim();
            allJobs = allJobs.filter(job => {
                const jobLoc = (job.location || '').toLowerCase();
                return jobLoc.includes(locLower) || locLower.includes(jobLoc) || (locMain && jobLoc.includes(locMain));
            });
        } else {
            allJobs = allJobs.filter(job => {
                const jobLoc = (job.location || '').toLowerCase();
                const jobType = (job.type ? String(job.type) : '').toLowerCase();
                return jobLoc.includes('remote') || jobLoc.includes('india') || jobLoc.includes('worldwide') || jobType.includes('remote');
            });
        }
        allJobs = allJobs.sort(() => Math.random() - 0.5);
        const elapsed = Date.now() - t0;
        console.log('');
        console.log(`  📊 ${raw} raw  →  ${allJobs.length} unique  (removed ${raw - allJobs.length} dupes)  ⏱ ${elapsed}ms`);
        logDivider();
        console.log('');
        cache.set(cacheKey, { jobs: allJobs, timestamp: Date.now() });
        res.json({
            success:    true,
            totalCount: allJobs.length,
            jobs:       allJobs,
        });
    } catch (error) {
        console.error('Job Search Error:', error);
        res.status(500).json({ message: 'Server Error fetching jobs', error: error.message });
    }
});
const auth = require('../middleware/auth');
const SavedJob = require('../models/SavedJob');
router.get('/saved', auth.protect, async (req, res) => {
    try {
        const currentId = req.user._id;
        if (currentId === (process.env.SUPER_ADMIN_ID || 'super_admin')) {
            return res.status(200).json({ success: true, count: 0, jobs: [], savedJobs: [] });
        }
        const savedJobs = await SavedJob.find({ userId: currentId }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: savedJobs.length,
            jobs: savedJobs.map(sj => sj.jobData),
            savedJobs: savedJobs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.post('/save', auth.protect, async (req, res) => {
    try {
        const { job } = req.body;
        if (!job) return res.status(400).json({ success: false, message: 'Job data required' });
        const jobId = job.link || `${job.title}-${job.company}`.replace(/\s+/g, '-').toLowerCase();
        const currentId = req.user._id;
        if (currentId === (process.env.SUPER_ADMIN_ID || 'super_admin')) {
            return res.status(400).json({ success: false, message: 'Super Admin cannot save jobs' });
        }
        const newSavedJob = await SavedJob.findOneAndUpdate(
            { userId: currentId, jobId },
            { jobData: job },
            { upsert: true, new: true }
        );
        res.status(200).json({ success: true, savedJob: newSavedJob });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.delete('/unsave', auth.protect, async (req, res) => {
    try {
        const { jobId } = req.body;
        if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });
        const currentId = req.user._id;
        if (currentId === (process.env.SUPER_ADMIN_ID || 'super_admin')) {
            return res.status(400).json({ success: false, message: 'Super Admin has no saved jobs' });
        }
        await SavedJob.findOneAndDelete({ userId: currentId, jobId });
        res.status(200).json({ success: true, message: 'Job removed from saved list' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
module.exports = router;
