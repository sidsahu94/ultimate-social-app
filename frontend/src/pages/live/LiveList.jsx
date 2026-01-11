// frontend/src/pages/live/LiveList.jsx
import React,{useEffect,useState} from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';

export default function LiveList(){
  const [lives,setLives]=useState([]);
  useEffect(()=>{ (async()=> setLives((await API.get('/live/list')).data) )(); },[]);
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold">Live now</h3>
        <Link to="/live/studio" className="btn-primary">Go Live</Link>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {lives.map(l=>(
          <Link to={`/live/watch/${l.roomId}`} key={l._id} className="card p-3">
            <div className="font-medium">{l.title}</div>
            <div className="text-sm text-gray-500">{l.host?.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
