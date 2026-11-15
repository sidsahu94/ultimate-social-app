// frontend/src/components/profile/ProfileHighlights.jsx
import React, { useState } from 'react';
import { FaPlus, FaCode, FaChartLine, FaCamera, FaEllipsisH } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeProvider';
import HighlightViewerModal from './HighlightViewerModal';
import CreateHighlightModal from './CreateHighlightModal';

// Highlights matching Screen 4 of SocialVerse ∞ design with full multi-slide stories
const INITIAL_HIGHLIGHTS = [
  {
    id: 'travel',
    title: 'Travel',
    type: 'image',
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&auto=format&fit=crop&q=80',
    ring: 'from-[#FF6B8A] via-[#9B6DFF] to-[#00F2FE]',
    stories: [
      {
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&auto=format&fit=crop&q=80',
        caption: '🏔️ Sunrise over the Swiss Alps • Serenity & Perspective',
        timestamp: '1d ago',
      },
      {
        url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1080&auto=format&fit=crop&q=80',
        caption: '🗼 Tokyo Nights • Cyberpunk Neon Reflections & Shibuya Matrix',
        timestamp: '3d ago',
      },
      {
        url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&auto=format&fit=crop&q=80',
        caption: '🌊 Santorini Blue Hour • Architectural harmony on the caldera',
        timestamp: '1w ago',
      },
    ],
  },
  {
    id: 'coding',
    title: 'Coding',
    type: 'icon',
    icon: <FaCode className="text-[#00F2FE] text-lg" />,
    img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=80',
    ring: 'from-[#00F2FE] via-[#1D4ED8] to-[#10B981]',
    stories: [
      {
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1080&auto=format&fit=crop&q=80',
        caption: '⚡ Architecting SocialVerse ∞ Core Neural Enclave & 256-bit biometrics',
        timestamp: '2d ago',
      },
      {
        url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&auto=format&fit=crop&q=80',
        caption: '🛡️ Zero-latency WebRTC media routing with Mediasoup clusters',
        timestamp: '5d ago',
      },
    ],
  },
  {
    id: 'trading',
    title: 'Trading',
    type: 'icon',
    icon: <FaChartLine className="text-[#F59E0B] text-lg" />,
    img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&auto=format&fit=crop&q=80',
    ring: 'from-[#F59E0B] via-[#EF4444] to-[#D4AF37]',
    stories: [
      {
        url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&auto=format&fit=crop&q=80',
        caption: '📈 Multi-monitor trading battle station • Algorithmic liquidity capture',
        timestamp: '4d ago',
      },
      {
        url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1080&auto=format&fit=crop&q=80',
        caption: '💎 Bitcoin break-out structural confirmation • Bullish impulse',
        timestamp: '6d ago',
      },
    ],
  },
  {
    id: 'life',
    title: 'Life',
    type: 'icon',
    icon: <FaCamera className="text-[#FF6B8A] text-lg" />,
    img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    ring: 'from-[#FF6B8A] via-[#EC4899] to-[#8B5CF6]',
    stories: [
      {
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1080&auto=format&fit=crop&q=80',
        caption: '☕ Specialty espresso & deep morning flow state before market open',
        timestamp: '3d ago',
      },
      {
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&auto=format&fit=crop&q=80',
        caption: '🏋️ High performance training • Discipline drives creative output',
        timestamp: '1w ago',
      },
    ],
  },
  {
    id: 'more',
    title: 'More',
    type: 'icon',
    icon: <FaEllipsisH className="text-[#CBD5E1] text-base" />,
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
    ring: 'from-[#64748B] via-[#94A3B8] to-[#CBD5E1]',
    stories: [
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80',
        caption: '🌅 Sunset thoughts on building timeless luxury software • Beyond Social',
        timestamp: '2w ago',
      },
    ],
  },
];

export default function ProfileHighlights({ isMe, user }) {
  const [highlights, setHighlights] = useState(INITIAL_HIGHLIGHTS);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentTheme } = useTheme();

  const handleOpenHighlight = (highlight) => {
    setActiveHighlight(highlight);
  };

  const handleAddHighlight = (newHighlight) => {
    setHighlights((prev) => [newHighlight, ...prev]);
  };

  return (
    <div className="w-full my-4">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar px-2 py-2">
        {/* If owner, show "+ New" highlight creation button */}
        {isMe && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
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

        {highlights.map((h) => (
          <div
            key={h.id}
            onClick={() => handleOpenHighlight(h)}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer select-none"
          >
            {/* Outer Spectrum Ring */}
            <div
              className={`w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr ${h.ring} shadow-md group-hover:scale-105 active:scale-95 transition-transform duration-300`}
            >
              <div className="w-full h-full rounded-full bg-[#070B14] p-[2px] flex items-center justify-center overflow-hidden">
                {h.type === 'image' || h.img ? (
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

      {/* Fullscreen Interactive Story Highlight Viewer */}
      {activeHighlight && (
        <HighlightViewerModal
          highlight={activeHighlight}
          user={user}
          onClose={() => setActiveHighlight(null)}
        />
      )}

      {/* New Highlight Creator Modal */}
      <CreateHighlightModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleAddHighlight}
      />
    </div>
  );
}
