import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import socket, { updateSocketAuth } from '../services/socket';
import { useToast } from '../components/ui/ToastProvider';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const user = useSelector((s) => s.auth.user);
  const { add: addToast } = useToast();

  useEffect(() => {
    if (!user?._id) return undefined;

    updateSocketAuth(localStorage.getItem('token'), user._id);

    if (!socket.connected) socket.connect();

    const onConnect = () => {
      setIsConnected(true);
      socket.emit('joinRoom', { room: user._id });
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') socket.connect();
    };

    const onConnectError = (err) => {
      console.error('Socket connection error:', err.message);
      if (err.message === 'Unauthorized' || err.message.toLowerCase().includes('token')) {
        socket.disconnect();
      }
    };

    const onUsersList = (users) => setOnlineUsers(new Set(users));
    const onUserOnline = (userId) => setOnlineUsers((prev) => new Set(prev).add(userId));
    const onUserOffline = (userId) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleIncomingMessage = (payload) => {
      const currentPath = window.location.pathname;
      const chatId = payload?.chatId;
      if (chatId && !currentPath.includes(chatId) && payload?.message?.sender?._id !== user._id) {
        addToast(`New message from ${payload.message.sender.name}`, {
          type: 'info',
          timeout: 3000,
          onClick: () => (window.location.href = `/chat/${chatId}`),
        });
      }
    };

    const onNotif = (payload) => {
      if (payload?.type === 'message') return;
      if (payload?.message) addToast(payload.message, { type: 'info', timeout: 3500 });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('users:list', onUsersList);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);
    socket.on('receiveMessage', handleIncomingMessage);
    socket.on('notification', onNotif);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('users:list', onUsersList);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
      socket.off('receiveMessage', handleIncomingMessage);
      socket.off('notification', onNotif);
      socket.disconnect();
    };
  }, [user?._id, addToast]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};