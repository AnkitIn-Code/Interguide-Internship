import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const PrivacySettingsSection = ({ profile, onUpdate, isEditing, onToggleEdit }) => {
  const [settings, setSettings] = useState({
    profileVisibility: profile?.privacy?.profileVisibility ?? true,
    showEmail: profile?.privacy?.showEmail ?? false,
    showPhone: profile?.privacy?.showPhone ?? false,
    allowRecommendations: profile?.privacy?.allowRecommendations ?? true,
    shareWithPartners: profile?.privacy?.shareWithPartners ?? false,
    marketingEmails: profile?.privacy?.marketingEmails ?? true,
    applicationNotifications: profile?.privacy?.applicationNotifications ?? true,
    weeklyDigest: profile?.privacy?.weeklyDigest ?? true
  });

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = () => {
    onUpdate('privacy', settings);
    onToggleEdit();
  };

  const handleCancel = () => {
    setSettings({
      profileVisibility: profile?.privacy?.profileVisibility ?? true,
      showEmail: profile?.privacy?.showEmail ?? false,
      showPhone: profile?.privacy?.showPhone ?? false,
      allowRecommendations: profile?.privacy?.allowRecommendations ?? true,
      shareWithPartners: profile?.privacy?.shareWithPartners ?? false,
      marketingEmails: profile?.privacy?.marketingEmails ?? true,
      applicationNotifications: profile?.privacy?.applicationNotifications ?? true,
      weeklyDigest: profile?.privacy?.weeklyDigest ?? true
    });
    onToggleEdit();
  };

  const privacyOptions = [
    {
      category: 'Profile Visibility',
      options: [
        {
          key: 'profileVisibility',
          label: 'Make my profile visible to employers',
          description: 'Allow employers to discover your profile when searching for candidates',
          icon: 'Eye'
        },
        {
          key: 'showEmail',
          label: 'Show email address on profile',
          description: 'Display your email address to potential employers',
          icon: 'Mail'
        },
        {
          key: 'showPhone',
          label: 'Show phone number on profile',
          description: 'Display your phone number to potential employers',
          icon: 'Phone'
        }
      ]
    },
    {
      category: 'Data Sharing',
      options: [
        {
          key: 'allowRecommendations',
          label: 'Enable AI-powered recommendations',
          description: 'Allow our AI to analyze your profile for personalized internship suggestions',
          icon: 'Zap'
        },
        {
          key: 'shareWithPartners',
          label: 'Share profile with partner organizations',
          description: 'Allow trusted partner companies to access your profile for opportunities',
          icon: 'Users'
        }
      ]
    },
    {
      category: 'Communication Preferences',
      options: [
        {
          key: 'marketingEmails',
          label: 'Receive marketing emails',
          description: 'Get updates about new features, tips, and platform news',
          icon: 'Mail'
        },
        {
          key: 'applicationNotifications',
          label: 'Application status notifications',
          description: 'Receive emails when your application status changes',
          icon: 'Bell'
        },
        {
          key: 'weeklyDigest',
          label: 'Weekly opportunity digest',
          description: 'Get a weekly summary of new internship opportunities',
          icon: 'Calendar'
        }
      ]
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Icon name="Shield" size={20} className="text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Privacy Settings</h3>
            <p className="text-sm text-muted-foreground">Control your data sharing and visibility preferences</p>
          </div>
        </div>
        
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEdit}
            iconName="Edit"
            iconPosition="left"
          >
            Edit
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              iconName="Save"
              iconPosition="left"
            >
              Save
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-8">
        {privacyOptions?.map((category) => (
          <div key={category?.category}>
            <h4 className="text-md font-medium text-foreground mb-4">{category?.category}</h4>
            <div className="space-y-4">
              {category?.options?.map((option) => (
                <div key={option?.key} className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors duration-200">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mt-1">
                    <Icon name={option?.icon} size={16} className="text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-foreground">{option?.label}</h5>
                        <p className="text-sm text-muted-foreground mt-1">{option?.description}</p>
                      </div>
                      
                      <Checkbox
                        checked={settings?.[option?.key]}
                        onChange={(e) => handleSettingChange(option?.key, e?.target?.checked)}
                        disabled={!isEditing}
                        className="ml-4"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Privacy Summary */}
      {!isEditing && (
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-3">Current Privacy Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Profile Visible:</span>
                <span className={settings?.profileVisibility ? 'text-success' : 'text-destructive'}>
                  {settings?.profileVisibility ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AI Recommendations:</span>
                <span className={settings?.allowRecommendations ? 'text-success' : 'text-destructive'}>
                  {settings?.allowRecommendations ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Partner Sharing:</span>
                <span className={settings?.shareWithPartners ? 'text-warning' : 'text-success'}>
                  {settings?.shareWithPartners ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email Notifications:</span>
                <span className={settings?.applicationNotifications ? 'text-success' : 'text-muted-foreground'}>
                  {settings?.applicationNotifications ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Marketing Emails:</span>
                <span className={settings?.marketingEmails ? 'text-success' : 'text-muted-foreground'}>
                  {settings?.marketingEmails ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Weekly Digest:</span>
                <span className={settings?.weeklyDigest ? 'text-success' : 'text-muted-foreground'}>
                  {settings?.weeklyDigest ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Privacy Information */}
      <div className="mt-6 p-4 bg-warning/5 rounded-lg">
        <div className="flex items-start space-x-2">
          <Icon name="Info" size={16} className="text-warning mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Your Privacy Matters</p>
            <p>We take your privacy seriously. You have full control over what information is shared and with whom. You can update these settings at any time. For more details, please review our Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsSection;