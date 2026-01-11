// frontend/src/components/chat/IncomingCall.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaTimes, FaPhone } from 'react-icons/fa';
import socket from '../../services/socket';
import { useNavigate } from 'react-router-dom';

export default function IncomingCall() {
  const [call, setCall] = useState(null); 
  const nav = useNavigate();
  const audioRef = useRef(null); // Ref for audio instance

  useEffect(() => {
    // Initialize audio object once
    audioRef.current = new Audio('/ringtone.mp3'); // Ensure this file exists in public/ folder
    audioRef.current.loop = true;

    const stopRingtone = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const onIncoming = (data) => {
      setCall(data);
      // Play sound only if user has interacted with document previously
      // (Browsers block autoplay otherwise)
      audioRef.current.play().catch(e => console.log("Ringtone blocked by browser autoplay policy"));
    };

    const onEnd = () => {
        setCall(null);
        stopRingtone();
    };

    socket.on('call:incoming', onIncoming);
    socket.on('call:ended', onEnd);
    socket.on('call:rejected', onEnd); // Handle rejection locally too

    return () => {
        socket.off('call:incoming', onIncoming);
        socket.off('call:ended', onEnd);
        socket.off('call:rejected', onEnd);
        stopRingtone(); // 🔥 CRITICAL: Stop sound on component unmount
    };
  }, []);

  const accept = () => {
    if(!call) return;
    if(audioRef.current) audioRef.current.pause();
    nav(`/chat/call/${call.roomId}`);
    setCall(null);
  };

  const reject = () => {
    if(call) socket.emit('call:rejected', { roomId: call.roomId });
    setCall(null);
    if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  };

  return (
    <AnimatePresence>
      {call && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-sm bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-gray-700 flex items-center justify-between ring-2 ring-indigo-500/50"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
                <img src={call.from?.avatar || '/default-avatar.png'} className="w-12 h-12 rounded-full border-2 border-green-500" alt="Caller" />
                <span className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full animate-ping"></span>
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">{call.from?.name || 'Unknown'}</div>
              <div className="text-xs text-indigo-300 flex items-center gap-1">
                  <FaVideo size={10} /> Incoming Video Call...
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
                onClick={reject} 
                className="w-10 h-10 flex items-center justify-center bg-red-500 rounded-full hover:bg-red-600 transition shadow-lg shadow-red-500/30 active:scale-95"
            >
              <FaTimes />
            </button>
            <button 
                onClick={accept} 
                className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-full hover:bg-green-600 transition animate-bounce shadow-lg shadow-green-500/30 active:scale-95"
            >
              <FaPhone className="rotate-90" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}