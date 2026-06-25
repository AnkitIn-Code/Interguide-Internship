import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import HelpDeskWidget from '../../components/ui/HelpDeskWidget';
import CalendarView from './components/CalendarView';
import { applicationsAPI } from '../../services/api';
import {
  Bookmark, Star, Briefcase, Calendar, ExternalLink,
  Trash2, Clock, Plus, Search, Loader2, RefreshCw, X, Check,
  CalendarDays, AlertCircle
} from 'lucide-react';

/* ─── Constants ────────────────────────────────────────────── */
const STATUS_WANT = 'want_to_apply';
const STATUS_WISH = 'wishlist';

/* ─── Utility helpers ──────────────────────────────────────── */
const formatDate = (d) => {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const diff = Math.floor((Date.now() - dt) / 864e5);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 0) {
      const daysLeft = -diff;
      if (daysLeft === 1) return 'Tomorrow';
      if (daysLeft <= 7) return `in ${daysLeft}d`;
      return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
    if (diff < 7) return `${diff}d ago`;
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
};

const formatDateInput = (d) => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toISOString().split('T')[0]; // YYYY-MM-DD for input[type=date]
  } catch { return ''; }
};

/* ─── Deadline modal ───────────────────────────────────────── */
const DeadlineModal = ({ app, onSave, onClose }) => {
  const [deadline, setDeadline]         = useState(formatDateInput(app.deadline));
  const [interviewDate, setInterview]   = useState(formatDateInput(app.interviewDate));
  const [followUpDate, setFollowUp]     = useState(formatDateInput(app.followUpDate));
  const [notes, setNotes]               = useState(app.notes || '');
  const [saving, setSaving]             = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(app._id || app.id, {
        deadline:      deadline      || null,
        interviewDate: interviewDate || null,
        followUpDate:  followUpDate  || null,
        notes,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Set Dates</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{app.title}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Deadline */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Application Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Interview date */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
              Interview Date
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={e => setInterview(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Follow-up */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Follow-up Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUp(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this internship..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Event detail modal (from calendar click) ─────────────── */
const EventModal = ({ event, onClose }) => {
  if (!event) return null;
  const dt = new Date(event.dateStr);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${event.bgLight} ${event.textColor}`}>
            {event.subtitle}
          </span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="font-bold text-slate-900 text-base mb-1">{event.app?.title || 'Internship'}</h3>
        <p className="text-sm text-slate-500 mb-4">{event.app?.company || ''}</p>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          {dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        {event.app?.url && (
          <a
            href={event.app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Apply Now
          </a>
        )}
      </motion.div>
    </div>
  );
};

/* ─── Internship Card ──────────────────────────────────────── */
const AppCard = ({ app, onRemove, onSetDates, type }) => {
  const company = app.company || '';
  const logo    = app.companyLogo || app.logo;
  const skills  = Array.isArray(app.requiredSkills) ? app.requiredSkills : [];
  const isWant  = type === STATUS_WANT;
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(app._id || app.id);
  };

  const hasDeadline = !!app.deadline || !!app.interviewDate;
  const deadlinePast = app.deadline && new Date(app.deadline) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 group relative ${
        isWant ? 'border-indigo-100 hover:border-indigo-200' : 'border-amber-100 hover:border-amber-200'
      }`}
    >
      {/* Remove button — always visible */}
      <button
        onClick={handleRemove}
        disabled={removing}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all border border-red-100 disabled:opacity-40"
        title="Remove from tracker"
      >
        {removing
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Trash2 className="w-3.5 h-3.5" />
        }
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white flex items-center justify-center shrink-0 overflow-hidden">
          {logo
            ? <img src={logo} alt={company} className="w-6 h-6 object-contain" onError={e => { e.target.style.display = 'none'; }} />
            : <span className={`font-bold text-sm ${isWant ? 'text-indigo-600' : 'text-amber-600'}`}>{(company || '?').charAt(0).toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 mb-0.5">{app.title}</h4>
          <p className="text-xs text-slate-500 font-medium truncate">
            {company}
            {app.location && <span className="text-slate-400"> · {app.location}</span>}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mb-2">
        {app.domain && (
          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{app.domain}</span>
        )}
        {typeof app.stipend === 'number' && app.stipend > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">₹{app.stipend.toLocaleString()}/mo</span>
        )}
        {app.source && (
          <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] text-slate-500">{app.source}</span>
        )}
      </div>

      {/* Deadline badge */}
      {app.deadline && (
        <div className={`flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${
          deadlinePast ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
        }`}>
          {deadlinePast ? <AlertCircle className="w-3 h-3 shrink-0" /> : <Clock className="w-3 h-3 shrink-0" />}
          Deadline: {formatDate(app.deadline)}
          {deadlinePast && ' (Expired)'}
        </div>
      )}

      {/* Interview date badge */}
      {app.interviewDate && (
        <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
          <CalendarDays className="w-3 h-3 shrink-0" />
          Interview: {formatDate(app.interviewDate)}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {skills.slice(0, 3).map((s, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-medium rounded-full">{s}</span>
          ))}
          {skills.length > 3 && (
            <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] rounded-full">+{skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Notes */}
      {app.notes && (
        <p className="text-[11px] text-slate-500 italic mb-2 line-clamp-2 bg-slate-50 rounded-lg px-2 py-1.5">
          {app.notes}
        </p>
      )}

      {/* Action row */}
      <div className="flex gap-2 mt-2">
        {app.url && (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
              isWant
                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" /> Apply
          </a>
        )}
        <button
          onClick={() => onSetDates(app)}
          className={`${app.url ? '' : 'flex-1'} flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all`}
          title="Set deadline / interview date"
        >
          <CalendarDays className="w-3 h-3" />
          {hasDeadline ? 'Dates' : 'Set Date'}
        </button>
      </div>

      {/* Added date */}
      <p className="text-[10px] text-slate-400 mt-2 text-center">
        Added {formatDate(app.createdAt || app.appliedAt || Date.now())}
      </p>
    </motion.div>
  );
};

/* ─── Section column ───────────────────────────────────────── */
const SectionCol = ({ title, icon: Icon, iconBg, iconColor, borderColor, count, loading, children, emptyMsg, emptyIcon: EIcon, onExplore }) => (
  <div className={`bg-white rounded-2xl border ${borderColor} shadow-sm flex flex-col overflow-hidden`}>
    <div className={`px-5 py-4 border-b ${borderColor} flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{loading ? '…' : `${count} internship${count !== 1 ? 's' : ''}`}</p>
        </div>
      </div>
      <span className={`text-sm font-black px-2.5 py-1 rounded-full ${iconBg} ${iconColor}`}>{count}</span>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[520px] scrollbar-hide">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
        </div>
      ) : (
        <>
          {children}
          {count === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              {EIcon && <EIcon className="w-10 h-10 text-slate-200 mb-3" />}
              <p className="text-sm font-semibold text-slate-500 mb-1">{emptyMsg}</p>
              <button onClick={onExplore} className="mt-2 text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Discover Internships
              </button>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN PAGE COMPONENT                                       */
/* ═══════════════════════════════════════════════════════════ */
const ApplicationTracker = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [deadlineModal, setDeadlineModal] = useState(null);   // app object | null
  const [calEventModal, setCalEventModal] = useState(null);   // calendar event | null
  const [refreshing, setRefreshing]     = useState(false);

  useEffect(() => {
    document.title = 'Application Tracker – InternGuide AI';
  }, []);

  /* ── Fetch from DB ── */
  const loadApplications = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await applicationsAPI.list();
      // Backend now returns { applications: [...] }
      const apps = Array.isArray(res) ? res : (res?.applications || []);
      setApplications(apps);
    } catch (e) {
      console.error('Failed to load applications', e);
      setError('Failed to load your tracker. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  /* ── Remove ── */
  const handleRemove = useCallback(async (id) => {
    // Optimistic update
    setApplications(prev => prev.filter(a => (a._id || a.id) !== id));
    try {
      await applicationsAPI.delete(id);
    } catch (e) {
      console.error('Delete failed', e);
      loadApplications(true); // revert
    }
  }, [loadApplications]);

  /* ── Save dates ── */
  const handleSaveDates = useCallback(async (id, updates) => {
    const res = await applicationsAPI.update(id, updates);
    // Update local state
    setApplications(prev => prev.map(a => (a._id || a.id) === id ? { ...a, ...updates, ...res } : a));
  }, []);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase();
    return applications.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.company || '').toLowerCase().includes(q)
    );
  }, [applications, searchQuery]);

  const wantList = filtered.filter(a => a.status === STATUS_WANT);
  const wishList = filtered.filter(a => a.status === STATUS_WISH);




  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Application Tracker</h1>
            <p className="text-slate-500 text-sm mt-1">Track your internship interests and set deadline reminders</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent w-32 sm:w-44 text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
            </div>
            {/* Refresh */}
            <button
              onClick={() => loadApplications(true)}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {/* Discover */}
            <button
              onClick={() => navigate('/internship-recommendations')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Discover
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => loadApplications()} className="ml-auto underline text-xs">Retry</button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: 'Want to Apply', count: wantList.length, color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: Star },
            { label: 'Wishlist',      count: wishList.length, color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Bookmark },
            { label: 'Total Saved',   count: wantList.length + wishList.length, color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Briefcase },
            { label: 'Deadlines Set', count: [...wantList, ...wishList].filter(a => a.deadline).length, color: 'bg-red-50 text-red-700 border-red-100', icon: Clock },
          ].map(({ label, count, color, icon: Icon }) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${color}`}>
              <Icon className="w-4 h-4" />
              {label}: <span className="font-black">{count}</span>
            </div>
          ))}
        </div>

        {/* ── Main layout: cards left, calendar right ── */}
        <div className="flex flex-col xl:flex-row gap-5 mb-5">

          {/* Left: Want to Apply + Wishlist */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0">
            <SectionCol
              title="Want to Apply"
              icon={Star}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              borderColor="border-indigo-100"
              count={wantList.length}
              loading={loading}
              emptyMsg="No internships saved yet"
              emptyIcon={Star}
              onExplore={() => navigate('/internship-recommendations')}
            >
              <AnimatePresence>
                {wantList.map(app => (
                  <AppCard
                    key={app._id || app.id}
                    app={app}
                    onRemove={handleRemove}
                    onSetDates={setDeadlineModal}
                    type={STATUS_WANT}
                  />
                ))}
              </AnimatePresence>
            </SectionCol>

            <SectionCol
              title="Wishlist"
              icon={Bookmark}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              borderColor="border-amber-100"
              count={wishList.length}
              loading={loading}
              emptyMsg="Your wishlist is empty"
              emptyIcon={Bookmark}
              onExplore={() => navigate('/internship-recommendations')}
            >
              <AnimatePresence>
                {wishList.map(app => (
                  <AppCard
                    key={app._id || app.id}
                    app={app}
                    onRemove={handleRemove}
                    onSetDates={setDeadlineModal}
                    type={STATUS_WISH}
                  />
                ))}
              </AnimatePresence>
            </SectionCol>
          </div>

          {/* Right: Calendar */}
          <div className="w-full xl:w-[400px] shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 xl:sticky xl:top-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Deadlines Calendar</h2>
                  <p className="text-[11px] text-slate-500">Set dates on cards to see them here</p>
                </div>
              </div>
              <CalendarView
                applications={applications}
                onEventClick={setCalEventModal}
              />
            </div>
          </div>
        </div>

      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {deadlineModal && (
          <DeadlineModal
            key="deadline-modal"
            app={deadlineModal}
            onSave={handleSaveDates}
            onClose={() => setDeadlineModal(null)}
          />
        )}
        {calEventModal && (
          <EventModal
            key="cal-event-modal"
            event={calEventModal}
            onClose={() => setCalEventModal(null)}
          />
        )}
      </AnimatePresence>

      <HelpDeskWidget />
    </div>
  );
};

export default ApplicationTracker;