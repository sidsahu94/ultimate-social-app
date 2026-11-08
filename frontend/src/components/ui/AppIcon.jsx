// frontend/src/components/ui/AppIcon.jsx
import React from 'react';

export default function AppIcon({ size = 64, className = '' }) {
  return (
    <div 
      style={{ width: size, height: size }}
      className={`relative rounded-[22%] overflow-hidden shadow-2xl shadow-[#00F2FE]/25 ring-1 ring-white/20 shrink-0 ${className}`}
    >
      <img 
        src="/socialverse-logo.jpg" 
        alt="SocialVerse ∞" 
        className="w-full h-full object-cover select-none"
      />
    </div>
  );
}
