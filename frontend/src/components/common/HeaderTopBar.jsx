// frontend/src/components/common/HeaderTopBar.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  IoSearch, 
  IoSparkles, 
  IoAdd, 
  IoVideocamOutline, 
  IoNotificationsOutline 
} from 'react-icons/io5';
import UserAvatar from '../ui/UserAvatar';
import { useTheme } from '../../contexts/ThemeProvider';

export default function HeaderTopBar({ onOpenCreate, onOpenAiStudio }) {
  const { user } = useSelector((s) => s.auth);
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('openCommandPalette'));
  };

  const handleCreate = () => {
    if (onOpenCreate) {
      onOpenCreate();
    } else {
      window.dispatchEvent(new CustomEvent('openCreatePost'));
    }
  };

  const handleAiToggle = () => {
    if (onOpenAiStudio) {
      onOpenAiStudio();
    } else {
      window.dispatchEvent(new CustomEvent('openCreatePost', { detail: { openAiStudio: true } }));
    }
  };

  return (
    <header className="sticky top-0 z-30 mb-6 hidden md:flex items-center justify-between gap-4 py-3 px-1 backdrop-blur-xl bg-transparent">
      {/* Central Glass Search Pill */}
      <div
        onClick={handleOpenSearch}
        className="relative flex-1 max-w-xl flex items-center justify-between rounded-full border border-[rgba(255,255,255,0.14)] bg-[#070B14]/85 px-4 py-2.5 text-xs text-[#CBD5E1]/75 shadow-lg backdrop-blur-2xl transition-all duration-300 hover:border-[rgba(255,255,255,0.28)] hover:text-white cursor-pointer group"
        style={{
          boxShadow: `0 8px 25px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <IoSearch size={16} className="text-[#38BDF8] group-hover:scale-110 transition-transform" />
          <span className="font-medium">Search for people, posts, groups, AI, and more...</span>
        </div>

        <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-[#CBD5E1]/70">
          Ctrl + K
        </kbd>
      </div>

      {/* Right Action Icons Group */}
      <div className="flex items-center gap-3">
        {/* Sparkles AI Button */}
        <button
          type="button"
          onClick={handleAiToggle}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-[#070B14]/85 text-white shadow-md backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Social AI Assistant"
          style={{
            borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.15)',
            boxShadow: `0 4px 15px rgba(0, 0, 0, 0.4), 0 0 15px ${currentTheme.glow}`,
          }}
        >
          <IoSparkles className="text-base text-[#F4D49A] animate-pulse" />
        </button>

        {/* Create Post Button */}
        <button
          type="button"
          onClick={handleCreate}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-[#070B14]/85 text-white shadow-md backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Create New Post / Reel"
          style={{
            borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.15)',
          }}
        >
          <IoAdd className="text-xl text-white" />
        </button>

        {/* Reels Shortcut */}
        <Link
          to="/reels"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-[#070B14]/85 text-white shadow-md backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Watch Reels"
          style={{
            borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.15)',
          }}
        >
          <IoVideocamOutline className="text-xl text-white" />
        </Link>

        {/* Notifications with Badge */}
        <Link
          to="/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-[#070B14]/85 text-white shadow-md backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Notifications"
          style={{
            borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.15)',
          }}
        >
          <IoNotificationsOutline className="text-xl text-white" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-black text-white shadow-[0_0_8px_#EF4444]">
            6
          </span>
        </Link>

        {/* User Avatar with Ring */}
        {user && (
          <Link
            to={`/profile/${user._id}`}
            className="flex items-center rounded-full p-[2px] transition-transform hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
              boxShadow: `0 0 12px ${currentTheme.glow}`,
            }}
          >
            <UserAvatar
              src={user.avatar}
              name={user.name}
              userId={user._id}
              className="h-9 w-9 border border-[#04070D]"
              showStatus={false}
            />
          </Link>
        )}
      </div>
    </header>
  );
}
