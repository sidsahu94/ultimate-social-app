import axios from 'axios';

// Vite proxy handles forwarding to backend
const API_BASE = '/api';

const API = axios.create({ baseURL: API_BASE, timeout: 30000 });

// Request Interceptor
API.interceptors.request.use(config => {
  const t = localStorage.getItem('token');
  if (t) config.headers = config.headers || {}, config.headers.Authorization = `Bearer ${t}`;
  return config;
}, e => Promise.reject(e));

// Response Interceptor (Auto-Refresh Logic)
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    let message = 'Network error';

    // 1. Handle Rate Limiting
    if (err.response?.status === 429) {
        message = "You're doing that too fast. Please slow down.";
        err.userMessage = message;
        return Promise.reject(err);
    }

    // 2. 🔥 HANDLE 401 (UNAUTHORIZED) & AUTO-REFRESH
    if (err.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Mark as retried to prevent infinite loop

        try {
            // Attempt to get a new token using the Refresh Token
            const refreshToken = localStorage.getItem('refreshToken'); // Ensure you store this on login!
            if (!refreshToken) throw new Error("No refresh token");

            const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });

            // Save new tokens
            localStorage.setItem('token', data.token);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${data.token}`;
            return API(originalRequest);

        } catch (refreshErr) {
            // Refresh failed (expired/invalid) -> Force Logout
            console.warn("Session expired, logging out.");
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('meId');
            window.dispatchEvent(new Event('auth:logout'));
            message = "Session expired. Please login again.";
        }
    } 
    
    // 3. Handle Other Errors
    else if (err.response?.data?.message || err.response?.data?.error) {
        message = err.response.data.message || err.response.data.error;
    } else if (err.message) {
        message = err.message;
    }

    err.userMessage = message;
    return Promise.reject(err);
  }
);

export default API;