import React, { useEffect, useState } from 'react';
import Icon from '../../components/AppIcon';
import { applicationsAPI } from '../../services/api';

/**
 * InternshipDetailModal
 *
 * Props:
 *   internship  – the internship object
 *   onClose     – called when user dismisses
 */
const InternshipDetailModal = ({ internship, onClose }) => {
  const [saving, setSaving] = useState(null); // 'want_to_apply' | 'wishlist' | null
  const [saved, setSaved] = useState(null);   // 'want_to_apply' | 'wishlist' | null — tracks current save state
  const [toast, setToast] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!internship) return null;

  const company = internship.company?.name || internship.company || '';
  const logo    = internship.company?.logo || internship.companyLogo;
  const skills  = Array.isArray(internship.requiredSkills) ? internship.requiredSkills : [];

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  const handleApply = () => {
    if (internship.url) window.open(internship.url, '_blank', 'noopener');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSave = async (status) => {
    if (saving) return;
    // Toggle off if already saved in that status
    if (saved === status) {
      setSaved(null);
      showToast('Removed from tracker');
      return;
    }
    setSaving(status);
    try {
      // Normalise company — it can be a string or { name, logo } object
      const companyName = typeof internship.company === 'object' && internship.company !== null
        ? internship.company.name
        : internship.company;
      const companyLogo = internship.companyLogo
        || (typeof internship.company === 'object' ? internship.company?.logo : undefined);

      await applicationsAPI.upsert({
        internshipId: internship._id || internship.id,
        status,
        title:          internship.title,
        company:        companyName,
        companyLogo:    companyLogo,
        location:       internship.location,
        domain:         internship.domain,
        stipend:        typeof internship.stipend === 'number' ? internship.stipend : undefined,
        duration:       internship.duration,
        url:            internship.url,
        requiredSkills: Array.isArray(internship.requiredSkills) ? internship.requiredSkills : [],
        description:    internship.description,
        postedAt:       internship.postedAt,
        source:         internship.source,
        isRemote:       internship.isRemote,
      });
      setSaved(status);
      showToast(
        status === 'want_to_apply'
          ? '⭐ Added to Want to Apply!'
          : '🔖 Added to Wishlist!'
      );
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Failed to save. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const sourceColors = {
    LinkedIn:    'bg-blue-100 text-blue-700',
    Internshala: 'bg-violet-100 text-violet-700',
    Naukri:      'bg-orange-100 text-orange-700',
    Arbeitnow:   'bg-emerald-100 text-emerald-700',
    Remotive:    'bg-cyan-100 text-cyan-700',
    Findwork:    'bg-indigo-100 text-indigo-700',
    default:     'bg-gray-100 text-gray-600',
  };
  const srcColor = sourceColors[internship.source] || sourceColors.default;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Modal Panel */}
      <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Icon name="X" size={18} />
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 pt-8 pb-10 rounded-t-3xl">
          <div className="flex items-start gap-4">
            {/* Company logo */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
              {logo ? (
                <img src={logo} alt={company} className="w-10 h-10 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <span className="text-2xl font-black text-white">
                  {(company || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <h2 className="text-xl font-extrabold text-white leading-tight mb-1">
                {internship.title}
              </h2>
              <p className="text-blue-100 font-semibold text-sm">{company}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {internship.source && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${srcColor}`}>
                    {internship.source}
                  </span>
                )}
                {internship.isRemote && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400/20 border border-emerald-300/30 text-emerald-100">
                    Remote
                  </span>
                )}
                {internship.domain && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 text-white/90">
                    {internship.domain}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">

          {/* ── TRACKER ACTION BUTTONS ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSave('want_to_apply')}
              disabled={!!saving}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all border ${
                saved === 'want_to_apply'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
              } disabled:opacity-60 disabled:cursor-wait`}
            >
              {saving === 'want_to_apply' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="Star" size={16} />
              )}
              {saved === 'want_to_apply' ? '✓ Want to Apply' : 'Want to Apply'}
            </button>

            <button
              onClick={() => handleSave('wishlist')}
              disabled={!!saving}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all border ${
                saved === 'wishlist'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
              } disabled:opacity-60 disabled:cursor-wait`}
            >
              {saving === 'wishlist' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="Bookmark" size={16} />
              )}
              {saved === 'wishlist' ? '✓ Wishlisted' : 'Wishlist'}
            </button>
          </div>

          {/* Quick info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: 'MapPin',   label: 'Location', value: internship.location || 'Not specified' },
              { icon: 'Clock',    label: 'Duration',  value: internship.duration || 'Not specified' },
              { icon: 'DollarSign', label: 'Stipend', value: internship.stipend ? `₹${internship.stipend.toLocaleString()}` : 'Not disclosed' },
              { icon: 'Calendar', label: 'Posted',    value: internship.postedAt ? formatDate(internship.postedAt) : 'Recently' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon name={icon} size={15} className="text-blue-600" />
                </div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-xs font-bold text-slate-800 leading-tight">{value}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Icon name="Code" size={16} className="text-blue-600" />
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {internship.description && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Icon name="FileText" size={16} className="text-blue-600" />
                About the Role
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {internship.description.replace(/<[^>]+>/g, '').slice(0, 800)}
                {internship.description.length > 800 && '…'}
              </p>
            </div>
          )}

          {/* AI Reasoning */}
          {internship.aiReasoning && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Sparkles" size={16} className="text-primary" />
                <span className="text-sm font-bold text-primary">Why this matches you</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{internship.aiReasoning}</p>
            </div>
          )}

          {/* Apply Now */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleApply}
              disabled={!internship.url}
              className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <Icon name="ExternalLink" size={16} />
              Apply Now
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Note */}
          <p className="text-[11px] text-slate-400 text-center">
            Clicking "Apply Now" will open the original job posting in a new tab.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InternshipDetailModal;
