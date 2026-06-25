import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';
import { authAPI } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email?.trim()) {
      newErrors.email = t('login.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = t('login.errors.emailInvalid');
    }

    if (!formData?.password?.trim()) {
      newErrors.password = t('login.errors.passwordRequired');
    } else if (formData?.password?.length < 6) {
      newErrors.password = t('login.errors.passwordLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Real API call to backend
      const response = await authAPI.login({
        email: formData?.email,
        password: formData?.password,
      });

      if (!response?.token) {
        setErrors({
          general: response?.message || t('login.errors.invalidCredentials')
        });
        return;
      }

      // Save token and user
      localStorage.setItem('authToken', response?.token);
      if (response?.user) {
        localStorage.setItem('user', JSON.stringify(response?.user));
      }
      
      if (formData?.rememberMe) {
        localStorage.setItem('rememberUser', 'true');
        localStorage.setItem('userEmail', formData?.email);
      }

  // Navigate to intended destination or dashboard (no onboarding after login)
  const target = location?.state?.from?.pathname || '/main-dashboard';
  navigate(target, { replace: true });

    } catch (error) {
      setErrors({
        general: t('login.errors.generic')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // In a real app, this would navigate to forgot password page
    alert(t('login.forgotPasswordAlert'));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors?.general && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <p className="text-sm text-error">{errors?.general}</p>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <Input
          label={t('login.email')}
          type="email"
          name="email"
          placeholder={t('login.emailPlaceholder')}
          value={formData?.email}
          onChange={handleInputChange}
          error={errors?.email}
          required
          autoComplete="email"
          className="w-full"
        />

        <Input
          label={t('login.password')}
          type="password"
          name="password"
          placeholder={t('login.passwordPlaceholder')}
          value={formData?.password}
          onChange={handleInputChange}
          error={errors?.password}
          required
          autoComplete="current-password"
          className="w-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <Checkbox
          label={t('login.rememberMe')}
          name="rememberMe"
          checked={formData?.rememberMe}
          onChange={handleInputChange}
          size="sm"
        />

        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-primary hover:text-primary/80 transition-colors duration-200"
        >
          {t('login.forgotPassword')}
        </button>
      </div>
      <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        iconName="LogIn"
        iconPosition="left"
      >
        {isLoading ? t('login.signingIn') : t('login.signIn')}
      </Button>
    </form>
  );
};

export default LoginForm;