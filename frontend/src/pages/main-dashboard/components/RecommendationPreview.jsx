import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useTranslation } from 'react-i18next';

/**
 * RecommendationPreview
 *
 * Props:
 *  - internships          : array of scraped internships (already skill-matched from parent)
 *  - userSkills           : string[] — user's skills (from profile/resume)
 *  - onSelectInternship   : (internship) => void — optional callback when a card is clicked
 */
const RecommendationPreview = ({ internships = [], userSkills = [], onSelectInternship }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasSkills = Array.isArray(userSkills) && userSkills.length > 0;

  // Badge color based on match %
  const badgeClass = (pct) => {
    if (pct >= 90) return 'bg-emerald-100 text-emerald-700';
    if (pct >= 75) return 'bg-blue-100 text-blue-700';
    if (pct >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-slate-100 text-slate-600';
  };

  const displayList = internships.slice(0, 4);

  /* ─── No Skills State ──────────────────────────────────────────────── */
  if (!hasSkills) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon name="Sparkles" size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {t('dashboard.recommendations.title')}
            </h2>
          </div>
        </div>

        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-center">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="AlertCircle" size={28} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">
            Add your skills first
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4 max-w-xs mx-auto">
            We need your skills to match you with the best internships. Add them to your profile to unlock personalized recommendations.
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/user-profile-management')}
            iconName="ArrowRight"
            iconPosition="right"
          >
            Add Skills to Profile
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Empty (skills set, but no data yet) ──────────────────────────── */
  if (displayList.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon name="Sparkles" size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {t('dashboard.recommendations.title')}
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/internship-recommendations')}
            iconName="ArrowRight"
            iconPosition="right"
          >
            Browse All
          </Button>
        </div>
        <div className="text-center py-8">
          <Icon name="Search" size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            Fetching internships matched to your skills...
          </p>
        </div>
      </div>
    );
  }

  /* ─── Recommendations List ─────────────────────────────────────────── */
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon name="Sparkles" size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {t('dashboard.recommendations.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              Matched to: {userSkills.slice(0, 3).join(', ')}{userSkills.length > 3 ? ` +${userSkills.length - 3}` : ''}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/internship-recommendations')}
          iconName="ArrowRight"
          iconPosition="right"
        >
          View All
        </Button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {displayList.map((internship, idx) => {
          const company = internship.company?.name || internship.company || '';
          const logo = internship.company?.logo || internship.companyLogo;
          const matchPct = typeof internship.matchPercentage === 'number'
            ? Math.min(100, Math.round(internship.matchPercentage))
            : typeof internship.matchScore === 'number'
            ? Math.min(100, Math.round(internship.matchScore))
            : null;

          return (
            <div
              key={internship.id || internship._id || idx}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all duration-200 group cursor-pointer"
              onClick={() => {
                if (onSelectInternship) {
                  onSelectInternship(internship);
                } else if (internship.url) {
                  window.open(internship.url, '_blank', 'noopener');
                }
              }}
            >
              {/* Logo */}
              <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center bg-muted shrink-0 overflow-hidden">
                {logo ? (
                  <img src={logo} alt={company} className="w-6 h-6 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <span className="font-bold text-sm text-primary">
                    {(company || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                  {internship.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {company}
                  {internship.location ? ` · ${internship.location}` : ''}
                </p>
              </div>

              {/* Match badge */}
              {matchPct !== null && (
                <div className={`shrink-0 px-2 py-1 rounded-full text-xs font-bold ${badgeClass(matchPct)}`}>
                  {matchPct}% match
                </div>
              )}

              <Icon name="ExternalLink" size={14} className="shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
          );
        })}
      </div>

      {/* Live data note */}
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live scraped data from LinkedIn, Internshala, Naukri &amp; more
      </div>
    </div>
  );
};

export default RecommendationPreview;