// frontend/src/components/ui/AppIcon.jsx
import React from 'react';

export default function AppIcon({ size = 64 }) {
  return (
    <div 
      style={{ width: size, height: size }}
      className="relative rounded-[25%] bg-[#1A1B1E] flex items-center justify-center overflow-hidden shadow-[10px_10px_20px_#0b0c0d,-10px_-10px_20px_#292a2f]"
    >
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-secondary/80 to-transparent opacity-80" />
      
      {/* Glass Surface */}
      <div className="absolute inset-[10%] rounded-[20%] bg-white/10 backdrop-blur-md border border-white/30 shadow-[inset_0_0_15px_rgba(255,255,255,0.2)]" />

      {/* Neon Glow Element (The S Symbol) */}
      <svg 
        viewBox="0 0 24 24" 
        className="w-[50%] h-[50%] relative z-10 text-white drop-shadow-[0_0_10px_#00E5FF]"
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>

      {/* Glossy Reflection */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-white/40 to-transparent rounded-tr-[25%] pointer-events-none" />
    </div>
  );
}