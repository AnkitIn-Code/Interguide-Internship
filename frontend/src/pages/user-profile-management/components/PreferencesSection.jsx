import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const PreferencesSection = ({ profile, onUpdate, isEditing, onToggleEdit }) => {
  const [formData, setFormData] = useState({
    preferredSectors: profile?.preferences?.sectors || [],
    preferredLocations: profile?.preferences?.locations || [],
    workType: profile?.preferences?.workType || '',
    internshipDuration: profile?.preferences?.duration || '',
    salaryExpectation: profile?.preferences?.salary || ''
  });

  const sectorOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'nonprofit', label: 'Non-Profit' },
    { value: 'government', label: 'Government' },
    { value: 'startups', label: 'Startups' }
  ];

  const locationOptions = [
    { value: 'new-york', label: 'New York, NY' },
    { value: 'san-francisco', label: 'San Francisco, CA' },
    { value: 'los-angeles', label: 'Los Angeles, CA' },
    { value: 'chicago', label: 'Chicago, IL' },
    { value: 'boston', label: 'Boston, MA' },
    { value: 'seattle', label: 'Seattle, WA' },
    { value: 'austin', label: 'Austin, TX' },
    { value: 'denver', label: 'Denver, CO' },
    { value: 'atlanta', label: 'Atlanta, GA' },
    { value: 'miami', label: 'Miami, FL' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const workTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'on-site', label: 'On-site' }
  ];

  const durationOptions = [
    { value: '1-3', label: '1-3 months' },
    { value: '3-6', label: '3-6 months' },
    { value: '6-12', label: '6-12 months' },
    { value: '12+', label: '12+ months' }
  ];

  const salaryOptions = [
    { value: 'unpaid', label: 'Unpaid' },
    { value: '500-1000', label: '$500 - $1,000/month' },
    { value: '1000-2000', label: '$1,000 - $2,000/month' },
    { value: '2000-3000', label: '$2,000 - $3,000/month' },
    { value: '3000+', label: '$3,000+/month' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onUpdate('preferences', formData);
    onToggleEdit();
  };

  const handleCancel = () => {
    setFormData({
      preferredSectors: profile?.preferences?.sectors || [],
      preferredLocations: profile?.preferences?.locations || [],
      workType: profile?.preferences?.workType || '',
      internshipDuration: profile?.preferences?.duration || '',
      salaryExpectation: profile?.preferences?.salary || ''
    });
    onToggleEdit();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <Icon name="Target" size={20} className="text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Preferences</h3>
            <p className="text-sm text-muted-foreground">Set your internship preferences for better matches</p>
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Preferred Sectors"
            description="Select industries you're interested in"
            options={sectorOptions}
            value={formData?.preferredSectors}
            onChange={(value) => handleInputChange('preferredSectors', value)}
            disabled={!isEditing}
            multiple
            searchable
            placeholder="Choose sectors..."
          />

          <Select
            label="Preferred Locations"
            description="Select locations where you'd like to work"
            options={locationOptions}
            value={formData?.preferredLocations}
            onChange={(value) => handleInputChange('preferredLocations', value)}
            disabled={!isEditing}
            multiple
            searchable
            placeholder="Choose locations..."
          />

          <Select
            label="Work Type"
            description="Your preferred work arrangement"
            options={workTypeOptions}
            value={formData?.workType}
            onChange={(value) => handleInputChange('workType', value)}
            disabled={!isEditing}
            placeholder="Select work type"
          />

          <Select
            label="Internship Duration"
            description="How long you'd like to intern"
            options={durationOptions}
            value={formData?.internshipDuration}
            onChange={(value) => handleInputChange('internshipDuration', value)}
            disabled={!isEditing}
            placeholder="Select duration"
          />

          <div className="md:col-span-2">
            <Select
              label="Salary Expectation"
              description="Your expected compensation range"
              options={salaryOptions}
              value={formData?.salaryExpectation}
              onChange={(value) => handleInputChange('salaryExpectation', value)}
              disabled={!isEditing}
              placeholder="Select salary range"
            />
          </div>
        </div>

        {/* Preference Summary */}
        {!isEditing && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-3">Current Preferences Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Sectors:</span>
                <div className="mt-1">
                  {formData?.preferredSectors?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData?.preferredSectors?.slice(0, 3)?.map((sector) => {
                        const option = sectorOptions?.find(opt => opt?.value === sector);
                        return (
                          <span key={sector} className="bg-success/10 text-success px-2 py-0.5 rounded text-xs">
                            {option?.label}
                          </span>
                        );
                      })}
                      {formData?.preferredSectors?.length > 3 && (
                        <span className="text-muted-foreground text-xs">+{formData?.preferredSectors?.length - 3} more</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Not specified</span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Locations:</span>
                <div className="mt-1">
                  {formData?.preferredLocations?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData?.preferredLocations?.slice(0, 2)?.map((location) => {
                        const option = locationOptions?.find(opt => opt?.value === location);
                        return (
                          <span key={location} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                            {option?.label}
                          </span>
                        );
                      })}
                      {formData?.preferredLocations?.length > 2 && (
                        <span className="text-muted-foreground text-xs">+{formData?.preferredLocations?.length - 2} more</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {isEditing && (
        <div className="mt-6 p-4 bg-success/5 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Zap" size={16} className="text-success mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">AI Matching Impact</p>
              <p>Your preferences directly influence our AI recommendations. The more specific you are, the better we can match you with relevant internship opportunities.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencesSection;
