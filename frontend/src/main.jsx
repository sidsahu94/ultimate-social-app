// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { VideoProvider } from './contexts/VideoContext';
import { SocketProvider } from './contexts/SocketContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./index.css";
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { fetchMe } from './redux/slices/authSlice';

// --- Push Notification Utilities ---

// Helper to convert VAPID key from string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Function to register Service Worker and Subscribe to Push
const registerPush = async () => {
    if (!('serviceWorker' in navigator)) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // 1. Wait for Service Worker to be ready
        // (Vite PWA plugin registers it automatically, but we wait for it here)
        const reg = await navigator.serviceWorker.ready;

        // 2. Fetch Public Key from Backend
        // Note: Using relative path assumes Vite proxy is working or base URL set in API util
        // For fetch here, we need the full URL or rely on the same origin if proxied
        const res = await fetch('/api/notifications/push-key', { 
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
            // Silently fail if endpoint not ready or auth failed
            return; 
        }
        
        const data = await res.json();
        // Handle both "unified response" (data.data.publicKey) and "legacy response" (data.publicKey)
        const publicKey = data.data?.publicKey || data.publicKey; 
        
        if (!publicKey) return;

        // 3. Subscribe the browser
        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        // 4. Send subscription object to Backend
        await fetch('/api/notifications/subscribe', {
            method: 'POST',
            body: JSON.stringify(sub),
            headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}` 
            }
        });
        
        console.log("✅ Push Notifications Subscribed");
    } catch (e) {
        // Common errors: User denied permission, VAPID key mismatch, or incognito mode
        console.warn("Push registration failed/skipped:", e.message);
    }
};

// --- Auth Initializer ---
// Ensures user session is validated on app load before rendering children
function AuthInitializer({ children }) {
  React.useEffect(() => {
    // 🔥 FIX: Only dispatch fetchMe if a token actually exists in storage
    // This prevents the immediate 401 error loop on fresh loads for guests
    const token = localStorage.getItem('token');
    if (token) {
        store.dispatch(fetchMe());
        // registerPush(); // Uncomment when VAPID keys are configured in .env
    }
  }, []);
  
  return children;
}

const Root = () => {
  useKeyboardShortcuts();
  
  // Load Client ID from Environment Variables
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.warn("⚠️ VITE_GOOGLE_CLIENT_ID is missing. Google Login may fail.");
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Provider store={store}>
        <AuthInitializer>
          <ThemeProvider>
            <ToastProvider>
              {/* SocketProvider handles the connection logic now */}
              <SocketProvider>
                <VideoProvider>
                  <App />
                </VideoProvider>
              </SocketProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthInitializer>
      </Provider>
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);