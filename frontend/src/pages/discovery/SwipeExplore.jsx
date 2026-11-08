// frontend/src/pages/discovery/SwipeExplore.jsx
import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import API from '../../services/api';
import { FaTimes, FaHeart, FaBolt, FaSync } from 'react-icons/fa';
import UserAvatar from '../../components/ui/UserAvatar';
import { useToast } from '../../components/ui/ToastProvider';
import { getImageUrl } from '../../utils/imageUtils';
import { playSound } from '../../utils/soundEffects';

const DEFAULT_CREATORS = [
  { _id: 'creator_1', name: 'Elena Rostova', username: 'elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600', bio: 'Digital Art Director • Neo-Tokyo Aesthetic', followers: [1,2,3] },
  { _id: 'creator_2', name: 'Marcus Thorne', username: 'marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', bio: 'Modular Synthesizer Architect • London Soundscapes', followers: [1,2] },
  { _id: 'creator_3', name: 'Aria Chen', username: 'aria', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600', bio: 'Cinematic Fashion & Visual Storyteller', followers: [1,2,3,4] },
  { _id: 'creator_4', name: 'Dr. Alistair Vance', username: 'alistair', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600', bio: 'DeFi Research Fellow • Cryptographic Systems', followers: [1] }
];

export default function SwipeExplore() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { add } = useToast();

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const res = await API.get('/follow-suggest/suggest');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProfiles(list && list.length > 0 ? list : DEFAULT_CREATORS);
    } catch (_) {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSwipe = (direction, user) => {
    setProfiles(prev => prev.filter(p => p._id !== user._id));
    
    if (direction === 'right') {
      playSound('pop');
      API.post(`/users/${user._id}/follow`);
      add(`Following ${user.name}!`, { type: 'success' });
    } else {
      playSound('cyber');
    }
  };

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center relative overflow-hidden select-none px-4">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-1">
          <FaBolt /> Rapid Discovery
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-[#F7F7FC] font-display">
          Swipe Creators<span className="text-[#00F2FE]">.</span>
        </h2>
      </div>

      <div className="relative w-full max-w-sm h-[500px]">
        <AnimatePresence>
          {profiles.map((profile, index) => (
            <Card 
              key={profile._id} 
              profile={profile} 
              onSwipe={handleSwipe} 
              isTop={index === profiles.length - 1}
            />
          ))}
        </AnimatePresence>
        
        {profiles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#A5A9BB] bg-[#070B14]/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <div className="text-5xl mb-3">✨</div>
            <p className="font-semibold text-sm text-[#F7F7FC]">You've reached the end of the orbit!</p>
            <p className="text-xs text-[#CBD5E1] mt-1 text-center">Check back soon for new creator suggestions.</p>
            <button 
              onClick={loadProfiles} 
              className="mt-6 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white text-xs font-bold shadow-md hover:opacity-95 transition flex items-center gap-2 cursor-pointer"
            >
              <FaSync size={11} className={loading ? 'animate-spin' : ''} /> Refresh Deck
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const Card = ({ profile, onSwipe, isTop }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (e, info) => {
    if (info.offset.x > 100) onSwipe('right', profile);
    else if (info.offset.x < -100) onSwipe('left', profile);
  };

  if (!isTop) return null;

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 bg-[#070B14] rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/15 backdrop-blur-xl"
    >
      <div className="h-3/4 relative bg-black/40">
        <img src={getImageUrl(profile.avatar)} className="w-full h-full object-cover pointer-events-none" alt={profile.name} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#04070D]/95 via-[#04070D]/60 to-transparent p-6 pt-24">
          <h3 className="text-[#F7F7FC] text-2xl font-bold font-display">{profile.name}</h3>
          <p className="text-[#CBD5E1] text-xs line-clamp-2 mt-1 leading-relaxed">{profile.bio || "Creator & storyteller on Socialo."}</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="h-1/4 flex items-center justify-center gap-8 bg-[#070B14]">
        <button 
          onClick={() => onSwipe('left', profile)} 
          className="p-4 rounded-full bg-[#0A111E] border border-white/10 text-[#F87171] shadow-lg hover:scale-110 active:scale-95 transition cursor-pointer"
        >
          <FaTimes size={20} />
        </button>
        <button 
          onClick={() => onSwipe('right', profile)} 
          className="p-4 rounded-full bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white shadow-[0_0_20px_rgba(29,78,216,0.4)] hover:scale-110 active:scale-95 transition cursor-pointer"
        >
          <FaHeart size={20} />
        </button>
      </div>
    </motion.div>
  );
};
