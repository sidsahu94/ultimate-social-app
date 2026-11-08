// frontend/src/components/ui/ThemeToggle.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function ThemeToggle({ className = '' }) {
  return (
    <div
      title="Aetheria Imperial Noir — Quiet Royal Black · Electric Ocean · Modern Emerald & Gold"
      className={`group relative flex h-9 items-center gap-2.5 rounded-full px-3.5 py-1 select-none bg-[#0A111E]/90 border border-[rgba(0,242,254,0.22)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_20px_rgba(0,242,254,0.15)] backdrop-blur-xl ${className}`}
    >
      {/* Tri-Theme Celestial Core */}
      <div className="relative flex h-5 w-5 items-center justify-center">
        {/* Pulsing Electric Cyan & Imperial Emerald Aura */}
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.9, 0.4], rotate: [0, 180, 360] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00F2FE] via-[#10B981] to-[#D4AF37] blur-[4px]"
        />
        {/* Kinetic Royal Obsidian & Gold Core */}
        <div className="relative h-4 w-4 rounded-full bg-gradient-to-tr from-[#00F2FE] via-[#1D4ED8] to-[#D4AF37] shadow-[0_0_12px_#00F2FE] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            className="h-1.5 w-1.5 rounded-full bg-[#F4D49A] opacity-95 shadow-[0_0_6px_#00F2FE]"
          />
        </div>
      </div>

      <span className="font-display text-[9.5px] font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-[#00F2FE] via-[#10B981] to-[#D4AF37] bg-clip-text text-transparent">
        Aetheria Noir
      </span>
    </div>
  );
}
