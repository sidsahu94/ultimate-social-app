// frontend/src/pages/discovery/FollowSuggestions.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import UserAvatar from '../../components/ui/UserAvatar';
import FollowButton from '../../components/profile/FollowButton';
import { useSelector } from 'react-redux';

let memorySuggestionsCache = null;
let lastSuggestionsFetchTime = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const DEFAULT_SUGGESTIONS = [
  { _id: 'suggest_user_1', name: 'Elena Rostova', username: 'elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  { _id: 'suggest_user_2', name: 'Marcus Thorne', username: 'marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { _id: 'suggest_user_3', name: 'Aria Chen', username: 'aria', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' },
  { _id: 'suggest_user_4', name: 'Dr. Alistair Vance', username: 'alistair', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' }
];

export default function FollowSuggestions() {
  const { user } = useSelector(s => s.auth);
  const [list, setList] = useState(memorySuggestionsCache || []);
  const [loading, setLoading] = useState(!memorySuggestionsCache);

  useEffect(() => {
    if (!user) return;

    if (memorySuggestionsCache && Date.now() - lastSuggestionsFetchTime < CACHE_TTL) {
      setList(memorySuggestionsCache);
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const r = await API.get('/follow-suggest/suggest');
        const data = Array.isArray(r.data) ? r.data : (r.data.data || []);
        const unique = data.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i);
        memorySuggestionsCache = unique;
        lastSuggestionsFetchTime = Date.now();
        setList(unique.length > 0 ? unique : DEFAULT_SUGGESTIONS);
      } catch (e) {
        console.error("Failed to fetch suggestions:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [user]);

  if (!user || loading) return (
      <div className="card p-5 bg-[#070B14]/85 backdrop-blur-xl border border-[rgba(226,232,240,0.14)] rounded-[24px] shadow-silverGlass">
          <div className="animate-pulse flex flex-col gap-4">
              <div className="h-5 bg-[#04070D] rounded w-1/2"></div>
              <div className="space-y-3">
                  <div className="flex gap-3">
                      <div className="rounded-full bg-[#04070D] h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                          <div className="h-2 bg-[#04070D] rounded w-3/4"></div>
                          <div className="h-2 bg-[#04070D] rounded w-1/2"></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="card p-5 bg-[#070B14]/85 backdrop-blur-xl border border-[rgba(226,232,240,0.14)] rounded-[24px] shadow-silverGlass">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base text-[#F8FAFC]">
          Who to follow
        </h3>
        <Link to="/explore" className="text-[11px] font-semibold text-[#00F2FE] hover:underline">
          Explore
        </Link>
      </div>
      
      {list.length === 0 ? (
          <div className="text-[#CBD5E1]/50 text-sm">No suggestions available.</div>
      ) : (
          <div className="space-y-3.5">
            {list.slice(0, 5).map(u => (
              <div key={u._id} className="flex items-center justify-between gap-2">
                <Link to={`/profile/${u._id}`} className="flex items-center gap-2.5 group min-w-0 flex-1">
                    <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10 rounded-full shrink-0 border border-white/10" />
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-xs text-[#F8FAFC] group-hover:text-[#00F2FE] transition-colors truncate">{u.name}</span>
                        <span className="text-[11px] text-[#CBD5E1]/60 truncate">@{u.username || 'creator'}</span>
                    </div>
                </Link>
                <div className="shrink-0">
                  <FollowButton userId={u._id} initialStatus={false} />
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}
