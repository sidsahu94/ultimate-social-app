// src/components/chat/AudioSpace.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaTimes, FaHeadphones, FaMusic, FaUserFriends } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { useSocket } from '../../contexts/SocketContext'; // Access global socket

export default function AudioSpace() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [speakers, setSpeakers] = useState([]); // 🔥 Real users list
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
        className="fixed bottom-24 right-4 md:right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl z-40 border-4 border-white dark:border-gray-900 group"
      >
        {isOpen ? <FaMusic className="animate-spin" /> : <FaHeadphones className="text-xl group-hover:animate-bounce" />}
        {/* Live Count Badge */}
        {speakers.length > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-gray-900">
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
            className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white rounded-t-[2rem] shadow-2xl z-50 p-6 min-h-[50vh] border-t border-gray-700/50 backdrop-blur-xl flex flex-col"
          >
            <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6 opacity-50" />
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <div>
                    <h3 className="font-bold text-xl tracking-tight leading-none">Late Night Lounge 🌙</h3>
                    <p className="text-xs text-gray-400 mt-1">{speakers.length} online • {speakers.filter(s => !s.isMuted).length} speaking</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition"><FaTimes /></button>
            </div>

            {/* Visualizer Placeholder */}
            <div className="flex items-center justify-center gap-1 h-8 mb-6 opacity-30">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-1 bg-purple-500 rounded-full animate-music-bar" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
            </div>

            {/* Grid of Real Users */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8 overflow-y-auto max-h-[40vh] custom-scrollbar p-2">
              {speakers.map((s) => (
                <div key={s._id} className="flex flex-col items-center gap-2 relative">
                  <div className={`relative p-1 rounded-full transition-all duration-300 ${!s.isMuted ? 'bg-gradient-to-tr from-green-400 to-emerald-600 scale-110' : 'bg-transparent'}`}>
                    <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-800 overflow-hidden relative">
                        <UserAvatar src={s.avatar} name={s.name} className="w-full h-full" />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                    {/* Status Icon Overlay */}
                    <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-gray-900 ${s.isMuted ? 'bg-gray-700 text-gray-400' : 'bg-green-500 text-white'}`}>
                        {s.isMuted ? <FaMicrophoneSlash size={8} /> : <FaMicrophone size={8} />}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-300 truncate max-w-[80px] text-center">
                      {s.name}
                  </span>
                </div>
              ))}
              
              {speakers.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-10">
                      <FaUserFriends className="mx-auto text-3xl mb-2 opacity-50"/>
                      <p>Joining room...</p>
                  </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6 mt-auto pt-6 border-t border-gray-800/50">
              <button 
                onClick={toggleMute}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition shadow-lg transform hover:scale-105 active:scale-95 ${isMuted ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-black hover:bg-gray-200'}`}
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