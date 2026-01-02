// frontend/services/socket.js
import { io } from "socket.io-client";

// Vite proxy handles forwarding to backend
const BACKEND_WS = window.location.origin;

// 🔥 FIX: Auth as a function ensures token is fresh on every reconnection attempt
const socket = io(BACKEND_WS, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  path: '/socket.io',
  auth: (cb) => {
    const token = localStorage.getItem('token');
    const meId = localStorage.getItem('meId');
    // Callback with the latest credentials
    cb({ token, userId: meId });
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Helper if you need to manually update (though the function above handles most cases)
export const updateSocketAuth = (token, userId) => {
	socket.auth = { token, userId };
};

export default socket;