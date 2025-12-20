// frontend/src/components/chat/IncomingCall.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaTimes } from 'react-icons/fa';
import socket from '../../services/socket';
import { useNavigate } from 'react-router-dom';

export default function IncomingCall() {
  const [call, setCall] = useState(null); 
  const nav = useNavigate();
  const audioRef = useRef(new Audio('/ringtone.mp3')); // Load sound

  useEffect(() => {
    // Configure audio loop
    audioRef.current.loop = true;

    const onIncoming = (data) => {
      setCall(data);
      // Play sound reliably (requires user interaction first usually, but works in active apps)
      audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
    };

    const onEnd = () => {
        setCall(null);
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    };

    socket.on('call:incoming', onIncoming);
    
    // Listen for call cancelled/ended remotely
    socket.on('call:ended', onEnd);

    return () => {
        socket.off('call:incoming', onIncoming);
        socket.off('call:ended', onEnd);
        audioRef.current.pause(); // Cleanup audio
    };
  }, []);

  const accept = () => {
    if(!call) return;
    audioRef.current.pause();
    nav(`/chat/call/${call.roomId}`);
    setCall(null);
  };

  const reject = () => {
    setCall(null);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    // Emit rejection so caller stops waiting
    socket.emit('call:rejected', { roomId: call.roomId });
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
            <button onClick={reject} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition shadow-lg shadow-red-500/30">
              <FaTimes />
            </button>
            <button onClick={accept} className="p-3 bg-green-500 rounded-full hover:bg-green-600 transition animate-bounce shadow-lg shadow-green-500/30">
              <FaVideo />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}