import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const getUrgencyConfig = (daysUntil) => {
  if (daysUntil < 0) return { label: 'Overdue', bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' };
  if (daysUntil === 0) return { label: 'Today!', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' };
  if (daysUntil <= 2) return { label: `${daysUntil}d left`, bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' };
  if (daysUntil <= 7) return { label: `${daysUntil}d left`, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' };
  return { label: `${daysUntil}d left`, bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' };
};

const UpcomingDeadlines = ({ deadlines = [], onViewCalendar }) => {
  const { t, i18n } = useTranslation();
  const locale = (i18n.resolvedLanguage || 'en').startsWith('hi') ? 'hi-IN' : 'en-US';

  const getDaysUntil = (date) => {
    if (!date) return null;
    const target = new Date(date);
    if (isNaN(target)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date) => {
    try {
      return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(date));
    } catch { return ''; }
  };

  // Normalize deadlines from /upcoming-deadlines response (shape from mapApplication)
  const normalizedDeadlines = (Array.isArray(deadlines) ? deadlines : [])
    .map(dl => {
      // response is an application object with internship sub-object
      const app = dl;
      const deadlineDate = app?.internship?.deadline || app?.deadline || app?.date;
      const title = app?.internship?.title || app?.title || 'Application';
      const company = app?.internship?.company || app?.company || '';
      const days = getDaysUntil(deadlineDate);
      return { id: app?.id || Math.random(), title, company, date: deadlineDate, daysUntil: days };
    })
    .filter(d => d.date && d.daysUntil !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <Icon name="Clock" size={20} className="text-warning" />
          <div>
            <h2 className="text-base font-semibold text-foreground leading-none">
              {t('dashboard.deadlines.title')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('dashboard.deadlines.subtitle')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewCalendar}
          iconName="Calendar"
          iconPosition="left"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t('dashboard.deadlines.viewCalendar')}
        </Button>
      </div>

      {normalizedDeadlines.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="Clock" size={22} className="text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {t('dashboard.deadlines.emptyTitle')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.deadlines.emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {normalizedDeadlines.map((dl) => {
            const cfg = getUrgencyConfig(dl.daysUntil);
            return (
              <div
                key={dl.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-muted/30 transition-all duration-150"
              >
                {/* Urgency dot */}
                <div className={`flex-shrink-0 w-2 h-2 rounded-full ${cfg.dot}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{dl.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dl.company && <>{dl.company} · </>}
                    {dl.date && formatDate(dl.date)}
                  </p>
                </div>

                {/* Badge */}
                <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingDeadlines;