// src/components/chat/AudioSpace.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaTimes, FaUserFriends } from 'react-icons/fa';
import socket from '../../services/socket';
import UserAvatar from '../ui/UserAvatar';

export default function AudioSpace() {
  const [isOpen, setIsOpen] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [isMuted, setIsMuted] = useState(true);
  
  // Dummy logic for demo (Real implementation requires WebRTC/SFU integration)
  // This simulates the UI and Socket state for a "Room"
  
  const joinSpace = () => {
    setIsOpen(true);
    socket.emit('space:join', { roomId: 'global-lounge' });
    // Mocking adding self
    setSpeakers(prev => [...prev, { _id: 'me', name: 'You', isSpeaking: false }]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Visual feedback simulation
    setSpeakers(prev => prev.map(s => s._id === 'me' ? {...s, isSpeaking: isMuted} : s));
  };

  return (
    <>
      {/* Floating Trigger */}
      <button 
        onClick={joinSpace}
        className="fixed bottom-24 right-6 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg z-40 hover:scale-110 transition"
      >
        <FaUserFriends />
      </button>

      {/* The Space Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white rounded-t-3xl shadow-2xl z-50 p-6 min-h-[40vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-xs px-2 py-1 rounded uppercase font-bold tracking-wider">Live</span>
                <h3 className="font-bold text-lg">Late Night Lounge 🌙</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-gray-800 p-2 rounded-full"><FaTimes /></button>
            </div>

            {/* Speakers Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {speakers.map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full relative ${s.isSpeaking ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-gray-900' : ''}`}>
                    <UserAvatar className="w-full h-full" name={s.name} />
                    <div className="absolute bottom-0 right-0 bg-gray-800 rounded-full p-1 border border-gray-700">
                      {s.isSpeaking ? <FaMicrophone size={10} /> : <FaMicrophoneSlash size={10} className="text-red-400" />}
                    </div>
                  </div>
                  <span className="text-sm mt-2 font-medium">{s.name}</span>
                  <span className="text-xs text-gray-400">Speaker</span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6 mt-auto">
              <button 
                onClick={toggleMute}
                className={`p-4 rounded-full text-xl transition ${isMuted ? 'bg-gray-800 text-white' : 'bg-purple-600 text-white'}`}
              >
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
              <button className="px-6 py-2 rounded-full bg-gray-800 font-semibold text-sm">
                ✋ Request
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}