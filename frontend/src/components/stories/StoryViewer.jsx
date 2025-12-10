import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaHeart } from 'react-icons/fa';
import { getImageUrl } from '../../utils/imageUtils'; // Critical import

export default function StoryViewer({ stories, initialIndex = 0, onClose }) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const activeStory = stories[current];

  // Auto-Advance Timer
  useEffect(() => {
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          if (current < stories.length - 1) {
            setCurrent(c => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return old + 1; // 1% per 50ms = 5 seconds total
      });
    }, 50);

    return () => clearInterval(timer);
  }, [current, stories.length, onClose]);

  if (!activeStory) return null;

  // Resolve URLs safely
  const mediaUrl = getImageUrl(activeStory.media);
  const userAvatar = getImageUrl(activeStory.user?.avatar);
  const isVideo = activeStory.type === 'video' || (activeStory.media && activeStory.media.match(/\.(mp4|webm)$/i));

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      
      {/* Mobile-style Container */}
      <div className="relative w-full h-full md:max-w-[400px] md:h-[85vh] md:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
        
        {/* Progress Bars */}
        <div className="absolute top-3 left-2 right-2 z-20 flex gap-1">
          {stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all ease-linear"
                style={{ width: idx < current ? '100%' : idx === current ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-4 z-20 flex items-center gap-2">
          <img src={userAvatar} className="w-9 h-9 rounded-full border border-white/50" alt="user" />
          <span className="text-white font-semibold text-sm drop-shadow-md">{activeStory.user?.name}</span>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-4 z-30 text-white p-2 opacity-80 hover:opacity-100">
          <FaTimes size={24} />
        </button>

        {/* Tap Navigation Zones */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={() => current > 0 && setCurrent(c => c - 1)}></div>
        <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={() => current < stories.length - 1 ? setCurrent(c => c + 1) : onClose()}></div>

        {/* Main Media */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          {isVideo ? (
            <video src={mediaUrl} autoPlay className="w-full h-full object-cover" />
          ) : (
            <img src={mediaUrl} className="w-full h-full object-cover" alt="story" />
          )}
        </div>

        {/* Caption Overlay */}
        {activeStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 text-center px-6 z-20">
            <p 
                className="inline-block px-4 py-2 rounded-xl text-white text-lg font-medium backdrop-blur-md"
                style={{ backgroundColor: activeStory.color || 'rgba(0,0,0,0.5)' }}
            >
              {activeStory.caption}
            </p>
          </div>
        )}

        {/* Footer (Like/Reply) */}
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-center gap-3">
            <input placeholder="Send message" className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2.5 text-white placeholder-white/70 outline-none focus:border-white transition" />
            <button className="text-white p-2 hover:scale-110 transition"><FaHeart size={24} /></button>
        </div>

      </div>
    </div>
  );
}