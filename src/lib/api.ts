import axios from 'axios';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://lapangin-backend.up.railway.app';
const cleanUrl = rawUrl.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: `${cleanUrl}/api`,
});

// Interceptor to add auth token if available (client-side only logic)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Automatically handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
