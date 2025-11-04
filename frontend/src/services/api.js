// frontend/src/services/api.js
import axios from 'axios';

// If running in production (built and served from backend), use a relative base '/api'.
// During development, default to http://localhost:5000/api unless overridden by VITE_API_BASE.
const PROD = import.meta.env.PROD;
const API_BASE = PROD ? (import.meta.env.VITE_API_BASE || '/api') : (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const API = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// attach token to every request if present
API.interceptors.request.use(
  (config) => {
    try {
      const t = localStorage.getItem('token');
      if (t) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${t}`;
      }
    } catch (e) {}
    return config;
  },
  (err) => Promise.reject(err)
);

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err && err.response && err.response.data) {
      err.userMessage = err.response.data.message || err.response.data.error || err.response.data;
    } else if (err && err.message) {
      err.userMessage = err.message;
    } else {
      err.userMessage = 'Network error';
    }

    if (err?.response?.status === 401) {
      // Clear token & redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('meId');
      // soft redirect:
      if (typeof window !== 'undefined') window.location.assign('/login');
    }

    return Promise.reject(err);
  }
);

export default API;
