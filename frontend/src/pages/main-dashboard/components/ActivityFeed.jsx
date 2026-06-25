import React from 'react';
import Icon from '../../../components/AppIcon';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  Applied:             { icon: 'Send',          color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/30' },
  'Under Review':      { icon: 'Eye',           color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
  'Interview Scheduled': { icon: 'Calendar',    color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/30' },
  'Offer Received':    { icon: 'CheckCircle',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  Rejected:            { icon: 'XCircle',       color: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50 dark:bg-rose-900/30' },
  default:             { icon: 'Bell',          color: 'text-muted-foreground',               bg: 'bg-muted' },
};

const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  if (isNaN(d)) return '';
  const diffMins = Math.floor((now - d) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

const ActivityFeed = ({ activities = [] }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon name="Activity" size={20} className="text-primary" />
        <div>
          <h2 className="text-base font-semibold text-foreground leading-none">
            {t('dashboard.activity.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('dashboard.activity.subtitle')}
          </p>
        </div>
      </div>

      {!activities || activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="Activity" size={22} className="text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {t('dashboard.activity.emptyTitle')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.activity.emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.slice(0, 6).map((activity, idx) => {
            // activities come from /recent-activity, shape from mapApplication
            const status = activity?.status || activity?.type;
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.default;
            const internshipTitle = activity?.internship?.title || activity?.message || 'Unknown Internship';
            const company = activity?.internship?.company || '';
            const timestamp = activity?.updatedAt || activity?.appliedAt || activity?.timestamp;

            return (
              <div
                key={activity?.id || idx}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors duration-150 group"
              >
                {/* Timeline dot */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon name={cfg.icon} size={14} className={cfg.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {internshipTitle}
                  </p>
                  {company && (
                    <p className="text-xs text-muted-foreground truncate">{company}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {status && (
                      <span className={`text-xs font-semibold ${cfg.color}`}>{status}</span>
                    )}
                    {timestamp && (
                      <span className="text-xs text-muted-foreground">· {formatTimeAgo(timestamp)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;