// frontend/src/components/profile/ProfileHighlights.jsx
import React from 'react';
import { FaPlus, FaCode, FaChartLine, FaCamera, FaEllipsisH } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeProvider';

// Highlights matching Screen 4 of SocialVerse ∞ design
const DEFAULT_HIGHLIGHTS = [
  {
    id: 'travel',
    title: 'Travel',
    type: 'image',
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&auto=format&fit=crop&q=80',
    ring: 'from-[#FF6B8A] via-[#9B6DFF] to-[#00F2FE]',
  },
  {
    id: 'coding',
    title: 'Coding',
    type: 'icon',
    icon: <FaCode className="text-[#00F2FE] text-lg" />,
    ring: 'from-[#00F2FE] via-[#1D4ED8] to-[#10B981]',
  },
  {
    id: 'trading',
    title: 'Trading',
    type: 'icon',
    icon: <FaChartLine className="text-[#F59E0B] text-lg" />,
    ring: 'from-[#F59E0B] via-[#EF4444] to-[#D4AF37]',
  },
  {
    id: 'life',
    title: 'Life',
    type: 'icon',
    icon: <FaCamera className="text-[#FF6B8A] text-lg" />,
    ring: 'from-[#FF6B8A] via-[#EC4899] to-[#8B5CF6]',
  },
  {
    id: 'more',
    title: 'More',
    type: 'icon',
    icon: <FaEllipsisH className="text-[#CBD5E1] text-base" />,
    ring: 'from-[#64748B] via-[#94A3B8] to-[#CBD5E1]',
  },
];

export default function ProfileHighlights({ isMe, onAddHighlight }) {
  const { currentTheme } = useTheme();

  return (
    <div className="w-full my-4">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar px-2 py-2">
        {/* If owner, show "Add New" button */}
        {isMe && (
          <button
            type="button"
            onClick={onAddHighlight}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/25 flex items-center justify-center bg-white/[0.04] backdrop-blur-md group-hover:border-white/50 group-hover:bg-white/[0.08] transition-all duration-300 shadow-md">
              <FaPlus className="text-white/70 group-hover:text-white group-hover:scale-110 transition-transform text-sm" />
            </div>
            <span className="text-[11px] font-medium text-[#CBD5E1]/70 group-hover:text-white transition-colors">
              New
            </span>
          </button>
        )}

        {DEFAULT_HIGHLIGHTS.map((h) => (
          <div
            key={h.id}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
          >
            {/* Outer Spectrum Ring */}
            <div
              className={`w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr ${h.ring} shadow-md group-hover:scale-105 transition-transform duration-300`}
            >
              <div className="w-full h-full rounded-full bg-[#070B14] p-[2px] flex items-center justify-center overflow-hidden">
                {h.type === 'image' ? (
                  <img
                    src={h.img}
                    alt={h.title}
                    className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#0D1525] flex items-center justify-center group-hover:bg-[#131E35] transition-colors">
                    {h.icon}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#CBD5E1] tracking-tight group-hover:text-white transition-colors">
              {h.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
