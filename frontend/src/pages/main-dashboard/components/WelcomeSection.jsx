import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const WelcomeSection = ({ userName, profileCompletion, onCompleteProfile }) => {
  const { t } = useTranslation();
  const currentHour = new Date().getHours();

  const getGreeting = () => {
    if (currentHour < 12) return t('dashboard.greeting.morning');
    if (currentHour < 17) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  const getEmoji = () => {
    if (currentHour < 12) return '☀️';
    if (currentHour < 17) return '🌤️';
    return '🌙';
  };

  const completion = Math.max(0, Math.min(100, profileCompletion || 0));

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Rich gradient background */}
      <div className="absolute inset-0 gradient-hero opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]" />

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-sm" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-8 w-64 h-64 bg-white/5 rounded-full" aria-hidden="true" />

      <div className="relative z-10 p-8">
        <div className="flex items-start justify-between gap-6">
          {/* Left Content */}
          <div className="flex-1">
            {/* Greeting */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl" role="img" aria-label="greeting">{getEmoji()}</span>
              <p className="text-white/80 text-sm font-medium tracking-wide uppercase">
                {getGreeting()}
              </p>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
              {userName ? `Hi, ${userName}!` : 'Welcome Back!'}
            </h1>
            <p className="text-white/75 text-base mb-6 max-w-md">
              {t('dashboard.readyToDiscover')}
            </p>

            {/* Profile completion bar */}
            {completion < 100 && (
              <div className="bg-white/10 backdrop-blur-subtle rounded-xl p-4 border border-white/20 max-w-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">
                    {t('dashboard.profileCompletion')}
                  </span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                    completion >= 70 ? 'bg-emerald-400/20 text-emerald-200' :
                    completion >= 40 ? 'bg-amber-400/20 text-amber-200' :
                    'bg-rose-400/20 text-rose-200'
                  }`}>
                    {completion}%
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${completion}%`,
                      background: completion >= 70
                        ? 'linear-gradient(90deg, #34D399, #10B981)'
                        : completion >= 40
                        ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                        : 'linear-gradient(90deg, #F87171, #EF4444)',
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCompleteProfile}
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 text-sm"
                  iconName="User"
                  iconPosition="left"
                >
                  {t('dashboard.completeProfile')}
                </Button>
              </div>
            )}

            {completion === 100 && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-subtle rounded-xl px-4 py-2 border border-white/20 w-fit">
                <Icon name="CheckCircle" size={18} className="text-emerald-300" />
                <span className="text-white text-sm font-semibold">Profile Complete!</span>
              </div>
            )}
          </div>

          {/* Right Icon */}
          <div className="hidden md:flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-subtle shadow-lg">
              <Icon name="Briefcase" size={36} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-white/60 text-xs">InternGuide</p>
              <p className="text-white/90 text-xs font-semibold">AI Platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;