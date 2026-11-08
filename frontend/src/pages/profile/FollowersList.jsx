// frontend/src/pages/profile/FollowersList.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { useParams, Link } from 'react-router-dom';
import { FaUsers } from 'react-icons/fa';
import UserAvatar from '../../components/ui/UserAvatar';

export default function FollowersList() {
  const { id } = useParams();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await API.get(`/users/${id}`);
        const data = r.data?.data || r.data;
        setList(data.followers || []);
      } catch (e) { 
        console.error(e); 
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-1">
          <FaUsers /> Community Graph
        </div>
        <h3 className="text-2xl font-black text-[#F7F7FC] font-display">Network Followers<span className="text-[#00F2FE]">.</span></h3>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-[#A5A9BB]">Loading network followers...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-xs text-[#A5A9BB] bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl">
          No followers recorded for this account.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map(f => (
            <Link 
              key={f._id} 
              to={`/profile/${f._id}`} 
              className="p-4 border border-white/10 rounded-2xl flex items-center gap-3.5 bg-[#070B14]/90 hover:border-white/20 hover:shadow-[0_8px_25px_rgba(29,78,216,0.15)] transition backdrop-blur-xl group"
            >
              <UserAvatar src={f.avatar} name={f.name} className="w-10 h-10 border border-white/10" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-[#F7F7FC] group-hover:text-[#00F2FE] transition-colors truncate">{f.name}</div>
                <div className="text-[11px] text-[#A5A9BB] truncate">@{f.username || 'creator'}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
