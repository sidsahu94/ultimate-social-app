// frontend/src/components/widgets/LeaderboardWidget.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import API from '../../services/api';
import UserAvatar from '../ui/UserAvatar';

const FALLBACK_USERS = [
  { _id: 'creator_1', name: 'Sidhanta Sahu', score: 2540, avatar: null },
  { _id: 'creator_2', name: 'Elena Rostova', score: 1820, avatar: null },
  { _id: 'creator_3', name: 'CipherSovereign', score: 1450, avatar: null },
];

export default function LeaderboardWidget() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(FALLBACK_USERS);

  useEffect(() => {
    let mounted = true;
    const fetchTopCreators = async () => {
      try {
        const res = await API.get('/users/top-creators');
        const list = res.data?.data || res.data;
        if (mounted && Array.isArray(list) && list.length > 0) {
          setUsers(list);
        }
      } catch (err) {
        // Retain fallback gracefully
      }
    };
    fetchTopCreators();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="card p-5 bg-[#070B14] border border-white/10 rounded-3xl shadow-xl">
      <div className="flex items-center gap-2 mb-4 text-[#F4D49A]">
        <FaTrophy className="text-xl" />
        <h3 className="font-bold text-base font-serif text-[#F7F7FC]">Top Creators</h3>
      </div>

      <div className="space-y-4">
        {users.map((u, i) => (
          <Link
            to={u._id && !u._id.startsWith('creator_') ? `/profile/${u._id}` : '#'}
            key={u._id || i}
            className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-white/5 transition"
          >
            <div
              className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-full ${
                i === 0
                  ? 'bg-[#F4D49A] text-black shadow-[0_0_12px_rgba(244,212,154,0.4)]'
                  : i === 1
                  ? 'bg-white/20 text-[#F7F7FC]'
                  : i === 2
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-[#CBD5E1]/40'
              }`}
            >
              {i + 1}
            </div>
            <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10 border border-white/10 shadow-sm" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[#F7F7FC] truncate">{u.name}</div>
              <div className="text-xs text-[#CBD5E1]/60 font-mono">{u.score || (u.followerCount ? u.followerCount * 15 : 100)} pts</div>
            </div>
            {i === 0 && <FaMedal className="text-[#F4D49A]" />}
          </Link>
        ))}
      </div>

      <button
        onClick={() => navigate('/analytics')}
        className="w-full mt-4 text-xs font-bold text-[#00F2FE] uppercase tracking-wider hover:opacity-80 transition text-left flex items-center justify-between"
      >
        <span>View Global Rankings →</span>
      </button>
    </div>
  );
}
