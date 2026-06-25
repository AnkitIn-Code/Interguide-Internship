import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import { useTranslation } from 'react-i18next';


const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // If user is already logged in, redirect directly to dashboard
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    return <Navigate to="/main-dashboard" replace />;
  }

  const features = [
    {
      icon: 'Search',
      title: t('landing.features.discover.title'),
      description: t('landing.features.discover.desc')
    },
    {
      icon: 'ClipboardList',
      title: t('landing.features.track.title'),
      description: t('landing.features.track.desc')
    },
    {
      icon: 'BarChart',
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.desc')
    },
    {
      icon: 'Users',
      title: t('landing.features.community.title'),
      description: t('landing.features.community.desc')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-elevation-1">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Briefcase" size={20} color="white" />
              </div>
              <span className="text-xl font-semibold text-foreground">
                {t('appTitle')}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/user-login')}
              >
                {t('nav.login')}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/user-registration')}
              >
                {t('nav.signup')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              {t('landing.hero.title1')}
              <span className="text-primary block">{t('landing.hero.title2')}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {t('landing.hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/user-registration')}
                iconName="ArrowRight"
                iconPosition="right"
              >
                {t('cta.getStarted')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/user-login')}
              >
                {t('cta.signIn')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-lg border border-border hover:shadow-elevation-2 transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon name={feature.icon} size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/user-registration')}
            iconName="ArrowRight"
            iconPosition="right"
          >
            {t('cta.createAccount')}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Briefcase" size={20} color="white" />
              </div>
              <span className="text-xl font-semibold text-foreground">
                {t('appTitle')}
              </span>
            </div>
            <p className="text-muted-foreground">
              {t('landing.footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
