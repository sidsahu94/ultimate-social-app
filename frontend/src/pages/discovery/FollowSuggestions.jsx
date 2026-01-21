// frontend/src/pages/discovery/FollowSuggestions.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import UserAvatar from '../../components/ui/UserAvatar';
import { useSelector } from 'react-redux';

export default function FollowSuggestions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    if (!user) return;
    const fetchSuggestions = async () => {
      try {
        const r = await API.get('/follow-suggest/suggest');
        // Handle unified response and fallback
        const data = Array.isArray(r.data) ? r.data : (r.data.data || []);
        
        // Deduplicate suggestions based on _id
        const unique = data.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i);
        
        setList(unique);
      } catch (e) {
        console.error("Failed to fetch suggestions:", e);
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [user]);

  if (!user || loading) return (
      <div className="card p-5 bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-sm">
          <div className="animate-pulse flex flex-col gap-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="space-y-3">
                  <div className="flex gap-3">
                      <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="card p-5 bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-sm">
      <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">
        Who to follow
      </h3>
      
      {list.length === 0 ? (
          <div className="text-gray-400 text-sm">No suggestions available.</div>
      ) : (
          <div className="space-y-4">
            {list.slice(0, 5).map(u => (
              <div key={u._id} className="flex items-center justify-between">
                <Link to={`/profile/${u._id}`} className="flex items-center gap-3 group">
                    <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10 rounded-full" />
                    <div className="flex flex-col">
                        <span className="font-bold text-sm dark:text-white group-hover:text-indigo-500 transition line-clamp-1">{u.name}</span>
                        <span className="text-xs text-gray-500">{u.followers?.length || 0} followers</span>
                    </div>
                </Link>
                <Link 
                    to={`/profile/${u._id}`} 
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                >
                    View
                </Link>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}