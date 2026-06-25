import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Loader2, Bookmark, ChevronLeft, ChevronRight, X, Briefcase, DollarSign, Award, SlidersHorizontal, ChevronDown } from 'lucide-react';
import axios from '../../utils/axios';
import JobDetailsModal from '../../components/JobDetailsModal';
import SkeletonJobCard from '../../components/SkeletonJobCard';
import SmartImage from '../../components/ui/SmartImage';
import Header from '../../components/ui/Header';

const PAGE_SIZE = 12;

/* ─── Filter definitions ───────────────────────────────────────────── */
const JOB_TYPES   = ['Any', 'Full Time', 'Part Time', 'Contract', 'Internship', 'Remote'];
const SALARY_OPTS = ['Any', '< ₹5L', '₹5L – 10L', '₹10L – 20L', '₹20L+', 'Salary Mentioned'];
const EXP_OPTS    = ['Any', 'Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead'];

/* ─── Helpers ──────────────────────────────────────────────────────── */
function matchesType(job, filter) {
    if (filter === 'Any') return true;
    const t = (job.type || '').toLowerCase();
    const f = filter.toLowerCase();
    if (f === 'remote') return t.includes('remote') || (job.location || '').toLowerCase().includes('remote');
    if (f === 'full time') return t.includes('full') || t === 'permanent';
    if (f === 'part time') return t.includes('part');
    if (f === 'contract') return t.includes('contract') || t.includes('freelance');
    if (f === 'internship') return t.includes('intern');
    return t.includes(f);
}
function matchesSalary(job, filter) {
    if (filter === 'Any') return true;
    const s = (job.salary || '').toLowerCase();
    if (filter === 'Salary Mentioned') return s && s !== 'not specified' && s !== 'salary undisclosed';
    // Try to extract a numeric value for comparison
    const nums = s.match(/[\d,]+/g);
    if (!nums || nums.length === 0) return false;
    const max = Math.max(...nums.map(n => parseInt(n.replace(/,/g, ''), 10)));
    // Convert to lakhs if the value looks like rupees
    const inLakhs = max > 100000 ? max / 100000 : max;
    if (filter === '< ₹5L') return inLakhs < 5;
    if (filter === '₹5L – 10L') return inLakhs >= 5 && inLakhs <= 10;
    if (filter === '₹10L – 20L') return inLakhs > 10 && inLakhs <= 20;
    if (filter === '₹20L+') return inLakhs > 20;
    return true;
}
function matchesExperience(job, filter) {
    if (filter === 'Any') return true;
    const combined = `${job.title || ''} ${job.type || ''} ${job.snippet || ''}`.toLowerCase();
    const f = filter.toLowerCase();
    if (f === 'entry level') return combined.includes('entry') || combined.includes('fresher') || combined.includes('junior') || combined.includes('graduate');
    if (f === 'junior') return combined.includes('junior') || combined.includes('jr') || combined.includes('associate');
    if (f === 'mid-level') return combined.includes('mid') || combined.includes('intermediate') || combined.includes('3+') || combined.includes('4+');
    if (f === 'senior') return combined.includes('senior') || combined.includes('sr') || combined.includes('5+') || combined.includes('6+');
    if (f === 'lead') return combined.includes('lead') || combined.includes('principal') || combined.includes('staff') || combined.includes('architect');
    return true;
}

/* ─── Dropdown Component ───────────────────────────────────────────── */
const FilterDropdown = ({ icon: IconComp, label, options, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const isActive = value !== 'Any';
    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap border ${
                    isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
                <IconComp className="w-3.5 h-3.5" />
                {isActive ? value : label}
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 w-48 z-50" style={{ animation: 'fadeSlideDown 0.15s ease-out' }}>
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                                value === opt
                                    ? 'text-blue-600 bg-blue-50/80 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {opt}
                            {value === opt && <span className="float-right text-blue-500">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─── JobCard ──────────────────────────────────────────────────────── */
const JobCard = ({ job, onClick, initiallySaved, onToggleSave }) => {
    const [saved, setSaved] = useState(initiallySaved);
    useEffect(() => { setSaved(initiallySaved); }, [initiallySaved]);

    const handleSave = async (e) => {
        e.stopPropagation();
        try {
            const jobId = job._id || job.id || job.link || `${job.title}-${job.company}`.replace(/\s+/g, '-').toLowerCase();
            if (saved) {
                await axios.delete('/jobs/unsave', { data: { jobId } });
                setSaved(false);
                onToggleSave?.(jobId, false);
            } else {
                await axios.post('/jobs/save', { job });
                setSaved(true);
                onToggleSave?.(jobId, true);
            }
        } catch (err) {
            console.error('Failed to toggle save:', err);
        }
    };

    const typeLabel = (job.type || 'Full Time').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const isRemote = (job.location || '').toLowerCase().includes('remote');

    return (
        <div
            onClick={() => onClick(job)}
            className="group bg-white rounded-2xl p-4 border border-slate-100 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/5 hover:border-blue-100 hover:-translate-y-0.5 relative"
        >
            <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl border border-slate-100 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white shadow-sm shrink-0 overflow-hidden">
                        <SmartImage
                            src={job.logo}
                            alt={job.company}
                            className="w-6 h-6 object-contain rounded"
                            containerClassName="w-full h-full flex items-center justify-center"
                            fallbackIcon={() => (
                                <span className="font-bold text-base text-blue-600">
                                    {(job.company || '?').charAt(0).toUpperCase()}
                                </span>
                            )}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-[14px] leading-tight mb-0.5 truncate group-hover:text-blue-700 transition-colors">
                            {job.title}
                        </h4>
                        <p className="text-[12px] font-medium text-slate-500 truncate">{job.company}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className={`shrink-0 p-1.5 rounded-lg transition-all ${
                        saved
                            ? 'text-white bg-blue-600 shadow-sm'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                    <Bookmark className="w-4 h-4" strokeWidth={2.5} fill={saved ? 'currentColor' : 'none'} />
                </button>
            </div>

            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200/80 rounded-md text-[10px] font-semibold text-slate-600">
                    <Briefcase className="w-2.5 h-2.5" />{typeLabel}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                    isRemote
                        ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
                        : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                    <MapPin className="w-2.5 h-2.5" />{isRemote ? 'Remote' : 'Onsite'}
                </span>
                {job.source && (
                    <span className="px-2 py-0.5 bg-violet-50 border border-violet-200/80 rounded-md text-[10px] font-semibold text-violet-600">
                        {job.source}
                    </span>
                )}
            </div>

            <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400 truncate max-w-[60%]">
                    {job.location || 'Location not specified'}
                </span>
                {job.salary && job.salary !== 'Not specified' && job.salary !== 'Salary Undisclosed' && (
                    <span className="text-[12px] font-bold text-blue-600 truncate">{job.salary}</span>
                )}
            </div>
        </div>
    );
};

/* ─── Main Component ───────────────────────────────────────────────── */
const AiJobSearch = () => {
    const navigate = useNavigate();
    // Search state
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [rawJobs, setRawJobs] = useState([]);   // unfiltered results from API
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [savedJobsIds, setSavedJobsIds] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);

    // Filter state
    const [typeFilter, setTypeFilter] = useState('Any');
    const [salaryFilter, setSalaryFilter] = useState('Any');
    const [expFilter, setExpFilter] = useState('Any');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const resultsRef = useRef(null);

    /* ─── Derived: apply client-side filters ─────────────────────── */
    const filteredJobs = useMemo(() => {
        return rawJobs.filter(job =>
            matchesType(job, typeFilter) &&
            matchesSalary(job, salaryFilter) &&
            matchesExperience(job, expFilter)
        );
    }, [rawJobs, typeFilter, salaryFilter, expFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
    const paginatedJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [typeFilter, salaryFilter, expFilter]);

    /* ─── Fetch saved jobs on mount ──────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get('/jobs/saved');
                const ids = new Set(
                    (res.data.jobs || []).map(sj => sj._id || sj.id || sj.link || `${sj.title}-${sj.company}`.replace(/\s+/g, '-').toLowerCase())
                );
                setSavedJobsIds(ids);
            } catch { /* ignore — user might not be logged in */ }
        })();
    }, []);

    /* ─── Search ─────────────────────────────────────────────────── */
    const handleSearch = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (!role.trim()) return;
        setLoading(true);
        setError(null);
        setHasSearched(true);
        setCurrentPage(1);
        try {
            const res = await axios.get('/jobs/search', {
                params: { role: role.trim(), location: location.trim() || undefined }
            });
            setRawJobs(res.data.jobs || []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch jobs. Please try again.');
            setRawJobs([]);
        } finally {
            setLoading(false);
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [role, location]);

    /* ─── Active filter count badge ──────────────────────────────── */
    const activeFilterCount = [typeFilter, salaryFilter, expFilter].filter(f => f !== 'Any').length;
    const clearFilters = () => { setTypeFilter('Any'); setSalaryFilter('Any'); setExpFilter('Any'); };

    /* ─── Pagination ─────────────────────────────────────────────── */
    const goToPage = (p) => {
        const page = Math.max(1, Math.min(p, totalPages));
        setCurrentPage(page);
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const pageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
        return [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    };

    const getJobId = (job) => job._id || job.id || job.link || `${job.title}-${job.company}`.replace(/\s+/g, '-').toLowerCase();

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            {/* ─── Search Header ─────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-6 sm:pt-10 sm:pb-10">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/main-dashboard')}
                        className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-sm font-semibold transition-all backdrop-blur-sm border border-white/20"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5 tracking-tight">
                        Discover Jobs
                    </h1>
                    <p className="text-blue-100/80 text-sm sm:text-base mb-6 sm:mb-8 font-medium">
                        Search across multiple job boards simultaneously
                    </p>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 shadow-2xl shadow-blue-900/20 flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-300 transition-all">
                            <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-2.5" />
                            <input
                                type="text"
                                placeholder="Job title, keyword, or company"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="bg-transparent w-full text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-medium"
                            />
                        </div>
                        <div className="sm:w-56 flex items-center bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-300 transition-all">
                            <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-2.5" />
                            <input
                                type="text"
                                placeholder="City or remote"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="bg-transparent w-full text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !role.trim()}
                            className="sm:w-32 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/25"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Search</>}
                        </button>
                    </form>
                </div>
            </div>

            {/* ─── Filter Bar ────────────────────────────────────────── */}
            {hasSearched && (
                <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
                    <div className="max-w-5xl mx-auto px-4 py-3">
                        {/* Desktop filters */}
                        <div className="hidden sm:flex items-center gap-2.5 flex-wrap">
                            <FilterDropdown icon={Briefcase} label="Job Type" options={JOB_TYPES} value={typeFilter} onChange={setTypeFilter} />
                            <FilterDropdown icon={DollarSign} label="Salary" options={SALARY_OPTS} value={salaryFilter} onChange={setSalaryFilter} />
                            <FilterDropdown icon={Award} label="Experience" options={EXP_OPTS} value={expFilter} onChange={setExpFilter} />

                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" /> Clear ({activeFilterCount})
                                </button>
                            )}

                            <span className="ml-auto text-sm font-semibold text-slate-500">
                                {filteredJobs.length} {filteredJobs.length === 1 ? 'result' : 'results'}
                            </span>
                        </div>

                        {/* Mobile filter toggle */}
                        <div className="sm:hidden flex items-center justify-between">
                            <button
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                                    activeFilterCount > 0
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-slate-600 border-slate-200'
                                }`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                            </button>
                            <span className="text-sm font-semibold text-slate-500">
                                {filteredJobs.length} results
                            </span>
                        </div>

                        {/* Mobile filter panel */}
                        {showMobileFilters && (
                            <div className="sm:hidden mt-3 flex flex-wrap gap-2 pb-1">
                                <FilterDropdown icon={Briefcase} label="Job Type" options={JOB_TYPES} value={typeFilter} onChange={setTypeFilter} />
                                <FilterDropdown icon={DollarSign} label="Salary" options={SALARY_OPTS} value={salaryFilter} onChange={setSalaryFilter} />
                                <FilterDropdown icon={Award} label="Experience" options={EXP_OPTS} value={expFilter} onChange={setExpFilter} />
                                {activeFilterCount > 0 && (
                                    <button onClick={clearFilters} className="text-red-500 text-xs font-bold px-2 py-1">
                                        Clear All
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Results ───────────────────────────────────────────── */}
            <div ref={resultsRef} className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonJobCard key={i} />)}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-red-500 font-semibold">{error}</p>
                        <button onClick={handleSearch} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty state — before search */}
                {!loading && !hasSearched && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                            <Search className="w-10 h-10 text-blue-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Search for your next opportunity</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                            Enter a job title or keyword above to search across multiple job boards simultaneously.
                        </p>
                    </div>
                )}

                {/* Empty state — no results */}
                {!loading && hasSearched && filteredJobs.length === 0 && !error && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No jobs found</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                            {rawJobs.length > 0
                                ? `Found ${rawJobs.length} jobs but none match your current filters. Try adjusting your filters.`
                                : 'Try a different search term or location.'}
                        </p>
                        {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}

                {/* Results grid */}
                {!loading && filteredJobs.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedJobs.map((job) => {
                                const jobId = getJobId(job);
                                return (
                                    <JobCard
                                        key={jobId}
                                        job={job}
                                        onClick={setSelectedJob}
                                        initiallySaved={savedJobsIds.has(jobId)}
                                        onToggleSave={(id, isSaved) => {
                                            const newIds = new Set(savedJobsIds);
                                            if (isSaved) newIds.add(id); else newIds.delete(id);
                                            setSavedJobsIds(newIds);
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-1.5 mt-8 mb-4">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {pageNumbers().map((p, i, arr) => (
                                    <div key={p} className="flex items-center gap-1.5">
                                        {i > 0 && arr[i - 1] !== p - 1 && (
                                            <span className="text-slate-400 text-sm px-1">…</span>
                                        )}
                                        <button
                                            onClick={() => goToPage(p)}
                                            className={`w-9 h-9 rounded-xl text-[13px] font-bold transition-all ${
                                                p === currentPage
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-200'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Job details modal */}
            <JobDetailsModal
                job={selectedJob}
                onClose={() => setSelectedJob(null)}
                initiallySaved={selectedJob ? savedJobsIds.has(getJobId(selectedJob)) : false}
                onToggleSave={(jobId, isSaved) => {
                    const newIds = new Set(savedJobsIds);
                    if (isSaved) newIds.add(jobId); else newIds.delete(jobId);
                    setSavedJobsIds(newIds);
                }}
            />

            {/* Inline animation keyframe */}
            <style>{`
                @keyframes fadeSlideDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AiJobSearch;
