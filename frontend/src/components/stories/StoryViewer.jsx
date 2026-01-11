// frontend/src/components/stories/StoryViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPause, FaTrash } from 'react-icons/fa';
import { getImageUrl } from '../../utils/imageUtils';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { useSelector } from 'react-redux';

export default function StoryViewer({ stories, initialIndex = 0, onClose }) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  
  const videoRef = useRef(null);
  const { add } = useToast();
  const myId = useSelector(s => s.auth.user?._id);

  const activeStory = stories[current];
  const IMAGE_DURATION = 5000; // 5 seconds for images

  // Reset progress when slide changes
  useEffect(() => {
    setProgress(0);
    setPaused(false);
  }, [current]);

  useEffect(() => {
    if (!activeStory || paused) return;

    // Check if current story is a video
    const isVideo = activeStory.type === 'video' || (activeStory.media && activeStory.media.match(/\.(mp4|webm)$/i));

    if (isVideo) {
      if(videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
      }
      return; 
    } 
    
    // Image Timer Logic
    let animationFrame;
    let startTime;

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      if (paused) {
          startTime = timestamp - (progress / 100) * IMAGE_DURATION; // Adjust start time if paused
          return requestAnimationFrame(tick);
      }

      const elapsed = timestamp - startTime;
      const pct = Math.min((elapsed / IMAGE_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed < IMAGE_DURATION) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        next(); // Time up
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [current, paused, activeStory, progress]);

  const next = () => {
    if (current < stories.length - 1) {
      setCurrent(c => c + 1);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
    }
  };

  const handleDelete = async (e) => {
      e.stopPropagation();
      setPaused(true); // Pause while confirming
      
      if(!confirm("Delete this story permanently?")) {
          setPaused(false);
          return;
      }
      
      try {
          await API.delete(`/stories/${activeStory._id}`);
          add("Story deleted", { type: "success" });
          
          // If it was the only story, close viewer
          if (stories.length === 1) {
              onClose();
              window.location.reload(); 
          } else if (current === stories.length - 1) {
              // If it was the last story, close
              onClose();
          } else {
              // Otherwise go next (and remove from local list ideally, but reload covers it)
              window.location.reload();
          }
      } catch(err) {
          add("Failed to delete", { type: "error" });
          setPaused(false);
      }
  };

  const handleVideoUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
        const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(pct);
    }
  };

  const handleVideoEnded = () => {
    next();
  };

  if (!activeStory) return null;

  const mediaUrl = getImageUrl(activeStory.media, 'story');
  const userAvatar = getImageUrl(activeStory.user?.avatar, 'avatar');
  const isVideo = activeStory.type === 'video' || (activeStory.media && activeStory.media.match(/\.(mp4|webm)$/i));
  const isMine = activeStory.user?._id === myId;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-full h-full md:max-w-[400px] md:h-[85vh] md:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
        
        {/* Progress Bars */}
        <div className="absolute top-3 left-2 right-2 z-20 flex gap-1 pointer-events-none">
          {stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all ease-linear duration-75"
                style={{ 
                    width: idx < current ? '100%' : idx === current ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-4 z-20 flex items-center gap-2 pointer-events-none">
          <img src={userAvatar} className="w-9 h-9 rounded-full border border-white/50" alt="user" />
          <span className="text-white font-semibold text-sm drop-shadow-md">{activeStory.user?.name}</span>
          <span className="text-white/70 text-xs ml-2">{new Date(activeStory.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-6 right-4 z-30 flex gap-4">
            {/* 🔥 Delete Button (Owner Only) */}
            {isMine && (
                <button 
                    onClick={handleDelete} 
                    className="text-white p-2 opacity-80 hover:opacity-100 bg-black/20 rounded-full backdrop-blur-sm hover:bg-red-500/50 transition"
                    title="Delete Story"
                >
                    <FaTrash size={16} />
                </button>
            )}
            
            <button onClick={onClose} className="text-white p-2 opacity-80 hover:opacity-100 bg-black/20 rounded-full backdrop-blur-sm">
                <FaTimes size={20} />
            </button>
        </div>

        {/* Tap Zones */}
        <div 
            className="absolute inset-y-0 left-0 w-1/3 z-10" 
            onClick={prev}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        ></div>
        <div 
            className="absolute inset-y-0 right-0 w-1/3 z-10" 
            onClick={next}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        ></div>
        
        {/* Center Zone (Pause Toggle) */}
        <div 
            className="absolute inset-y-0 left-1/3 w-1/3 z-10 flex items-center justify-center"
            onClick={() => {
                setPaused(!paused);
                if(videoRef.current) {
                    paused ? videoRef.current.play() : videoRef.current.pause();
                }
            }}
        >
            {paused && <FaPause className="text-white/50 text-4xl animate-pulse" />}
        </div>

        {/* Media Display */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          {isVideo ? (
            <video 
                ref={videoRef} 
                src={mediaUrl} 
                autoPlay 
                playsInline 
                onTimeUpdate={handleVideoUpdate}
                onEnded={handleVideoEnded}
                className="w-full h-full object-cover" 
            />
          ) : (
            <img src={mediaUrl} className="w-full h-full object-cover" alt="story" />
          )}
        </div>

        {/* Caption Overlay */}
        {activeStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 text-center px-6 z-20 pointer-events-none">
            <p className="inline-block px-4 py-2 rounded-xl text-white text-lg font-medium backdrop-blur-md"
               style={{ backgroundColor: activeStory.color ? activeStory.color + '80' : 'rgba(0,0,0,0.5)' }}>
              {activeStory.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}