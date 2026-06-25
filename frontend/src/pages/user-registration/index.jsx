import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import RegistrationForm from './components/RegistrationForm';
import AuthHeader from './components/AuthHeader';
import AuthFooter from './components/AuthFooter';
import SecurityFeatures from './components/SecurityFeatures';

const UserRegistration = () => {
  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    
  }, []);

  return (
    <>
      <Helmet>
  <title>Create Account - InternGuide AI</title>
  <meta name="description" content="Join InternGuide AI and discover your perfect internship with AI-powered recommendations. Create your free account today." />
        <meta name="keywords" content="internship, registration, student account, career, AI matching" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Main Container */}
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Side - Form Section */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-md space-y-8">
              {/* Header */}
              <AuthHeader />

              {/* Registration Form */}
              <div className="bg-card border border-border rounded-lg shadow-elevation-1 p-6 lg:p-8">
                <RegistrationForm />
              </div>

              {/* Footer */}
              <AuthFooter />
            </div>
          </div>

          {/* Right Side - Security Features (Desktop Only) */}
          <div className="hidden lg:flex lg:w-96 bg-muted/20 p-12 items-center">
            <div className="w-full space-y-8">
              <SecurityFeatures />
              
              {/* Additional Info */}
              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4 border border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Quick Setup Process
                  </h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">1</span>
                      </div>
                      <span>Create your account</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">2</span>
                      </div>
                      <span>Complete your profile</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">3</span>
                      </div>
                      <span>Get personalized recommendations</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  <p>Setup takes less than 5 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Security Features */}
        <div className="lg:hidden p-6">
          <SecurityFeatures />
        </div>
      </div>
    </>
  );
};

export default UserRegistration;