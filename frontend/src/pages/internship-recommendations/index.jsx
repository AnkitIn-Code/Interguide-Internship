import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import HelpDeskWidget from '../../components/ui/HelpDeskWidget';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import InternshipDetailModal from './InternshipDetailModal';
import { internshipAPI, userAPI } from '../../services/api';

const ITEMS_PER_PAGE = 9;

/* ─── Source Badge Colors ─────────────────────────────────────────── */
const sourceColors = {
  LinkedIn:    'bg-blue-100 text-blue-700',
  Internshala: 'bg-violet-100 text-violet-700',
  Naukri:      'bg-orange-100 text-orange-700',
  Arbeitnow:   'bg-emerald-100 text-emerald-700',
  Remotive:    'bg-cyan-100 text-cyan-700',
  Findwork:    'bg-indigo-100 text-indigo-700',
  Adzuna:      'bg-amber-100 text-amber-700',
  default:     'bg-gray-100 text-gray-600',
};

const formatDate = (d) => {
  try {
    const dt   = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const diff = Math.floor((Date.now() - dt) / 864e5);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7)  return `${diff}d ago`;
    return dt.toLocaleDateString();
  } catch { return ''; }
};

/* ─── Internship Card ─────────────────────────────────────────────── */
const DiscoverCard = ({ internship, onClick }) => {
  const isAdzuna  = internship.isAdzuna;
  const srcColor  = sourceColors[internship.source] || sourceColors.default;
  const logo      = internship.company?.logo || internship.companyLogo;
  const company   = internship.company?.name || internship.company || '';
  const skills    = Array.isArray(internship.requiredSkills) ? internship.requiredSkills : [];

  return (
    <div
      className={`bg-white rounded-2xl border p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group flex flex-col gap-3 cursor-pointer relative overflow-hidden ${
        isAdzuna
          ? 'border-amber-200 hover:border-amber-300 hover:shadow-amber-900/10 ring-1 ring-amber-100'
          : 'border-slate-100 hover:border-blue-100 hover:shadow-blue-900/6'
      }`}
      onClick={onClick}
    >
      {/* Adzuna accent strip */}
      {isAdzuna && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          {logo ? (
            <img src={logo} alt={company} className="w-7 h-7 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <span className={`font-bold text-base ${isAdzuna ? 'text-amber-600' : 'text-blue-600'}`}>
              {(company || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">
            {internship.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
            {company}
            {internship.location && <span className="text-slate-400"> · {internship.location}</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isAdzuna && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-white shadow-sm tracking-wide">
              ★ TOP
            </span>
          )}
          {internship.source && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${srcColor}`}>
              {internship.source}
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {internship.domain && (
          <span className="flex items-center gap-1">
            <Icon name="Layers" size={11} />
            {internship.domain}
          </span>
        )}
        {internship.postedAt && (
          <span className="flex items-center gap-1">
            <Icon name="Clock" size={11} />
            {formatDate(internship.postedAt)}
          </span>
        )}
        {typeof internship.stipend === 'number' && internship.stipend > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <Icon name="DollarSign" size={11} />
            ₹{internship.stipend.toLocaleString()}
          </span>
        )}
        {internship.duration && (
          <span className="flex items-center gap-1">
            <Icon name="Calendar" size={11} />
            {internship.duration}
          </span>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 4).map((s, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-medium">
              {s}
            </span>
          ))}
          {skills.length > 4 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-[10px]">
              +{skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto flex items-center justify-between">
        <span className="text-xs text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
          <Icon name="Eye" size={12} /> View details
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (internship.url) {
              window.open(internship.url, '_blank', 'noopener');
            } else {
              alert('⚠️ Application link not available for this internship.\n\nClick "View details" to see more information or check the source platform directly.');
            }
          }}
          className={`py-1.5 px-3 rounded-lg text-white font-bold text-[11px] shadow-sm transition-all flex items-center gap-1 ${
            isAdzuna
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'
              : internship.url
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              : 'bg-slate-400 hover:bg-slate-500 cursor-not-allowed'
          }`}
        >
          <Icon name="ExternalLink" size={11} />
          {internship.url ? 'Apply' : 'No Link'}
        </button>
      </div>
    </div>
  );
};

/* ─── Skeleton ────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse flex flex-col gap-3">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
    <div className="flex gap-2">
      <div className="h-3 bg-slate-200 rounded w-16" />
      <div className="h-3 bg-slate-200 rounded w-20" />
    </div>
    <div className="flex gap-1.5">
      <div className="h-5 w-14 bg-slate-200 rounded-full" />
      <div className="h-5 w-18 bg-slate-200 rounded-full" />
    </div>
    <div className="flex justify-between mt-auto">
      <div className="h-5 w-20 bg-slate-200 rounded" />
      <div className="h-7 w-16 bg-slate-200 rounded-lg" />
    </div>
  </div>
);

/* ─── Pagination Control ──────────────────────────────────────────── */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <Icon name="ChevronLeft" size={15} />
        Prev
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-slate-400 text-sm select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
              p === currentPage
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Next
        <Icon name="ChevronRight" size={15} />
      </button>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────────── */
const InternshipRecommendations = () => {
  const navigate   = useNavigate();
  const topRef     = useRef(null);

  // Data state
  const [internships,   setInternships]   = useState([]);
  const [adzunaCount,   setAdzunaCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(null);
  const [userSkills,    setUserSkills]    = useState([]);

  // UI state
  const [searchQuery,   setSearchQuery]   = useState('');
  const [debouncedQ,    setDebouncedQ]    = useState('');
  const [currentPage,   setCurrentPage]   = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalCount,    setTotalCount]    = useState(0);
  const [selectedInternship, setSelectedInternship] = useState(null);

  // Debounce search so we don't hit backend on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ── Fetch page from backend ──────────────────────────────── */
  const fetchPage = useCallback(async (page = 1, doRefresh = false, skills = []) => {
    if (doRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await internshipAPI.getDiscoverInternships({
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedQ,
        skills,
      });

      const list = Array.isArray(res?.internships) ? res.internships : [];
      setInternships(list);
      setAdzunaCount(res?.adzunaCount || 0);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || list.length);
    } catch (e) {
      console.error('Failed to load internships', e);
      setError('Failed to load internships. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedQ]);

  /* ── Initial load — also fetch user profile for skills ───── */
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const profileRes = await userAPI.getProfile().catch(() => null);
        const profile    = profileRes?.user?.profile || {};
        const resumeSkills  = Array.isArray(profileRes?.user?.resume?.skills)  ? profileRes.user.resume.skills  : [];
        const profileSkills = Array.isArray(profile?.skills) ? profile.skills : [];
        const skills        = resumeSkills.length > 0 ? resumeSkills : profileSkills;
        setUserSkills(skills);
        await fetchPage(1, false, skills);
      } catch {
        await fetchPage(1, false, []);
      }
    };
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Re-fetch when search changes ─────────────────────────── */
  useEffect(() => {
    if (!loading) fetchPage(1, false, userSkills);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  /* ── Handle page change ────────────────────────────────────── */
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPage(page, false, userSkills);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── Handle refresh ────────────────────────────────────────── */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await internshipAPI.refreshInternships();
    } catch {}
    setCurrentPage(1);
    await fetchPage(1, false, userSkills);
    setRefreshing(false);
  };

  // Page slice of internships is already handled server-side
  const adzunaOnPage  = internships.filter(i => i.isAdzuna);
  const othersOnPage  = internships.filter(i => !i.isAdzuna);
  const showAdzunaBanner = adzunaOnPage.length > 0 && currentPage === 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />

      {/* Detail Modal */}
      {selectedInternship && (
        <InternshipDetailModal
          internship={selectedInternship}
          onClose={() => setSelectedInternship(null)}
        />
      )}

      {/* ─── Hero Header ──────────────────────────────────────────── */}
      <div ref={topRef} className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-6 pb-8">
          {/* Back button */}
          <button
            onClick={() => navigate('/main-dashboard')}
            className="flex items-center gap-2 mb-5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-sm font-semibold transition-all backdrop-blur-sm border border-white/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Discover Tech Internships
                </h1>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-400/20 border border-emerald-300/30 rounded-full text-emerald-200 text-xs font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-blue-100/80 text-sm font-medium">
                Fresh internships from Adzuna, Arbeitnow, Remotive &amp; Findwork
                {userSkills.length > 0 && ' · Sorted by your skills'}
              </p>
              {/* Source legend */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-bold border border-amber-300/20">
                  ★ Adzuna — pinned first
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-200 text-[10px] font-bold border border-emerald-300/20">
                  Arbeitnow
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-200 text-[10px] font-bold border border-cyan-300/20">
                  Remotive
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-400/15 text-indigo-200 text-[10px] font-bold border border-indigo-300/20">
                  Findwork
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2 sm:w-64">
                <Icon name="Search" size={16} className="text-white/60 shrink-0" />
                <input
                  type="text"
                  placeholder="Search internships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent w-full text-white placeholder-white/50 focus:outline-none text-sm font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-white/60 hover:text-white">
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-60 border border-white/20 text-white text-sm font-bold transition-all"
                title="Scrape fresh internships"
              >
                <Icon name="RefreshCw" size={15} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats bar */}
        {!loading && !error && (
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <p className="text-sm text-slate-500 font-medium">
              {debouncedQ
                ? `Showing ${internships.length} result${internships.length !== 1 ? 's' : ''} for "${debouncedQ}"`
                : `${totalCount} internship${totalCount !== 1 ? 's' : ''} available`}
              {userSkills.length > 0 && !debouncedQ && (
                <span className="ml-1 text-blue-600">· Matched to your skills</span>
              )}
            </p>
            <p className="text-xs text-slate-400">
              Page {currentPage} of {totalPages} · Click any card to view details &amp; apply
            </p>
          </div>
        )}

        {/* No skills nudge */}
        {!loading && userSkills.length === 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Icon name="AlertCircle" size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Add your skills for matched results</p>
                <p className="text-xs text-amber-700">All tech internships shown — add skills for personalized ordering</p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate('/user-profile-management')} iconName="ArrowRight" iconPosition="right">
              Add Skills
            </Button>
          </div>
        )}

        {/* Refreshing overlay */}
        {refreshing && !loading && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 text-sm text-blue-700 font-medium">
            <Icon name="RefreshCw" size={16} className="animate-spin text-blue-600" />
            Scraping fresh internships from Adzuna, Arbeitnow, Remotive &amp; Findwork — this may take a moment…
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="AlertCircle" size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Failed to load internships</h3>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <Button onClick={() => fetchPage(currentPage, false, userSkills)} iconName="RefreshCw">Retry</Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && internships.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Icon name="Briefcase" size={36} className="text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {debouncedQ ? 'No matching internships' : 'No tech internships yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
              {debouncedQ
                ? 'Try a different search term'
                : 'Click "Refresh" to scrape the latest internships from Adzuna & web sources.'}
            </p>
            {debouncedQ
              ? <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
              : <Button onClick={handleRefresh} iconName="RefreshCw" loading={refreshing}>Fetch Internships</Button>}
          </div>
        )}

        {/* Cards */}
        {!loading && !error && internships.length > 0 && (
          <>
            {/* ★ Adzuna Section — only on page 1 when Adzuna items exist */}
            {showAdzunaBanner && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-sm">
                    <span className="text-amber-500 text-base">★</span>
                    <span className="text-sm font-black text-amber-800 tracking-wide">
                      Recommended from Adzuna
                    </span>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                      {adzunaOnPage.length} listings
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adzunaOnPage.map((it, idx) => (
                    <DiscoverCard
                      key={it.id || it._id || `adzuna-${idx}`}
                      internship={it}
                      onClick={() => setSelectedInternship(it)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other internships */}
            {othersOnPage.length > 0 && (
              <div>
                {showAdzunaBanner && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                      <Icon name="Globe" size={14} className="text-slate-500" />
                      <span className="text-sm font-bold text-slate-700">Other Tech Internships</span>
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                        {othersOnPage.length} on this page
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {othersOnPage.map((it, idx) => (
                    <DiscoverCard
                      key={it.id || it._id || idx}
                      internship={it}
                      onClick={() => setSelectedInternship(it)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ─── Pagination ──────────────────────────────────────── */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            {/* Page info */}
            <p className="text-center text-xs text-slate-400 mt-3">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} internships
            </p>
          </>
        )}

        {/* Data sources info */}
        {!loading && (
          <div className="mt-10 p-4 bg-gradient-to-r from-blue-50 to-amber-50 border border-blue-100 rounded-2xl flex items-start gap-3">
            <Icon name="Info" size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-0.5">Live data · Tech-only · Adzuna pinned first</p>
              <p className="text-blue-600">
                Internships are fetched from <span className="font-bold text-amber-600">Adzuna</span> (top results),
                Arbeitnow, Remotive &amp; Findwork APIs.
                Click <strong>Refresh</strong> to get the latest batch.
              </p>
            </div>
          </div>
        )}
      </div>

      <HelpDeskWidget />
    </div>
  );
};

export default InternshipRecommendations;