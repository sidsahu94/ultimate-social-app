import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhone, FaVideo, FaTimes } from 'react-icons/fa';
import socket from '../../services/socket';
import { useNavigate } from 'react-router-dom';

export default function IncomingCall() {
  const [call, setCall] = useState(null); // { roomId, fromUser }
  const nav = useNavigate();

  useEffect(() => {
    const onIncoming = (data) => {
      // data: { roomId, from: { name, avatar... } }
      setCall(data);
    };
    // Backend needs to emit 'call:incoming'
    socket.on('call:incoming', onIncoming);
    return () => socket.off('call:incoming', onIncoming);
  }, []);

  const accept = () => {
    if(!call) return;
    nav(`/chat/call/${call.roomId}`);
    setCall(null);
  };

  const reject = () => {
    setCall(null);
    // optionally emit 'call:rejected'
  };

  return (
    <AnimatePresence>
      {call && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-gray-700 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <img src={call.from?.avatar || '/default-avatar.png'} className="w-12 h-12 rounded-full border-2 border-green-500 animate-pulse" />
            <div>
              <div className="font-bold text-lg">{call.from?.name || 'Unknown'}</div>
              <div className="text-xs text-gray-400">Incoming Video Call...</div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={reject} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition">
              <FaTimes />
            </button>
            <button onClick={accept} className="p-3 bg-green-500 rounded-full hover:bg-green-600 transition animate-bounce">
              <FaVideo />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}