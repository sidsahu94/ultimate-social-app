// frontend/services/api.js
import axios from 'axios';

// FIX: The API base URL must be a relative path.
// Vite's proxy (in vite.config.js) will catch this
// and forward it to http://localhost:5000/api
const API_BASE = '/api';

console.log('🔗 API Base URL =>', API_BASE); // This will now log "/api"

const API = axios.create({ baseURL: API_BASE, timeout: 30000 });

API.interceptors.request.use(config => {
  const t = localStorage.getItem('token');
  if (t) config.headers = config.headers || {}, config.headers.Authorization = `Bearer ${t}`;
  return config;
}, e => Promise.reject(e));

API.interceptors.response.use(res => res, err => {
  if (err && err.response && err.response.data) err.userMessage = err.response.data.message || err.response.data.error || err.response.data;
  else if (err && err.message) err.userMessage = err.message;
  else err.userMessage = 'Network error';
  
  if (err?.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('meId');
    if (typeof window !== 'undefined') window.location.assign('/login');
  }
  return Promise.reject(err);
});

export default API;
// Helper function to use in components
export const getImageUrl = (url) => {
  if (!url) return '/default-avatar.png';
  if (url.startsWith('http')) return url; // Cloudinary URL
  // If local path, prepend backend URL (handled by proxy or explicit localhost:5000)
  return `http://localhost:5000${url}`; 
};