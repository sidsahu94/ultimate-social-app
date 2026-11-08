// src/components/chat/AudioSpace.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaTimes, FaHeadphones, FaMusic, FaUserFriends } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { useSocket } from '../../contexts/SocketContext'; // Access global socket

export default function AudioSpace() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [speakers, setSpeakers] = useState([]); // Real users list
  const { socket } = useSocket();

  // Handle Join/Leave
  useEffect(() => {
    if (!socket) return;

    if (isOpen) {
        // 1. Join Room
        socket.emit('lounge:join');

        // 2. Listen for updates
        const onUpdate = (users) => {
            setSpeakers(users);
        };
        socket.on('lounge:update', onUpdate);

        return () => {
            socket.emit('lounge:leave'); // Leave on close
            socket.off('lounge:update', onUpdate);
        };
    }
  }, [isOpen, socket]);

  // Handle Mute Toggle
  const toggleMute = () => {
      const newState = !isMuted;
      setIsMuted(newState);
      socket.emit('lounge:toggle_mute', { isMuted: newState });
  };

  return (
    <>
      {/* Floating Trigger */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:right-8 w-14 h-14 bg-gradient-to-r from-[#1D4ED8] via-[#0F766E] to-[#00F2FE] rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgba(29,78,216,0.4)] z-40 border-2 border-white/20 group"
      >
        {isOpen ? <FaMusic className="animate-spin text-[#F4D49A]" /> : <FaHeadphones className="text-xl text-[#F7F7FC] group-hover:scale-110 transition-transform" />}
        {/* Live Count Badge */}
        {speakers.length > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-[#052E24] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white/20 shadow-md">
                {speakers.length}
            </span>
        )}
      </motion.button>

      {/* The Space Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#04070D]/95 text-[#F7F7FC] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-50 p-6 min-h-[50vh] border-t border-white/10 backdrop-blur-2xl flex flex-col"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#14B8A6]"></span>
                </span>
                <div>
                    <h3 className="font-bold text-xl tracking-tight leading-none text-[#F7F7FC] font-serif">Late Night Lounge 🌙</h3>
                    <p className="text-xs text-[#CBD5E1]/70 mt-1">{speakers.length} online • {speakers.filter(s => !s.isMuted).length} speaking</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-[#0A111E] p-2.5 rounded-full hover:bg-white/10 text-[#CBD5E1] border border-white/10 transition"><FaTimes /></button>
            </div>

            {/* Visualizer Placeholder */}
            <div className="flex items-center justify-center gap-1.5 h-8 mb-6 opacity-60">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-1 bg-gradient-to-t from-[#1D4ED8] to-[#00F2FE] rounded-full animate-music-bar" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
            </div>

            {/* Grid of Real Users */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8 overflow-y-auto max-h-[40vh] custom-scrollbar p-2">
              {speakers.map((s) => (
                <div key={s._id} className="flex flex-col items-center gap-2 relative">
                  <div className={`relative p-1 rounded-full transition-all duration-300 ${!s.isMuted ? 'bg-gradient-to-tr from-[#14B8A6] to-[#00F2FE] scale-110 shadow-[0_0_15px_rgba(100,223,223,0.4)]' : 'bg-transparent'}`}>
                    <div className="w-16 h-16 rounded-full bg-[#070B14] border-2 border-white/10 overflow-hidden relative">
                        <UserAvatar src={s.avatar} name={s.name} className="w-full h-full" />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                    {/* Status Icon Overlay */}
                    <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border border-white/20 ${s.isMuted ? 'bg-[#0A111E] text-[#CBD5E1]/50' : 'bg-[#14B8A6] text-white'}`}>
                        {s.isMuted ? <FaMicrophoneSlash size={8} /> : <FaMicrophone size={8} />}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#CBD5E1] truncate max-w-[80px] text-center">
                      {s.name}
                  </span>
                </div>
              ))}
              
              {speakers.length === 0 && (
                  <div className="col-span-full text-center text-[#CBD5E1]/40 py-10">
                      <FaUserFriends className="mx-auto text-3xl mb-2 opacity-50 text-[#D4AF37]"/>
                      <p>Joining room...</p>
                  </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6 mt-auto pt-6 border-t border-white/10">
              <button 
                onClick={toggleMute}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition shadow-lg transform hover:scale-105 active:scale-95 border border-white/20 ${isMuted ? 'bg-[#0A111E] text-[#F7F7FC] hover:bg-[#250E1A]' : 'bg-gradient-to-r from-[#14B8A6] to-[#00F2FE] text-black hover:opacity-90'}`}
              >
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes music-bar { 0%, 100% { height: 20%; } 50% { height: 100%; } }
        .animate-music-bar { animation: music-bar 0.8s ease-in-out infinite; }
      `}</style>
    </>
  );
}
