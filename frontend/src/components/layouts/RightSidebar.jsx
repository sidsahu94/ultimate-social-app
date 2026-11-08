// frontend/src/components/layouts/RightSidebar.jsx
import React from 'react';
import FollowSuggestions from '../../pages/discovery/FollowSuggestions';
import Trending from '../../pages/explore/Trending';
import ThemeToggle from '../ui/ThemeToggle';

export default function RightSidebar() {
  return (
    <aside className="flex flex-col gap-5 w-full max-w-[320px]">
      
      {/* Theme Toggle Card */}
      <div className="card p-4 flex items-center justify-between bg-[#070B14]/85 backdrop-blur-xl border border-[rgba(0,242,254,0.16)] rounded-[20px] shadow-silverGlass">
        <span className="font-semibold text-sm text-[#F8FAFC]">Theme Core</span>
        <ThemeToggle />
      </div>

      {/* Trending */}
      <div className="card p-5 bg-[#070B14]/85 backdrop-blur-xl border border-[rgba(0,242,254,0.16)] rounded-[24px] shadow-silverGlass">
        <h3 className="font-display font-bold text-base mb-4 text-[#F8FAFC] flex items-center justify-between">
          <span>Trending Now</span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#10B981]">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
            Live
          </span>
        </h3>
        <Trending />
      </div>

      {/* Suggested People */}
      <FollowSuggestions />

      {/* Footer */}
      <div className="text-[11px] text-center text-[#CBD5E1]/60 space-y-1">
        <p className="font-medium tracking-wide">Socialo &bull; Aetheria Noir &bull; Ocean, Emerald &amp; Gold</p>
        <p className="opacity-70">&copy; {new Date().getFullYear()} Socialo Inc. All rights reserved.</p>
      </div>
    </aside>
  );
}
