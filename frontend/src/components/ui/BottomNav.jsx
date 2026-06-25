import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { useTranslation } from 'react-i18next';

const tabs = [
  { key: 'dashboard', path: '/main-dashboard', icon: 'LayoutDashboard', labelKey: 'nav.dashboard' },
  { key: 'discover', path: '/job-search', icon: 'Search', labelKey: 'nav.discover' },
  { key: 'interview', path: '/ai-interview', icon: 'Cpu', label: 'AI Interview' },
  { key: 'track', path: '/application-tracker', icon: 'ClipboardList', labelKey: 'nav.track' },
  { key: 'profile', path: '/user-profile-management', icon: 'User', labelKey: 'nav.profile' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path) => location?.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border">
      <div className="grid grid-cols-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center py-2 text-xs ${
              isActive(tab.path) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name={tab.icon} size={20} />
            <span className="mt-1">{tab.label || t(tab.labelKey)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
