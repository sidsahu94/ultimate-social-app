// frontend/src/services/socket.js
import { io } from "socket.io-client";

const PROD = import.meta.env.PROD;
const BACKEND_WS = PROD ? (import.meta.env.VITE_API_WS || window.location.origin) : (import.meta.env.VITE_API_WS || 'http://localhost:5000');

const socket = io(BACKEND_WS, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  path: '/socket.io' // default, ensures same path used by server
});

export default socket;





