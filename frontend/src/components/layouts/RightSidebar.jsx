//frontend/src/components/layouts/RightSidebar.jsx
import React from 'react';
import FollowSuggestions from '../../pages/discovery/FollowSuggestions';
import Trending from '../../pages/explore/Trending';
import ThemeToggle from '../ui/ThemeToggle';

export default function RightSidebar() {
  return (
    // Removed "fixed", "right-4", "bottom-4". Now it just fills its grid cell.
    <aside className="flex flex-col gap-6 w-full max-w-[320px]">
      
      {/* Theme Toggle Card */}
      <div className="card p-4 flex items-center justify-between bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm">
        <span className="font-semibold text-sm">Appearance</span>
        <ThemeToggle />
      </div>

      {/* Trending */}
      <div className="card p-5 bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-sm">
        <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Trending Now
        </h3>
        <Trending />
      </div>

      {/* Suggested People */}
      <div className="card p-5 bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">
          Who to follow
        </h3>
        <FollowSuggestions />
      </div>

      {/* Footer */}
      <div className="text-xs text-center text-slate-400">
        © 2025 SocialApp • Privacy • Terms
      </div>
    </aside>
  );
}