// frontend/services/socket.js
import { io } from "socket.io-client";

// FIX: The backend URL should be the relative origin.
// Vite's proxy will handle forwarding this to http://localhost:5000
const BACKEND_WS = window.location.origin;

const auth = {};
try {
  const token = localStorage.getItem('token');
  const meId = localStorage.getItem('meId');
  if (token) auth.token = token;
  if (meId) auth.userId = meId;
} catch {}

const socket = io(BACKEND_WS, {
  autoConnect: false, // We connect manually in main.jsx after auth
  transports: ["websocket", "polling"],
  path: '/socket.io', // This path must match the backend
  auth
});

// Update auth details dynamically
export const updateSocketAuth = (token, userId) => {
	socket.auth = { token, userId };
};

export default socket;