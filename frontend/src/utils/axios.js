import axios from 'axios';
import { API_BASE_URL } from './apiBaseUrl';

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Attach auth token to every request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally - redirect to login
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/user-login';
    }
    return Promise.reject(error);
  }
);

export default instance;
