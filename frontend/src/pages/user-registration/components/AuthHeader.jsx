import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const AuthHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center space-y-6">
      {/* Logo */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => navigate('/main-dashboard')}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
        >
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-elevation-1">
            <Icon name="Briefcase" size={28} color="white" />
          </div>
          <span className="text-2xl font-bold text-foreground">
            InternGuide AI
          </span>
        </button>
      </div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Create Your Account
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Join thousands of students who have found their dream internships through our AI-powered platform
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Icon name="Zap" size={16} className="text-green-600" />
          </div>
          <span>AI-Powered Matching</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Icon name="Target" size={16} className="text-blue-600" />
          </div>
          <span>Track Applications</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Icon name="TrendingUp" size={16} className="text-purple-600" />
          </div>
          <span>Career Analytics</span>
        </div>
      </div>
    </div>
  );
};

export default AuthHeader;
