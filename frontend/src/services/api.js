// frontend/src/services/api.js
import axios from 'axios';

// 🔥 FIX: Automatically detect environment
// In Production (Render), use relative path '/api'.
// In Development (Local), use 'http://localhost:5000/api'.
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_URL,
  headers: { 
    'Content-Type': 'application/json' 
  },
  withCredentials: true // Important for cookies/sessions
});

// --- REQUEST INTERCEPTOR ---
// Automatically adds the JWT token to the Authorization header
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
// Handles 401 errors (Token Expiry) by trying to refresh the token
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loops

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        // 🔥 FIX: Use the dynamic API_URL for the refresh call too
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { 
            refreshToken 
        });

        // Save new token
        localStorage.setItem('token', data.token || data.accessToken);
        
        // Update the header of the failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${data.token || data.accessToken}`;
        
        // Retry the original request
        return API(originalRequest);

      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        
        // If refresh fails, the session is truly dead. Clean up and redirect.
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('meId');
        
        // Dispatch event for UI handling
        window.dispatchEvent(new Event('auth:logout'));
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;