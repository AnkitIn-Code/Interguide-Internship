import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const AuthFooter = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Button
            variant="link"
            onClick={() => navigate('/user-login')}
            className="p-0 h-auto font-medium text-primary hover:text-primary/80"
          >
            Sign in here
          </Button>
        </p>
      </div>
      {/* Legal Links */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
        <button className="hover:text-foreground transition-colors duration-200">
          Terms of Service
        </button>
        <span className="text-border">•</span>
        <button className="hover:text-foreground transition-colors duration-200">
          Privacy Policy
        </button>
        <span className="text-border">•</span>
        <button className="hover:text-foreground transition-colors duration-200">
          Cookie Policy
        </button>
      </div>
      {/* Copyright */}
      <div className="text-center text-sm text-muted-foreground">
  <p>© {new Date()?.getFullYear()} InternGuide AI. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AuthFooter;