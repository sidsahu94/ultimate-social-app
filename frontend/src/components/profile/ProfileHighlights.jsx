// frontend/src/components/profile/ProfileHighlights.jsx
import React from 'react';
import { FaPlus } from 'react-icons/fa';

// Static demo highlights for visual completeness
const DUMMY_HIGHLIGHTS = [
  { id: 1, title: 'Travel ✈️', img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=150' },
  { id: 2, title: 'Food 🍔', img: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=150' },
  { id: 3, title: 'Design 🎨', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150' },
];

export default function ProfileHighlights({ isMe }) {
  return (
    <div className="flex gap-4 overflow-x-auto py-4 no-scrollbar px-4">
      {isMe && (
        <div className="flex flex-col items-center gap-1.5 min-w-[70px] cursor-pointer group">
          <div className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-[#070B14] hover:border-[#00F2FE]/50 hover:bg-[#0A111E] transition shadow-md">
            <FaPlus className="text-[#D4AF37] group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs font-medium text-[#CBD5E1]/70">New</span>
        </div>
      )}
      
      {DUMMY_HIGHLIGHTS.map(h => (
        <div key={h.id} className="flex flex-col items-center gap-1.5 min-w-[70px] cursor-pointer group">
          <div className="w-[70px] h-[70px] rounded-full p-[2px] bg-white/10 group-hover:bg-gradient-to-tr group-hover:from-[#D4AF37] group-hover:via-[#F4D49A] group-hover:to-[#00F2FE] transition-all shadow-md">
            <img src={h.img} alt={h.title} className="w-full h-full rounded-full object-cover border-2 border-[#04070D]" />
          </div>
          <span className="text-xs font-medium text-[#CBD5E1]">{h.title}</span>
        </div>
      ))}
    </div>
  );
}
