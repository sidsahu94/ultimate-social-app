import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExpand } from 'react-icons/fa';

const VideoContext = createContext();

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
  const [activeVideo, setActiveVideo] = useState(null); // { url, time }
  const [isMinimized, setIsMinimized] = useState(false);

  const playVideo = (url) => {
    setActiveVideo({ url });
    setIsMinimized(false);
  };

  const closeVideo = () => {
    setActiveVideo(null);
    setIsMinimized(false);
  };

  const minimize = () => setIsMinimized(true);

  return (
    <VideoContext.Provider value={{ playVideo, closeVideo }}>
      {children}
      
      {/* Global Player Overlay */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 100 }}
            animate={isMinimized 
              ? { scale: 1, opacity: 1, width: 200, height: 120, bottom: 80, right: 20, position: 'fixed', borderRadius: 12 }
              : { scale: 1, opacity: 1, width: '100%', height: '100%', top: 0, left: 0, position: 'fixed', borderRadius: 0 }
            }
            exit={{ opacity: 0, scale: 0.5 }}
            className="z-[70] overflow-hidden bg-black shadow-2xl"
            drag={isMinimized}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <video 
              src={activeVideo.url} 
              className="w-full h-full object-cover" 
              controls={!isMinimized} 
              autoPlay
            />
            
            {/* Controls Overlay */}
            <div className="absolute top-2 right-2 flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); isMinimized ? setIsMinimized(false) : minimize(); }} 
                className="bg-black/50 text-white p-1 rounded-full backdrop-blur-md"
              >
                <FaExpand size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); closeVideo(); }} 
                className="bg-red-500 text-white p-1 rounded-full"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </VideoContext.Provider>
  );
};