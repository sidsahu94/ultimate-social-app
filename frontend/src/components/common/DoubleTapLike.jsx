// frontend/src/components/common/DoubleTapLike.jsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart } from 'react-icons/fa';

export default function DoubleTapLike({ children, onLike }) {
  const [showHeart, setShowHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const handleTap = useCallback((e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // It's a double tap!
      e.stopPropagation(); // Prevent opening post view
      setShowHeart(true);
      onLike();
      setTimeout(() => setShowHeart(false), 800);
    }
    setLastTap(now);
  }, [lastTap, onLike]);

  return (
    <div className="relative cursor-pointer" onClick={handleTap}>
      {children}
      <AnimatePresence>
        {showHeart && (
          <motion.div 
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <FaHeart className="text-white drop-shadow-2xl filter" size={80} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}