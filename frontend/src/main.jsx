import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { VideoProvider } from './contexts/VideoContext';
import { SocketProvider } from './contexts/SocketContext'; // Ensure this file exists
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./index.css";
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { fetchMe } from './redux/slices/authSlice';

// --- Auth Initializer ---
// Ensures user session is validated on app load before rendering children
function AuthInitializer({ children }) {
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        store.dispatch(fetchMe());
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