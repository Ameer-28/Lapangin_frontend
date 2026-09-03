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

// Non-critical / optional endpoints where 401 should NEVER cause a forced redirect
const OPTIONAL_ENDPOINTS = [
  '/favorites',
  '/notifications',
  '/reviews/recent',
];

// Automatically handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = error.config?.url || '';
      const pathname = window.location.pathname || '';

      // Check if caller explicitly requested to skip redirect
      const skipHeader = error.config?.headers?.['X-Skip-Auth-Redirect'] || error.config?.headers?.['x-skip-auth-redirect'];
      const skipFlag = (error.config as any)?.skipAuthRedirect;
      if (skipHeader || skipFlag) {
        return Promise.reject(error);
      }

      // Check if the endpoint itself is optional / non-critical
      const isOptionalEndpoint = OPTIONAL_ENDPOINTS.some(opt => url.includes(opt));
      if (isOptionalEndpoint) {
        return Promise.reject(error);
      }

      // Check if this is an authentication endpoint (login, register, reset, etc.)
      const isAuthEndpoint = 
        url.includes('/auth/login') || 
        url.includes('/auth/register') || 
        url.includes('/auth/forgot-password') || 
        url.includes('/auth/reset-password');
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // Determine if current page is genuinely protected
      const isProtectedRoute = 
        pathname.startsWith('/history') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/bookings/new') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/dashboard');

      // Only redirect if on a genuinely protected route
      if (isProtectedRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (pathname !== '/login' && pathname !== '/admin/login') {
          const redirectTarget = pathname.startsWith('/admin') ? '/admin/login' : '/login';
          window.location.href = redirectTarget;
        }
      } else {
        // If on a public route (e.g. /, /venues, /venues/[id]), quietly clear stale token if invalid,
        // but NEVER disrupt the user's browsing experience with a redirect
        if (url.includes('/auth/profile') || url.includes('/users/me')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
