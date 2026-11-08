import React from 'react';
import { motion } from 'framer-motion';

export default function Logo({ size = 40, showText = true, className = "" }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* High-Tech Animated Vector Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]"
      >
        <defs>
          {/* Cyberpunk Tech Gradients */}
          <linearGradient id="cyberCore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" /> {/* Indigo */}
            <stop offset="50%" stopColor="#D946EF" /> {/* Fuchsia */}
            <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan */}
          </linearGradient>
          <linearGradient id="shieldFrame" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.3" />
          </linearGradient>
          {/* Futuristic High-Glow Filter */}
          <filter id="ultraGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Tech Shell Ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          stroke="url(#cyberCore)"
          strokeWidth="1.5"
          strokeDasharray="20 10 5 10"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        />

        {/* Dynamic Hexagon Guard Lattice */}
        <motion.path
          d="M50 12 L82 30 L82 70 L50 88 L18 70 L18 30 Z"
          fill="url(#shieldFrame)"
          stroke="url(#cyberCore)"
          strokeWidth="2"
          initial={{ strokeDasharray: "100 300" }}
          animate={{ strokeDasharray: "300 100" }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 4, ease: "easeInOut" }}
        />

        {/* Floating Quantum Inner Core Nodes */}
        <motion.circle
          cx="50"
          cy="50"
          r="12"
          fill="url(#cyberCore)"
          filter="url(#ultraGlow)"
          animate={{
            scale: [0.9, 1.15, 0.9],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        />

        {/* Intersecting Data Conduits */}
        <line x1="50" y1="12" x2="50" y2="88" stroke="url(#cyberCore)" strokeWidth="0.75" strokeOpacity="0.4" strokeDasharray="4 4" />
        <line x1="18" y1="50" x2="82" y2="50" stroke="url(#cyberCore)" strokeWidth="0.75" strokeOpacity="0.4" strokeDasharray="4 4" />
      </svg>

      {/* Futuristic Typography Branding */}
      {showText && (
        <div className="flex flex-col tracking-tight">
          <span className="text-lg font-black tracking-[0.15em] bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300 font-sans uppercase">
            NEXUS
          </span>
          <span className="text-[9px] font-bold tracking-[0.4em] text-cyan-400 uppercase -mt-1 font-mono">
            PRIME // AI
          </span>
        </div>
      )}
    </div>
  );
}