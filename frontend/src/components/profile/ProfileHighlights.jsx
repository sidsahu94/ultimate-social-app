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
        <div className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer">
          <div className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 transition">
            <FaPlus className="text-gray-400" />
          </div>
          <span className="text-xs font-medium">New</span>
        </div>
      )}
      
      {DUMMY_HIGHLIGHTS.map(h => (
        <div key={h.id} className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group">
          <div className="w-[70px] h-[70px] rounded-full p-[2px] bg-gray-200 dark:bg-gray-800 group-hover:bg-gradient-to-tr from-yellow-400 to-fuchsia-600 transition-all">
            <img src={h.img} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900" />
          </div>
          <span className="text-xs font-medium">{h.title}</span>
        </div>
      ))}
    </div>
  );
}