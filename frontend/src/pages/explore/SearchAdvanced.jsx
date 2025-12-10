import React, { useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';

export default function SearchAdvanced(){
  const [q,setQ]=useState('');
  const [out,setOut]=useState(null);
  const go = async (e)=>{ e.preventDefault(); setOut((await API.get(`/search/global?q=${encodeURIComponent(q)}`)).data); };
  return (
    <div className="max-w-5xl mx-auto p-4">
      <form onSubmit={go} className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 p-3 rounded border" placeholder="Search people, posts, #hashtags"/>
        <button className="btn-primary">Search</button>
      </form>

      {out && (
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="card p-3">
            <div className="font-semibold mb-2">Users</div>
            {out.users.map(u=>(
              <Link to={`/profile/${u._id}`} key={u._id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                <img src={u.avatar||'/default-avatar.png'} className="w-8 h-8 rounded-full"/>
                <div>{u.name}</div>
              </Link>
            ))}
          </div>
          <div className="card p-3 md:col-span-2">
            <div className="font-semibold mb-2">Top posts</div>
            {out.posts.map(p=>(
              <div key={p._id} className="p-2 border-b">
                <div className="text-sm text-gray-500">{p.user?.name}</div>
                <div className="text-sm">{p.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {out && (
        <div className="card p-3 mt-4">
          <div className="font-semibold mb-2">Trending hashtags</div>
          <div className="flex flex-wrap gap-2">
            {out.hashtags.map(h => <span key={h} className="px-3 py-1 rounded bg-indigo-100 text-indigo-700">#{h}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
