// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // This proxy is the permanent fix.
    proxy: {
      // 1. Proxy all API requests
      '/api': {
        target: 'http://localhost:5000', // Your backend server
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false,      // Do not validate SSL certs
      },
      // 2. Proxy the WebSocket connection
      '/socket.io': {
        target: 'http://localhost:5000', // Your backend server
        ws: true,           // Enable WebSocket proxying
        changeOrigin: true,
        secure: false,
      },
    },
  },
});