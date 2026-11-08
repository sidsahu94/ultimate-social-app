// frontend/src/components/ui/LevelProgress.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';
import { useSocket } from '../../contexts/SocketContext';
import { useDispatch, useSelector } from 'react-redux';
import { updateAuthUser } from '../../redux/slices/authSlice';
import confetti from 'canvas-confetti';

export default function LevelProgress() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const [animate, setAnimate] = useState(false);

  const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 5000];
  const nextLevelXP = XP_THRESHOLDS[user?.level || 1] || ((user?.level || 1) * 500);
  const prevLevelXP = XP_THRESHOLDS[(user?.level || 1) - 1] || 0;
  
  const progress = Math.min(100, Math.max(0, ((user?.xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

  useEffect(() => {
    if (!socket) return;

    const onXP = (data) => {
        dispatch(updateAuthUser({ xp: data.xp, level: data.level }));
        if (data.leveledUp) {
            setAnimate(true);
            confetti({ particleCount: 150, spread: 60 });
            setTimeout(() => setAnimate(false), 5000);
        }
    };

    socket.on('xp:update', onXP);
    return () => socket.off('xp:update', onXP);
  }, [socket, dispatch]);

  if (!user) return null;

  return (
    <div className="relative w-full max-w-[200px]">
      <div className="flex justify-between text-[10px] font-bold text-[#CBD5E1]/70 mb-1.5 uppercase tracking-wider">
        <span className={animate ? 'text-[#F4D49A] animate-bounce' : 'text-[#D4AF37]'}>
            Lvl {user.level}
        </span>
        <span className="text-[#CBD5E1]/50">{user.xp} / {nextLevelXP} XP</span>
      </div>
      
      <div className="h-2 w-full bg-[#0A111E] border border-white/5 rounded-full overflow-hidden">
        <motion.div 
            className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F4D49A] to-[#00F2FE] relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
        >
            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>

      {/* Level Up Popover */}
      {animate && (
        <motion.div 
            initial={{ scale: 0, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#F4D49A] text-black text-xs font-black px-3 py-1 rounded-xl shadow-lg shadow-yellow-900/40 z-50 whitespace-nowrap flex items-center gap-1 border border-white/20"
        >
            <FaStar className="animate-spin" /> LEVEL UP!
        </motion.div>
      )}
    </div>
  );
}
