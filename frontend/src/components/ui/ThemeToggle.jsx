// frontend/src/components/ui/ThemeToggle.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeProvider';

export default function ThemeToggle({ className = '' }) {
  const { currentTheme, selectTheme, themes } = useTheme();

  const handleNextTheme = () => {
    const currentIndex = themes.findIndex((t) => t.id === currentTheme.id);
    const nextIndex = (currentIndex + 1) % themes.length;
    selectTheme(themes[nextIndex].id);
  };

  return (
    <button
      type="button"
      onClick={handleNextTheme}
      title={`Active Theme: ${currentTheme.name} (Click to cycle themes)`}
      className={`group relative flex h-9 items-center gap-2.5 rounded-full px-3.5 py-1 select-none border shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${className}`}
      style={{
        backgroundColor: currentTheme.bgSurface || 'rgba(10, 17, 30, 0.85)',
        borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.2)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 20px ${currentTheme.glow}`,
      }}
    >
      {/* Dynamic Celestial Core */}
      <div className="relative flex h-5 w-5 items-center justify-center">
        {/* Pulsing Theme Aura */}
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.9, 0.4], rotate: [0, 180, 360] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full blur-[4px]"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
          }}
        />
        {/* Kinetic Orb */}
        <div
          className="relative h-4 w-4 rounded-full flex items-center justify-center shadow-md"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            className="h-1.5 w-1.5 rounded-full bg-white opacity-95 shadow-[0_0_6px_#fff]"
          />
        </div>
      </div>

      <span className="font-display text-[9.5px] font-bold tracking-[0.2em] uppercase text-white">
        {currentTheme.name}
      </span>
    </button>
  );
}
