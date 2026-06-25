import React from 'react';
import Icon from '../../../components/AppIcon';

const colorConfig = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-100 dark:border-blue-900/50',   glow: 'hover:shadow-blue-100 dark:hover:shadow-blue-900/20' },
  green:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/50', glow: 'hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20' },
  yellow: { bg: 'bg-amber-50 dark:bg-amber-950/30',  text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-100 dark:border-amber-900/50',  glow: 'hover:shadow-amber-100 dark:hover:shadow-amber-900/20' },
  purple: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-900/50', glow: 'hover:shadow-violet-100 dark:hover:shadow-violet-900/20' },
  red:    { bg: 'bg-rose-50 dark:bg-rose-950/30',    text: 'text-rose-600 dark:text-rose-400',    border: 'border-rose-100 dark:border-rose-900/50',    glow: 'hover:shadow-rose-100 dark:hover:shadow-rose-900/20' },
};

const MetricCard = ({ title, value, icon, color = 'blue', trend, onClick }) => {
  const cfg = colorConfig[color] || colorConfig.blue;

  return (
    <div
      className={`relative bg-card border border-border rounded-xl p-6 cursor-pointer 
        overflow-hidden group
        hover:shadow-elevation-2 hover:-translate-y-0.5
        transition-all duration-200 ease-out
        ${onClick ? 'hover:border-primary/30' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Subtle background gradient on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${cfg.bg}`}
        style={{ borderRadius: 'inherit' }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.text} border ${cfg.border} shadow-sm`}>
            <Icon name={icon} size={22} />
          </div>

          {trend && trend.value && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend.type === 'up'
                ? 'text-success bg-success/10'
                : trend.type === 'down'
                ? 'text-destructive bg-destructive/10'
                : 'text-muted-foreground bg-muted'
            }`}>
              <Icon
                name={trend.type === 'up' ? 'TrendingUp' : trend.type === 'down' ? 'TrendingDown' : 'Minus'}
                size={12}
              />
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        <div>
          <h3 className={`text-2xl font-bold mb-0.5 transition-colors duration-200 ${cfg.text}`}>
            {value || '—'}
          </h3>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;