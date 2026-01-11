// frontend/src/services/api.js
import axios from 'axios';

// Create Instance
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Change this to your production URL if deployed
  headers: { 
    'Content-Type': 'application/json' 
  },
  withCredentials: true // Important for cross-site cookies if used, good practice generally
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
      originalRequest._retry = true; // Mark as retried to prevent infinite loops

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        // Call backend to get a new access token
        const { data } = await axios.post('http://localhost:5000/api/auth/refresh', { 
            refreshToken 
        });

        // Save new token
        localStorage.setItem('token', data.accessToken);
        
        // Update the header of the failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        // Retry the original request
        return API(originalRequest);

      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        
        // If refresh fails, the session is truly dead. Clean up and redirect.
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('meId');
        
        // Dispatch a custom event so App.jsx can handle the UI redirect safely
        window.dispatchEvent(new Event('auth:logout'));
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;