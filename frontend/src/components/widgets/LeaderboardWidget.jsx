// frontend/src/components/widgets/LeaderboardWidget.jsx
import React from 'react';
import { FaTrophy, FaMedal } from 'react-icons/fa';

const TOP_USERS = [
  { id: 1, name: 'Alex Doe', score: 1540, avatar: null },
  { id: 2, name: 'Sarah Smith', score: 1200, avatar: null },
  { id: 3, name: 'John Wick', score: 980, avatar: null },
];

export default function LeaderboardWidget() {
  return (
    <div className="card p-5 bg-[#070B14] border border-white/10 rounded-3xl shadow-xl">
      <div className="flex items-center gap-2 mb-4 text-[#F4D49A]">
        <FaTrophy className="text-xl" />
        <h3 className="font-bold text-base font-serif text-[#F7F7FC]">Top Creators</h3>
      </div>

      <div className="space-y-4">
        {TOP_USERS.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3">
            <div className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-full ${
              i === 0 ? 'bg-[#F4D49A] text-black' : 
              i === 1 ? 'bg-white/20 text-[#F7F7FC]' : 
              i === 2 ? 'bg-[#D4AF37] text-black' : 
              'text-[#CBD5E1]/40'
            }`}>
              {i+1}
            </div>
            <img src={u.avatar || '/default-avatar.png'} alt={u.name} className="w-10 h-10 rounded-full border border-white/10 shadow-sm object-cover" />
            <div className="flex-1">
              <div className="font-bold text-sm text-[#F7F7FC]">{u.name}</div>
              <div className="text-xs text-[#CBD5E1]/60">{u.score} pts</div>
            </div>
            {i === 0 && <FaMedal className="text-[#F4D49A]" />}
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-xs font-bold text-[#00F2FE] uppercase tracking-wider hover:opacity-80 transition text-left">View Global Rankings →</button>
    </div>
  );
}
