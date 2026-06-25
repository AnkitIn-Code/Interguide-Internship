const rawApiBaseUrl = import.meta.env?.VITE_API_URL || '';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};