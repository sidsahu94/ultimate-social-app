import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'socialverse-logo.jpg'
      ],
      workbox: {
        // Enforce strict limit on precache to prevent choking user bandwidth & memory on load
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // NEVER precache large neural network model shards or sourcemaps in service worker
        globIgnores: [
          '**/group1-shard*',
          '**/model*.min.js*',
          '**/ai-models-*.js',
          '**/*.map'
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-media',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'SocialVerse ∞ — Beyond Social',
        short_name: 'SocialVerse',
        description: 'Next-Gen Social Network with 8 luxury themes, cinematic canvas, and 3D creative AI.',
        theme_color: '#070B14',
        background_color: '#04070D',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  define: {
    global: 'window',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Isolate AI/TensorFlow models into their own lazy chunk so they never bloat initial load
            if (id.includes('@tensorflow') || id.includes('nsfwjs')) {
              return 'ai-models';
            }
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom') || id.includes('react-redux') || id.includes('@reduxjs/toolkit')) {
              return 'react-core';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charts';
            }
            if (id.includes('qrcode.react') || id.includes('react-qr-code') || id.includes('react-qr-reader')) {
              return 'qr-tools';
            }
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons';
            }
            if (id.includes('date-fns') || id.includes('axios') || id.includes('socket.io-client')) {
              return 'networking';
            }
          }
        }
      }
    }
  }
});
