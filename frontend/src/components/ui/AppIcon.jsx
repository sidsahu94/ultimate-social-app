// frontend/src/components/ui/AppIcon.jsx
import React from 'react';

export default function AppIcon({ size = 64, className = '' }) {
  return (
    <div 
      style={{ width: size, height: size }}
      className={`relative rounded-[22%] overflow-hidden shadow-xl shadow-teal-500/20 ring-1 ring-white/15 shrink-0 ${className}`}
    >
      <img 
        src="/socialo-logo.jpg" 
        alt="Socialo" 
        className="w-full h-full object-cover select-none"
      />
    </div>
  );
}