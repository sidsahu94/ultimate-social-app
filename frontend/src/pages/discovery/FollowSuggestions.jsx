// frontend/src/pages/discovery/FollowSuggestions.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';

export default function FollowSuggestions(){
  const [list,setList]=useState([]);
  useEffect(()=>{ API.get('/follow-suggest/suggest').then(r=>setList(r.data)) },[]);
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h3 className="text-xl font-semibold mb-3">People you may know</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {list.map(u => (
          <div key={u._id} className="card p-3">
            <img src={u.avatar||'/default-avatar.png'} className="w-12 h-12 rounded-full"/>
            <div className="font-medium">{u.name}</div>
            <Link to={`/profile/${u._id}`} className="text-sm text-indigo-600">View</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
