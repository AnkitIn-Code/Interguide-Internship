import React from 'react';
import Icon from '../../../components/AppIcon';
import { useTranslation } from 'react-i18next';

const LoginHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="text-center space-y-4 mb-8">
      {/* Logo */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-elevation-2">
          <Icon name="Briefcase" size={32} color="white" />
        </div>
      </div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {t('login.welcome')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('login.signInToAccount')}
        </p>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {t('login.subtitle')}
      </p>
    </div>
  );
};

export default LoginHeader;