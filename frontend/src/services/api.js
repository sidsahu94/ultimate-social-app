// frontend/src/services/api.js
import axios from 'axios';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 🔥 Crucial: Allows sending/receiving HTTP-Only Cookies
});

// --- REQUEST INTERCEPTOR ---
// Attaches the short-lived Access Token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
// Handles Token Refresh and Error Queueing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🔥 Global 5xx Error Handling (Server Crash/Error)
    if (error.response?.status >= 500) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('api:error', {
            detail: 'Server error. Please try again later.',
          })
        );
      }
    }

    // Prevent infinite loops on auth routes
    if (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (Access Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return API(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt refresh using the HTTP-Only cookie
        // Note: No body needed, the cookie is sent automatically via withCredentials
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Backend returns the new Access Token
        const payload = data.data || data;
        const newToken = payload.token;

        if (!newToken) throw new Error('Invalid refresh response');

        // Update Local Storage with new Access Token
        localStorage.setItem('token', newToken);

        // Update default headers for future requests
        API.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

        // Process the queue of failed requests
        processQueue(null, newToken);

        // Retry the original request
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed (Cookie expired or invalid)
        processQueue(refreshError, null);

        // Critical Cleanup
        localStorage.removeItem('token');
        localStorage.removeItem('meId');

        // Dispatch Logout Event (App.jsx listens to this)
        window.dispatchEvent(new Event('auth:logout'));

        // Redirect to Login if not already on a public page
        const publicPaths = ['/login', '/register', '/welcome', '/verify-account'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;