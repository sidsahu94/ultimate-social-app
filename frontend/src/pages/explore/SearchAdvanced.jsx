// frontend/src/pages/explore/SearchAdvanced.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { FaSearch, FaHashtag, FaUsers, FaCompass } from 'react-icons/fa';
import UserAvatar from '../../components/ui/UserAvatar';

export default function SearchAdvanced() {
  const [q, setQ] = useState('');
  const [out, setOut] = useState(null);

  const go = async (e) => { 
    e.preventDefault(); 
    try {
      const res = await API.get(`/search/global?q=${encodeURIComponent(q)}`);
      const payload = res.data?.data || res.data;
      setOut(payload);
    } catch (_) {
      setOut({ users: [], posts: [], hashtags: [] });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24">
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F2FE] mb-1">
          <FaCompass /> Universal Search
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
          Deep Network Index<span className="text-[#00F2FE]">.</span>
        </h1>
      </div>

      <form onSubmit={go} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-3.5 text-[#A5A9BB]" size={14} />
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            className="w-full pl-11 p-3.5 rounded-2xl bg-[#070B14]/90 border border-white/10 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50 transition backdrop-blur-xl" 
            placeholder="Search profiles, broadcasts, and #hashtags..."
          />
        </div>
        <button className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white text-xs font-bold shadow-lg hover:opacity-95 transition">
          Search
        </button>
      </form>

      {out && (
        <div className="grid md:grid-cols-3 gap-6 mt-6 animate-fade-in">
          {/* Users column */}
          <div className="p-5 bg-[#070B14]/90 border border-white/10 rounded-3xl shadow-xl backdrop-blur-xl">
            <div className="font-bold text-xs uppercase tracking-wider text-[#D4AF37] mb-4 flex items-center gap-2">
              <FaUsers /> People ({out.users?.length || 0})
            </div>
            <div className="space-y-2">
              {out.users?.length === 0 ? (
                <div className="text-xs text-[#A5A9BB] py-4">No profiles found</div>
              ) : out.users?.map(u => (
                <Link to={`/profile/${u._id}`} key={u._id} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition">
                  <UserAvatar src={u.avatar} name={u.name} className="w-9 h-9 border border-white/10" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-[#F7F7FC] truncate">{u.name}</div>
                    <div className="text-[10px] text-[#A5A9BB] truncate">@{u.username || 'creator'}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Posts column */}
          <div className="p-5 bg-[#070B14]/90 border border-white/10 rounded-3xl shadow-xl backdrop-blur-xl md:col-span-2">
            <div className="font-bold text-xs uppercase tracking-wider text-[#00F2FE] mb-4">
              Broadcast Matches ({out.posts?.length || 0})
            </div>
            <div className="space-y-3">
              {out.posts?.length === 0 ? (
                <div className="text-xs text-[#A5A9BB] py-4">No matching posts found</div>
              ) : out.posts?.map(p => (
                <div key={p._id} className="p-3.5 bg-[#171A26]/80 border border-white/5 rounded-2xl">
                  <div className="text-[11px] font-bold text-[#F7F7FC] mb-1">{p.user?.name || 'Creator'}</div>
                  <div className="text-xs text-[#CBD5E1] leading-relaxed line-clamp-2">{p.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {out?.hashtags && out.hashtags.length > 0 && (
        <div className="p-5 mt-6 bg-[#070B14]/90 border border-white/10 rounded-3xl shadow-xl backdrop-blur-xl">
          <div className="font-bold text-xs uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-2">
            <FaHashtag /> Related Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {out.hashtags.map(h => (
              <Link 
                to={`/tag/${h}`} 
                key={h} 
                className="px-3.5 py-1.5 rounded-full bg-[#171A26] border border-white/10 text-xs font-bold text-[#00F2FE] hover:border-[#00F2FE]/40 hover:bg-[#00F2FE]/10 transition"
              >
                #{h}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
