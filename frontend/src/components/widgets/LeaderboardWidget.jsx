// frontend/src/components/widgets/LeaderboardWidget.jsx
import React from 'react';
import { FaTrophy, FaMedal } from 'react-icons/fa';

// Mock data (Connect to your user endpoint sorted by karma/coins)
const TOP_USERS = [
  { id: 1, name: 'Alex Doe', score: 1540, avatar: null },
  { id: 2, name: 'Sarah Smith', score: 1200, avatar: null },
  { id: 3, name: 'John Wick', score: 980, avatar: null },
];

export default function LeaderboardWidget() {
  return (
    <div className="card p-5 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 border-yellow-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4 text-yellow-600 dark:text-yellow-400">
        <FaTrophy className="text-xl" />
        <h3 className="font-bold text-lg">Top Creators</h3>
      </div>

      <div className="space-y-4">
        {TOP_USERS.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3">
            <div className={`w-6 h-6 flex items-center justify-center font-bold text-sm rounded-full ${i===0?'bg-yellow-400 text-white':i===1?'bg-gray-300 text-gray-700':i===2?'bg-orange-300 text-white':'text-gray-500'}`}>
              {i+1}
            </div>
            <img src={u.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full border border-white shadow-sm" />
            <div className="flex-1">
              <div className="font-bold text-sm">{u.name}</div>
              <div className="text-xs text-gray-500">{u.score} pts</div>
            </div>
            {i === 0 && <FaMedal className="text-yellow-500" />}
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-xs font-bold text-yellow-600 uppercase tracking-wider hover:underline">View Global Rankings</button>
    </div>
  );
}