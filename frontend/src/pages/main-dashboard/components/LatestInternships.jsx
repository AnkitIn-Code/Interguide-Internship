import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const sourceColors = {
  LinkedIn:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Internshala: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  Naukri:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Arbeitnow:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  RemoteOK:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  Findwork:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  default:     'bg-muted text-muted-foreground',
};

const SkeletonCard = () => (
  <div className="p-4 rounded-xl border border-border animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 w-16 bg-muted rounded-full" />
          <div className="h-5 w-20 bg-muted rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

const formatDate = (d) => {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const diff = Math.floor((Date.now() - dt) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return dt.toLocaleDateString();
  } catch {
    return '';
  }
};

const LatestInternships = ({ internships = [], loading = false }) => {
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Icon name="Zap" size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Latest Internships</h2>
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
          </div>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!Array.isArray(internships) || internships.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon name="Briefcase" size={28} className="text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Latest Internships</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Our scrapers are fetching fresh internship data. Check back in a moment!
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span>Data sources: Arbeitnow, RemoteOK, Findwork, RSS Feeds</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Icon name="Zap" size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Latest Internships</h2>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" title="Live data" />
        </div>
        <span className="badge badge-primary">
          {internships.length} new
        </span>
      </div>

      <div className="space-y-3">
        {internships.slice(0, 8).map((it, idx) => {
          const srcColor = sourceColors[it.source] || sourceColors.default;
          return (
            <div
              key={it.id || idx}
              className="p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all duration-200 group internship-card-glow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-semibold text-foreground text-sm truncate flex-1 group-hover:text-primary transition-colors">
                      {it.title}
                    </h3>
                    {it.source && (
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${srcColor}`}>
                        {it.source}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground truncate mb-2">
                    <span className="font-medium">{it.company}</span>
                    {it.location && <span className="text-muted-foreground/70"> · {it.location}</span>}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {it.domain && (
                      <span className="flex items-center gap-1">
                        <Icon name="Layers" size={11} />
                        {it.domain}
                      </span>
                    )}
                    {it.postedAt && (
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" size={11} />
                        {formatDate(it.postedAt)}
                      </span>
                    )}
                    {typeof it.stipend === 'number' && it.stipend > 0 && (
                      <span className="flex items-center gap-1 text-success font-semibold">
                        <Icon name="DollarSign" size={11} />
                        ₹{it.stipend.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {Array.isArray(it.requiredSkills) && it.requiredSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {it.requiredSkills.slice(0, 5).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          {s}
                        </span>
                      ))}
                      {it.requiredSkills.length > 5 && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                          +{it.requiredSkills.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => it.url && window.open(it.url, '_blank', 'noopener')}
                    iconName="ExternalLink"
                    disabled={!it.url}
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {internships.length > 8 && (
        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Showing 8 of {internships.length} internships · 
            <button
              onClick={() => navigate('/internship-recommendations')}
              className="text-primary hover:underline ml-1"
            >
              View all →
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default LatestInternships;
