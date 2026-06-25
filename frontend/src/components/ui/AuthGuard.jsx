import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { apiUrl } from '../../utils/apiBaseUrl';

const AuthGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const publicRoutes = ['/user-login', '/user-registration'];
  const isPublicRoute = publicRoutes?.includes(location?.pathname);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Validate token with backend
        const response = await fetch(apiUrl('/auth/validate'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response?.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [location?.pathname]);

  // Show loading state during authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <Icon name="Briefcase" size={24} color="white" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32 mx-auto skeleton"></div>
            <div className="h-3 bg-muted rounded w-24 mx-auto skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect authenticated users away from public routes
  if (isAuthenticated && isPublicRoute) {
    return <Navigate to="/main-dashboard" replace />;
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/user-login" replace state={{ from: location }} />;
  }

  // Render children for valid routes
  return children;
};

export default AuthGuard;