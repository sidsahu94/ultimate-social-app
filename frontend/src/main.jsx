// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import "./index.css";
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import socket from './services/socket';
import API from './services/api';
import { fetchMe, setUser } from './redux/slices/authSlice';

function SocketConnector() {
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Try to fetch user and verify token. If it works, connect socket.
    store.dispatch(fetchMe())
      .unwrap()
      .then(user => {
        // setUser already handled by fetchMe extraReducers but keep consistent
        store.dispatch(setUser(user));
        socket.auth = { token };
        socket.connect();
      })
      .catch(err => {
        console.warn('fetchMe failed, clearing token', err);
        localStorage.removeItem('token');
        localStorage.removeItem('meId');
      });

    // socket listeners
    const onConnect = () => console.log('socket connected', socket.id);
    const onDisconnect = (r) => console.log('socket disconnected', r);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receiveMessage', (data) => window.dispatchEvent(new CustomEvent('socketMessage', { detail: data })));
    socket.on('notification', (data) => window.dispatchEvent(new CustomEvent('socketNotification', { detail: data })));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receiveMessage');
      socket.off('notification');
      if (socket && socket.connected) socket.disconnect();
    };
  }, []);

  return null;
}

const Root = () => {
  useKeyboardShortcuts();
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <SocketConnector />
          <App />
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
