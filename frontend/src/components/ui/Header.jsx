import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dropdownRef = useRef(null);

  const isLandingPage = location?.pathname === '/';

  const navigationItems = [
    { label: t('nav.dashboard'),    path: '/main-dashboard',              icon: 'LayoutDashboard' },
    { label: 'Internships',         path: '/internship-recommendations',   icon: 'Briefcase' },
    { label: t('nav.discover'),     path: '/job-search',                  icon: 'Search' },
    { label: t('nav.resumeTools'),  path: '/resume-tools',                icon: 'FileText' },
    { label: 'AI Interview',        path: '/ai-interview',                icon: 'Cpu' },
    { label: t('nav.track'),        path: '/application-tracker',          icon: 'ClipboardList' },
    { label: t('nav.profile'),      path: '/user-profile-management',      icon: 'User' },
  ];

  const isActivePath = (path) => location?.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userSkills');
    sessionStorage.clear();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isDropdownOpen]);

  if (isLandingPage) return null;

  return (
    <header className="glass border-b border-border sticky top-0 z-50 shadow-elevation-1">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-6">

          {/* Logo */}
          <button
            onClick={() => handleNavigation('/main-dashboard')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-200 group"
            aria-label="Go to Dashboard"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center gradient-primary shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Icon name="Briefcase" size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              {t('appTitle')}
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navigationItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon name={item.icon} size={15} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="w-9 h-9 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all duration-150 border border-border hover:border-primary/30"
                aria-label="User menu"
                aria-expanded={isDropdownOpen}
              >
                <Icon name="User" size={18} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-card border border-border rounded-xl shadow-elevation-3 overflow-hidden animate-scale-in z-[100]">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs text-muted-foreground font-medium">Signed in</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => handleNavigation('/user-profile-management')}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon name="User" size={16} className="text-muted-foreground" />
                      <span>{t('nav.profile')}</span>
                    </button>
                    <button
                      onClick={() => handleNavigation('/settings')}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon name="Settings" size={16} className="text-muted-foreground" />
                      <span>{t('nav.settings')}</span>
                    </button>
                    <div className="h-px bg-border mx-1 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Icon name="LogOut" size={16} />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors border border-border"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card animate-slide-up">
            <div className="px-4 py-3 space-y-1">

              {navigationItems.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                    {active && <Icon name="ChevronRight" size={14} className="ml-auto text-primary" />}
                  </button>
                );
              })}

              <div className="pt-2 border-t border-border space-y-1 mt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Icon name="LogOut" size={18} />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;