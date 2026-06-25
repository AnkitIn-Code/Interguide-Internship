import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useTranslation } from 'react-i18next';

const PersonalDetailsSection = ({ profile, onUpdate, isEditing, onToggleEdit }) => {
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    dateOfBirth: profile?.dateOfBirth || '',
    location: profile?.location || '',
    linkedinUrl: profile?.linkedinUrl || '',
    githubUrl: profile?.githubUrl || ''
  });

  const [errors, setErrors] = useState({});
  const { t } = useTranslation();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.fullName?.trim()) {
  newErrors.fullName = t('profile.errors.fullNameRequired');
    }
    
    if (!formData?.email?.trim()) {
      newErrors.email = t('profile.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = t('profile.errors.emailInvalid');
    }
    
    if (!formData?.phone?.trim()) {
      newErrors.phone = t('profile.errors.phoneRequired');
    } else if (!/^\+?[\d\s-()]{10,}$/?.test(formData?.phone)) {
      newErrors.phone = t('profile.errors.phoneInvalid');
    }

    if (formData?.linkedinUrl && !formData?.linkedinUrl?.includes('linkedin.com')) {
  newErrors.linkedinUrl = t('profile.errors.linkedinInvalid');
    }

    if (formData?.githubUrl && !formData?.githubUrl?.includes('github.com')) {
  newErrors.githubUrl = t('profile.errors.githubInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onUpdate('personalDetails', formData);
      onToggleEdit();
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile?.fullName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      dateOfBirth: profile?.dateOfBirth || '',
      location: profile?.location || '',
      linkedinUrl: profile?.linkedinUrl || '',
      githubUrl: profile?.githubUrl || ''
    });
    setErrors({});
    onToggleEdit();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="User" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('profile.personal.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('profile.personal.subtitle')}</p>
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
            {t('common.edit')}
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              iconName="Save"
              iconPosition="left"
            >
              {t('common.save')}
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label={t('profile.personal.fullName')}
          type="text"
          value={formData?.fullName}
          onChange={(e) => handleInputChange('fullName', e?.target?.value)}
          error={errors?.fullName}
          disabled={!isEditing}
          required
          placeholder={t('profile.personal.fullNamePlaceholder')}
        />

        <Input
          label={t('login.email')}
          type="email"
          value={formData?.email}
          onChange={(e) => handleInputChange('email', e?.target?.value)}
          error={errors?.email}
          disabled={!isEditing}
          required
          placeholder={t('login.emailPlaceholder')}
        />

        <Input
          label={t('profile.personal.phone')}
          type="tel"
          value={formData?.phone}
          onChange={(e) => handleInputChange('phone', e?.target?.value)}
          error={errors?.phone}
          disabled={!isEditing}
          required
          placeholder={t('profile.personal.phonePlaceholder')}
        />

        <Input
          label={t('profile.personal.dob')}
          type="date"
          value={formData?.dateOfBirth}
          onChange={(e) => handleInputChange('dateOfBirth', e?.target?.value)}
          disabled={!isEditing}
          placeholder={t('profile.personal.dobPlaceholder')}
        />

        <Input
          label={t('profile.personal.location')}
          type="text"
          value={formData?.location}
          onChange={(e) => handleInputChange('location', e?.target?.value)}
          disabled={!isEditing}
          placeholder={t('profile.personal.locationPlaceholder')}
        />

        <Input
          label={t('profile.personal.linkedin')}
          type="url"
          value={formData?.linkedinUrl}
          onChange={(e) => handleInputChange('linkedinUrl', e?.target?.value)}
          error={errors?.linkedinUrl}
          disabled={!isEditing}
          placeholder={t('profile.personal.linkedinPlaceholder')}
        />

        <div className="md:col-span-2">
          <Input
            label={t('profile.personal.github')}
            type="url"
            value={formData?.githubUrl}
            onChange={(e) => handleInputChange('githubUrl', e?.target?.value)}
            error={errors?.githubUrl}
            disabled={!isEditing}
            placeholder={t('profile.personal.githubPlaceholder')}
          />
        </div>
      </div>
      {isEditing && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Info" size={16} className="text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{t('profile.personal.visibilityTitle')}</p>
              <p>{t('profile.personal.visibilityDesc')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDetailsSection;