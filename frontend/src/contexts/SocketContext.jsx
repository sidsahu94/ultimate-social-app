import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import socket, { updateSocketAuth } from '../services/socket';
import { useToast } from '../components/ui/ToastProvider'; // 🔥 Import Toast

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const user = useSelector(s => s.auth.user);
  const { add: addToast } = useToast(); // 🔥 Get toast function

  useEffect(() => {
    if (user?._id) {
      // 1. Connect
      updateSocketAuth(localStorage.getItem('token'), user._id);
      socket.connect();
      
      // 2. Listeners
      const onConnect = () => {
        setIsConnected(true);
        // Re-join personal room on reconnect
        socket.emit('joinRoom', { room: user._id });
        console.log('✅ Socket connected/reconnected');
      };

      const onDisconnect = (reason) => {
        setIsConnected(false);
        console.warn('❌ Socket disconnected:', reason);
        if (reason === "io server disconnect") {
          socket.connect();
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

      // 🔥 FIX: Context-Aware Message Toast
      const handleIncomingMessage = (payload) => {
          const currentPath = window.location.pathname;
          const chatId = payload.chatId; // Ensure backend sends this
          
          // Only toast if NOT in this chat and sender is not me
          if (chatId && !currentPath.includes(chatId) && payload.message.sender._id !== user._id) {
              addToast(`New message from ${payload.message.sender.name}`, { 
                  type: 'info', 
                  timeout: 3000,
                  // Optional: Click toast to go to chat (requires window location hack or better toast component)
                  onClick: () => window.location.href = `/chat/${chatId}` 
              });
          }
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('users:list', onUsersList);
      socket.on('user:online', onUserOnline);
      socket.on('user:offline', onUserOffline);
      socket.on('receiveMessage', handleIncomingMessage); // 🔥 Attach listener

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('users:list', onUsersList);
        socket.off('user:online', onUserOnline);
        socket.off('user:offline', onUserOffline);
        socket.off('receiveMessage', handleIncomingMessage); // Cleanup
        socket.disconnect();
      };
    }
  }, [user?._id, addToast]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};