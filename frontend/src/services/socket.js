import { io } from 'socket.io-client';

const getBackendWs = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const envWs = import.meta.env.VITE_WS_URL;
  if (envWs) return envWs;
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && envApi.startsWith('http')) {
    try {
      return new URL(envApi).origin;
    } catch (_) {}
  }
  return window.location.origin;
};

const socket = io(getBackendWs(), {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  auth: (cb) => {
    const token = localStorage.getItem('token');
    const meId = localStorage.getItem('meId');
    cb({ token, userId: meId });
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect_error', (err) => {
  if (
    err.message === 'Unauthorized' ||
    err.message === 'Authentication error' ||
    err.message.toLowerCase().includes('token')
  ) {
    console.warn('Socket authentication failed. Stopping reconnection loop.');
    socket.disconnect();
  }
});

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    if (socket.connected) socket.disconnect();
  });
}

export const updateSocketAuth = (token, userId) => {
  socket.auth = { token, userId };
  if (socket.disconnected) socket.connect();
};

export default socket;