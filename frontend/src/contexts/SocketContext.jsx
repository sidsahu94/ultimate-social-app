// frontend/src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import socket, { updateSocketAuth } from '../services/socket';
import { useToast } from '../components/ui/ToastProvider';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const user = useSelector(s => s.auth.user);
  const { add: addToast } = useToast();

  useEffect(() => {
    // 🔥 FIX: Only connect if user exists and has an ID
    if (user?._id) {
      // Update auth token before connecting
      updateSocketAuth(localStorage.getItem('token'), user._id);
      
      if (!socket.connected) {
        socket.connect();
      }
      
      // --- Listeners ---
      const onConnect = () => {
        setIsConnected(true);
        // Join personal room for notifications
        socket.emit('joinRoom', { room: user._id });
        console.log('✅ Socket connected');
      };

      const onDisconnect = (reason) => {
        setIsConnected(false);
        console.warn('❌ Socket disconnected:', reason);
        // Only reconnect automatically if it wasn't a manual disconnect or auth error
        if (reason === "io server disconnect") {
          socket.connect();
        }
      };

      // 🔥 FIX: Handle Auth Failures Gracefully
      const onConnectError = (err) => {
        console.error("Socket connection error:", err.message);
        if (err.message === "Unauthorized" || err.message.includes("token")) {
            console.log("Socket Auth failed. Stopping reconnection attempts.");
            socket.disconnect(); 
        }
      };
      
      const onUsersList = (users) => {
        setOnlineUsers(new Set(users));
      };

      const onUserOnline = (userId) => {
        setOnlineUsers(prev => new Set(prev).add(userId));
      };

      const onUserOffline = (userId) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      };

      // Global Message Toast Handler
      const handleIncomingMessage = (payload) => {
          const currentPath = window.location.pathname;
          const chatId = payload.chatId;
          
          // Only show toast if NOT in this chat and sender is not me
          if (chatId && !currentPath.includes(chatId) && payload.message.sender._id !== user._id) {
              addToast(`New message from ${payload.message.sender.name}`, { 
                  type: 'info', 
                  timeout: 3000,
                  onClick: () => window.location.href = `/chat/${chatId}` 
              });
          }
      };

      // Attach Listeners
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onConnectError); // 🔥 Added
      socket.on('users:list', onUsersList);
      socket.on('user:online', onUserOnline);
      socket.on('user:offline', onUserOffline);
      socket.on('receiveMessage', handleIncomingMessage);

      // Cleanup
      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onConnectError);
        socket.off('users:list', onUsersList);
        socket.off('user:online', onUserOnline);
        socket.off('user:offline', onUserOffline);
        socket.off('receiveMessage', handleIncomingMessage);
        
        // Disconnect on unmount or user logout
        socket.disconnect();
      };
    }
  }, [user?._id, addToast]); // Re-run only if user ID changes

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};