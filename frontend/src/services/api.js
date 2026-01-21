// frontend/src/services/api.js
import axios from 'axios';

// Environment Detection
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const API = axios.create({
  baseURL: API_URL, 
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true 
});

// --- REQUEST INTERCEPTOR ---
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
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
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

    // 🔥 NEW: Global 5xx Error Handling
    if (error.response?.status >= 500) {
        // Dispatch custom event for App.jsx to pick up
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('api:error', { 
                detail: "Server error. Please try again later." 
            }));
        }
    }

    // Prevent infinite loops on auth routes
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
    }

    // Handle 401 Unauthorized (Token Refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return API(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const payload = data.data || data; 

        if (!payload.token) throw new Error("Invalid refresh response");

        localStorage.setItem('token', payload.token);
        if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
        
        API.defaults.headers.common['Authorization'] = 'Bearer ' + payload.token;
        originalRequest.headers['Authorization'] = 'Bearer ' + payload.token;
        
        processQueue(null, payload.token);
        return API(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Critical Cleanup
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('meId');
        
        window.dispatchEvent(new Event('auth:logout'));
        
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