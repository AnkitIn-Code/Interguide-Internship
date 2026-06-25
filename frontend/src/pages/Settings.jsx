import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import Header from '../components/ui/Header';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const [aiApiKey, setAiApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const existingKey = settingsAPI.getAIApiKey();
    if (existingKey) {
      setAiApiKey(existingKey);
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (!aiApiKey.trim()) return;
    
    try {
      setLoading(true);
      await settingsAPI.saveAIApiKey(aiApiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving AI API key:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* AI Configuration */}
        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="Bot" size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {t('settings.aiRecommendations')}
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('settings.aiApiKey')}
              </label>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder={t('settings.aiApiKeyPlaceholder')}
                  className="flex-1 px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <Button
                  onClick={handleSaveApiKey}
                  disabled={!aiApiKey.trim() || loading}
                  iconName={saved ? "Check" : "Save"}
                >
                  {loading ? t('settings.saving') : saved ? t('settings.saved') : t('settings.save')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('settings.aiHelp')}
              </p>
            </div>
          </div>
        </div>

        {/* Other Settings */}
        <div className="bg-card rounded-lg border border-border p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {t('settings.general')}
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h3 className="font-medium text-foreground">{t('settings.emailNotifications')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.emailNotificationsDesc')}
                </p>
              </div>
              <Button variant="outline" size="sm">
                {t('settings.configure')}
              </Button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <h3 className="font-medium text-foreground">{t('settings.privacy')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.privacyDesc')}
                </p>
              </div>
              <Button variant="outline" size="sm">
                {t('settings.manage')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
