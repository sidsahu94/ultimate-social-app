// frontend/src/components/ui/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCloud, FaStar } from 'react-icons/fa';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      className={`
        relative w-20 h-10 rounded-full flex items-center px-1 
        shadow-inner transition-colors duration-500 ease-in-out cursor-pointer overflow-hidden
        ${isDark ? 'bg-[#0f172a] border border-white/10' : 'bg-[#bae6fd] border border-white/50'}
      `}
      aria-label="Toggle Theme"
    >
      {/* --- BACKGROUND DECORATIONS --- */}
      
      {/* Light Mode Clouds */}
      <AnimatePresence>
        {!isDark && (
          <>
            <motion.div 
              initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
              className="absolute right-3 text-white/80 text-[10px]"
            >
              <FaCloud />
            </motion.div>
            <motion.div 
              initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute right-6 top-2 text-white/60 text-[8px]"
            >
              <FaCloud />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dark Mode Stars */}
      <AnimatePresence>
        {isDark && (
          <>
            <motion.div 
              initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              className="absolute left-3 text-yellow-100 text-[6px]"
            >
              <FaStar />
            </motion.div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute left-6 bottom-2 text-white/50 text-[4px]"
            >
              <FaStar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- THE KNOB (Sun / Moon) --- */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`
          relative w-8 h-8 rounded-full shadow-md z-10 flex items-center justify-center
          ${isDark 
            ? 'bg-gray-200 translate-x-10 shadow-[inset_-3px_-3px_5px_rgba(0,0,0,0.2)]' 
            : 'bg-electric-amber translate-x-0 shadow-neon-amber'
          }
        `}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            /* MOON CRATERS */
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              className="relative w-full h-full"
            >
              <div className="absolute top-2 left-2 w-2 h-2 bg-gray-400/50 rounded-full" />
              <div className="absolute bottom-2 right-3 w-1.5 h-1.5 bg-gray-400/50 rounded-full" />
              <div className="absolute top-4 right-1 w-1 h-1 bg-gray-400/50 rounded-full" />
            </motion.div>
          ) : (
            /* SUN RAYS */
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              className="relative w-full h-full"
            >
               {/* Simple glowing center is usually enough, but let's add a subtle rim */}
               <div className="absolute inset-1 rounded-full border-2 border-white/30" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}