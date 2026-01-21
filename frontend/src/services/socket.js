// frontend/services/socket.js
import { io } from "socket.io-client";

// Vite proxy handles forwarding to backend
const BACKEND_WS = window.location.origin;

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

// Prevent infinite auth loops
socket.on("connect_error", (err) => {
  if (err.message === "Unauthorized" || err.message === "Authentication error" || err.message.includes("token")) {
    console.warn("Socket authentication failed. Stopping reconnection loop.");
    socket.disconnect();
  }
});

// 🔥 NEW: Global Logout Listener to kill socket connection
if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', () => {
        if (socket.connected) {
            console.log("🔒 Logging out socket...");
            socket.disconnect();
        }
    });
}

// Helper to manually update auth
export const updateSocketAuth = (token, userId) => {
    socket.auth = { token, userId };
    if (socket.disconnected) {
        socket.connect();
    }
};

export default socket;