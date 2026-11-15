// frontend/src/components/profile/HighlightViewerModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaPause, 
  FaPlay, 
  FaChevronLeft, 
  FaChevronRight, 
  FaHeart,
  FaPaperPlane
} from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { playSound } from '../../utils/soundEffects';

export default function HighlightViewerModal({ highlight, onClose, user }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const timerRef = useRef(null);
  const STORY_DURATION = 5000; // 5 seconds per story slide

  const stories = highlight?.stories || [
    {
      url: highlight?.img || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
      caption: `${highlight?.title || 'Highlight'} • Memories & Vision`,
      timestamp: 'Recently added'
    }
  ];

  const currentStory = stories[currentIndex] || stories[0];

  // Story progression timer
  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const step = (interval / STORY_DURATION) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            clearInterval(timerRef.current);
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isPaused, stories.length, onClose]);

  // Reset progress when slide changes
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const handleNext = () => {
    playSound('cyber');
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((c) => c + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    playSound('cyber');
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
    }
  };

  const togglePause = () => {
    setIsPaused((p) => !p);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-4 select-none">
      {/* Background ambient glow matching ring */}
      <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-[#00F2FE]/15 blur-[140px]" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative flex flex-col justify-between h-[85vh] max-h-[750px] w-full max-w-[420px] rounded-[32px] overflow-hidden border border-white/20 bg-[#070B14] shadow-[0_25px_80px_rgba(0,0,0,0.9)]"
      >
        {/* Story Media */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentStory.url}
            alt={currentStory.caption}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/70" />
        </div>

        {/* Top Header: Progress Bars & Meta */}
        <div className="relative z-20 p-4">
          {/* Progress Bar Segments */}
          <div className="flex items-center gap-1.5 mb-3">
            {stories.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < currentIndex
                        ? '100%'
                        : idx === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* User info & controls */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <UserAvatar
                src={user?.avatar}
                name={user?.name || 'Sidhanta Sahu'}
                className="w-9 h-9 border border-white/30"
              />
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">{user?.name || 'Sidhanta Sahu'}</span>
                  <span className="text-[10px] rounded-full bg-white/10 px-2 py-0.5 text-[#00F2FE] font-mono">
                    {highlight?.title}
                  </span>
                </div>
                <span className="text-[10px] text-white/70">{currentStory.timestamp || 'Story Highlight'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePause}
                className="p-2 rounded-full bg-black/40 text-white/80 hover:text-white transition cursor-pointer"
              >
                {isPaused ? <FaPlay size={12} /> : <FaPause size={12} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-black/40 text-white/80 hover:text-white transition cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Center Tap Navigation Zones */}
        <div className="absolute inset-y-16 inset-x-0 z-10 flex">
          <div onClick={handlePrev} className="flex-1 cursor-pointer" />
          <div onClick={handleNext} className="flex-1 cursor-pointer" />
        </div>

        {/* Bottom Caption & Interactive Footer */}
        <div className="relative z-20 p-4">
          {currentStory.caption && (
            <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-3 mb-3 text-xs text-white leading-relaxed">
              {currentStory.caption}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs text-white/60">
              Send appreciation to {user?.name?.split(' ')[0] || 'Creator'}...
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLiked(!isLiked);
                playSound('cyber');
              }}
              className={`p-2.5 rounded-full border transition cursor-pointer ${
                isLiked
                  ? 'bg-[#EF4444] border-[#EF4444] text-white'
                  : 'bg-black/50 border-white/20 text-white hover:border-white/50'
              }`}
            >
              <FaHeart size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
