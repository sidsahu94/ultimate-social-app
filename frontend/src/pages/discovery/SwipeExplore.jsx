import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import API from '../../services/api';
import { FaTimes, FaHeart, FaBolt } from 'react-icons/fa';
import UserAvatar from '../../components/ui/UserAvatar';
import { useToast } from '../../components/ui/ToastProvider';

export default function SwipeExplore() {
  const [profiles, setProfiles] = useState([]);
  const { add } = useToast();

  useEffect(() => {
    // Reuse the suggestions API to get users
    API.get('/follow-suggest/suggest').then(res => setProfiles(res.data));
  }, []);

  const handleSwipe = (direction, user) => {
    // Remove card from stack
    setProfiles(prev => prev.filter(p => p._id !== user._id));
    
    if (direction === 'right') {
      API.post(`/users/${user._id}/follow`); // Follow logic
      add(`Followed ${user.name}!`, { type: 'success' });
    }
  };

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center relative overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaBolt className="text-yellow-500" /> Discover People
      </h2>

      <div className="relative w-full max-w-sm h-[500px]">
        <AnimatePresence>
          {profiles.map((profile, index) => (
            <Card 
              key={profile._id} 
              profile={profile} 
              onSwipe={handleSwipe} 
              isTop={index === profiles.length - 1} // Only top card is interactive
            />
          ))}
        </AnimatePresence>
        
        {profiles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-2">🎉</div>
            <p>You've seen everyone!</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-indigo-500 font-bold">Refresh</button>
          </div>
        )}
      </div>
    </div>
  );
}

const Card = ({ profile, onSwipe, isTop }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (e, info) => {
    if (info.offset.x > 100) onSwipe('right', profile);
    else if (info.offset.x < -100) onSwipe('left', profile);
  };

  if (!isTop) return null; // Simple stack optimization

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing border dark:border-gray-700"
    >
      <div className="h-3/4 relative bg-gray-200">
        <img src={profile.avatar || '/default-avatar.png'} className="w-full h-full object-cover pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
          <h3 className="text-white text-3xl font-bold">{profile.name}</h3>
          <p className="text-white/80 line-clamp-2">{profile.bio || "No bio yet."}</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="h-1/4 flex items-center justify-center gap-8">
        <button onClick={() => onSwipe('left', profile)} className="p-4 rounded-full bg-gray-100 text-red-500 shadow-lg hover:scale-110 transition"><FaTimes size={24}/></button>
        <button onClick={() => onSwipe('right', profile)} className="p-4 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-lg hover:scale-110 transition"><FaHeart size={28}/></button>
      </div>
    </motion.div>
  );
};