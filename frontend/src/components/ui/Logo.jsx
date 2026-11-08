// frontend/src/components/ui/Logo.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeProvider';

export default function Logo({ size = 42, showText = true, className = "", subtitle = "Beyond Social" }) {
  const { currentTheme } = useTheme();

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3D Glassmorphic Ribbon S & Infinity Emblem */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
        transition={{ duration: 0.4 }}
        className="relative shrink-0 cursor-pointer"
        style={{ width: size, height: size }}
      >
        {/* Specular Ambient Glow */}
        <div
          className="absolute -inset-1 rounded-2xl blur-md opacity-70 transition-opacity duration-300"
          style={{ background: currentTheme.glow || 'rgba(0, 242, 254, 0.4)' }}
        />

        {/* 3D Brand Emblem Container */}
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden p-[1.5px] shadow-2xl transition-all"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent}, #F4D49A)`,
            boxShadow: `0 0 20px ${currentTheme.glow}`,
          }}
        >
          <div className="w-full h-full rounded-[14px] bg-[#070B14] overflow-hidden flex items-center justify-center relative">
            <img
              src="/socialverse-logo.jpg"
              alt="SocialVerse Logo"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              onError={(e) => {
                // Fallback to inline vector if file fails to load
                e.target.style.display = 'none';
              }}
            />

            {/* Specular Glint Star Overlay */}
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#FFF] pointer-events-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Polished Typography Matching Reference Image */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="font-display font-black text-xl tracking-tight text-white drop-shadow-md">
              Social<span style={{ color: currentTheme.accent }}>Verse</span>
            </span>
            <motion.span
              animate={{ scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-xl font-black drop-shadow-[0_0_12px_rgba(244,212,154,0.6)]"
              style={{ color: currentTheme.accent }}
            >
              ∞
            </motion.span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#CBD5E1]/75">
              {subtitle}
            </span>
            {/* Glowing Lens Flare Separator */}
            <div
              className="h-[1.5px] w-8 rounded-full opacity-80"
              style={{
                background: `linear-gradient(90deg, ${currentTheme.accent}, transparent)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
