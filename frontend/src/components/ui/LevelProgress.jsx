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

  // Level Logic (matches backend)
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
      <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
        <span className={animate ? 'text-yellow-500 animate-bounce' : ''}>
            Lvl {user.level}
        </span>
        <span>{user.xp} / {nextLevelXP} XP</span>
      </div>
      
      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div 
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
        >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>

      {/* Level Up Popover */}
      {animate && (
        <motion.div 
            initial={{ scale: 0, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-black px-3 py-1 rounded-lg shadow-lg z-50 whitespace-nowrap flex items-center gap-1"
        >
            <FaStar className="animate-spin" /> LEVEL UP!
        </motion.div>
      )}
    </div>
  );
}