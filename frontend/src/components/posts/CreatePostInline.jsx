// frontend/src/components/posts/CreatePostInline.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { 
  IoImageOutline, 
  IoVideocamOutline, 
  IoFilmOutline, 
  IoRadioOutline, 
  IoBarChartOutline, 
  IoHappyOutline,
  IoSparkles
} from 'react-icons/io5';
import UserAvatar from '../ui/UserAvatar';
import { useTheme } from '../../contexts/ThemeProvider';

export default function CreatePostInline({ onOpenModal, onSelectTab }) {
  const { user } = useSelector((s) => s.auth);
  const { currentTheme } = useTheme();

  const handleAction = (tabName) => {
    if (onSelectTab) onSelectTab(tabName);
    if (onOpenModal) onOpenModal();
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Sidhanta';

  return (
    <div
      className="relative overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.14)] bg-[#070B14]/85 p-4 md:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 hover:border-[rgba(255,255,255,0.24)] mb-6 group"
      style={{
        boxShadow: `0 16px 40px rgba(0, 0, 0, 0.65), 0 0 25px ${currentTheme.glow}`,
        borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.14)',
      }}
    >
      {/* Top Input Bar */}
      <div className="flex items-center gap-3">
        <UserAvatar
          src={user?.avatar}
          name={user?.name}
          userId={user?._id}
          className="h-10 w-10 shrink-0 border border-white/20"
        />

        <div
          onClick={() => handleAction('post')}
          className="relative flex-1 flex items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-[#CBD5E1]/70 transition-all hover:bg-white/[0.08] hover:border-white/20 hover:text-white cursor-pointer shadow-inner"
        >
          <span className="font-medium truncate">What's on your mind, {displayName}?</span>
          <IoImageOutline size={18} className="text-[#38BDF8] shrink-0 ml-2 opacity-80 group-hover:opacity-100" />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="mt-3.5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pt-2 border-t border-white/10">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Photo */}
          <button
            type="button"
            onClick={() => handleAction('photo')}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#CBD5E1] transition-all hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <IoImageOutline className="text-sm text-[#10B981]" />
            <span>Photo</span>
          </button>

          {/* Video */}
          <button
            type="button"
            onClick={() => handleAction('video')}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#CBD5E1] transition-all hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <IoVideocamOutline className="text-sm text-[#8B5CF6]" />
            <span>Video</span>
          </button>

          {/* Reel */}
          <button
            type="button"
            onClick={() => handleAction('reel')}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#CBD5E1] transition-all hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <IoFilmOutline className="text-sm text-[#EC4899]" />
            <span>Reel</span>
          </button>

          {/* Live */}
          <button
            type="button"
            onClick={() => handleAction('live')}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#CBD5E1] transition-all hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EF4444] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#EF4444]" />
            </span>
            <IoRadioOutline className="text-sm text-[#EF4444]" />
            <span>Live</span>
          </button>

          {/* Poll */}
          <button
            type="button"
            onClick={() => handleAction('poll')}
            className="hidden sm:flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#CBD5E1] transition-all hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <IoBarChartOutline className="text-sm text-[#F59E0B]" />
            <span>Poll</span>
          </button>

          {/* Feeling */}
          <button
            type="button"
            onClick={() => handleAction('feeling')}
            className="hidden md:flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#CBD5E1] transition-all hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <IoHappyOutline className="text-sm text-[#FBBF24]" />
            <span>Feeling</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Post Button */}
          <button
            type="button"
            onClick={() => handleAction('ai')}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.2)] bg-gradient-to-r from-[#1D4ED8]/30 via-[#8B0018]/25 to-[#00F2FE]/20 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:scale-105 active:scale-95 transition cursor-pointer"
            style={{
              boxShadow: `0 0 15px ${currentTheme.glow}`,
            }}
          >
            <IoSparkles className="text-xs text-[#F4D49A] animate-pulse" />
            <span className="bg-gradient-to-r from-[#F8FAFC] via-[#F4D49A] to-[#00F2FE] bg-clip-text text-transparent">
              AI Post
            </span>
            <span className="text-[10px]">✨</span>
          </button>

          {/* Submit Post Button */}
          <button
            type="button"
            onClick={() => handleAction('post')}
            className="rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
              boxShadow: `0 0 15px ${currentTheme.glow}`,
            }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
