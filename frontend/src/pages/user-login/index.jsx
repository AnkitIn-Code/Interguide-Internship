import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import LoginFooter from './components/LoginFooter';
import MockCredentialsInfo from './components/MockCredentialsInfo';
// Auth handled inside LoginForm via services/api

const UserLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/main-dashboard');
    }
  }, [navigate]);

  // Login is handled within LoginForm component

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl shadow-elevation-2 p-8">
          <LoginHeader />
          {/* LoginForm handles API call and navigation */}
          <LoginForm />
          <LoginFooter />
        </div>

  {/* Show mock creds in dev */}
  {import.meta.env.DEV && <MockCredentialsInfo />}
      </div>
    </div>
  );
};

export default UserLogin;