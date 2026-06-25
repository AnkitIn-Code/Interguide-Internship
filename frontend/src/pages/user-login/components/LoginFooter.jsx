import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const LoginFooter = () => {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/user-registration');
  };

  return (
    <div className="space-y-6">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">
            New to InternGuide AI?
          </span>
        </div>
      </div>

      {/* Register Button */}
      <Button
        variant="outline"
        size="lg"
        fullWidth
        onClick={handleRegisterClick}
        iconName="UserPlus"
        iconPosition="left"
      >
        Create an account
      </Button>

      {/* Help Text */}
      <p className="text-center text-xs text-muted-foreground">
        By signing in, you agree to our{' '}
        <button className="text-primary hover:text-primary/80 transition-colors duration-200">
          Terms of Service
        </button>{' '}
        and{' '}
        <button className="text-primary hover:text-primary/80 transition-colors duration-200">
          Privacy Policy
        </button>
      </p>
    </div>
  );
};

export default LoginFooter;