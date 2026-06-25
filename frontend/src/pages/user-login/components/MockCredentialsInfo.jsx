import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MockCredentialsInfo = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mockCredentials = [
    {
      role: 'Student',
      email: 'student@internshiphub.com',
      password: 'Student123!',
      description: 'Access student dashboard with internship recommendations'
    },
    {
      role: 'Counselor',
      email: 'counselor@internshiphub.com',
      password: 'Counselor123!',
      description: 'Access counselor tools for managing student applications'
    },
    {
      role: 'Admin',
      email: 'admin@internshiphub.com',
      password: 'Admin123!',
      description: 'Full administrative access to platform features'
    }
  ];

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon name="Info" size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">
            Demo Credentials
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          iconPosition="right"
        >
          {isExpanded ? 'Hide' : 'Show'}
        </Button>
      </div>
      {isExpanded && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Use these credentials to test different user roles:
          </p>
          
          {mockCredentials?.map((cred, index) => (
            <div key={index} className="p-3 bg-card rounded-md border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {cred?.role}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => navigator.clipboard?.writeText(cred?.email)}
                    className="p-1 hover:bg-muted rounded transition-colors duration-200"
                    title="Copy email"
                  >
                    <Icon name="Copy" size={12} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Email:</span>
                  <code className="bg-muted px-1 py-0.5 rounded text-foreground">
                    {cred?.email}
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Password:</span>
                  <code className="bg-muted px-1 py-0.5 rounded text-foreground">
                    {cred?.password}
                  </code>
                </div>
                <p className="text-muted-foreground mt-1">
                  {cred?.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MockCredentialsInfo;