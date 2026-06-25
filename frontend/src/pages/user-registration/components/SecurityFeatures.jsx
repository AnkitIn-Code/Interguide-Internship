import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityFeatures = () => {
  const securityFeatures = [
    {
      icon: 'Shield',
      title: 'Secure Registration',
      description: 'Your data is protected with industry-standard encryption'
    },
    {
      icon: 'Lock',
      title: 'Privacy First',
      description: 'We never share your personal information with third parties'
    },
    {
      icon: 'CheckCircle',
      title: 'Verified Platform',
      description: 'Trusted by 50,000+ students and 1,000+ companies'
    }
  ];

  return (
    <div className="bg-muted/30 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground text-center">
  Why Choose InternGuide AI?
      </h3>
      <div className="space-y-4">
        {securityFeatures?.map((feature, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name={feature?.icon} size={16} className="text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-foreground">
                {feature?.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {feature?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Trust Indicators */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="Users" size={12} />
            <span>50K+ Students</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <Icon name="Building" size={12} />
            <span>1K+ Companies</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <Icon name="Star" size={12} />
            <span>4.8/5 Rating</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityFeatures;