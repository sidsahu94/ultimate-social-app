import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { VideoProvider } from './contexts/VideoContext'; // "Super App" Video Context
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./index.css";
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import socket, { updateSocketAuth } from './services/socket';
import { fetchMe, setUser } from './redux/slices/authSlice';

// --- Socket Connector Component ---
// Handles connecting/disconnecting socket based on Auth state
function SocketConnector() {
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const meId = localStorage.getItem('meId');
    
    if (!token || !meId) {
      store.dispatch(setUser(null)); 
      return;
    }

    // 1. Fetch user data to verify token
    store.dispatch(fetchMe())
      .unwrap()
      .then(user => {
        // 2. Update Redux & Socket Auth
        store.dispatch(setUser(user));
        updateSocketAuth(token, user._id);
        socket.connect();
        
        // 3. Join Personal Room
        socket.on('connect', () => {
          socket.emit('joinRoom', { room: user._id }); 
          console.log('🔌 Socket connected via Main.jsx');
        });
      })
      .catch(err => {
        console.warn('Session expired:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('meId');
        store.dispatch(setUser(null)); 
      });

    return () => {
      // Cleanup on unmount (though Main usually doesn't unmount)
      if (socket && socket.connected) socket.disconnect();
    };
  }, []);
  
  return null;
}

// --- Root Component ---
const Root = () => {
  useKeyboardShortcuts();
  
  // Load Client ID from Environment Variables
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("🚨 CRITICAL: VITE_GOOGLE_CLIENT_ID is missing in .env file. Google Login will fail.");
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <VideoProvider>
              <SocketConnector />
              <App />
            </VideoProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);