import React,{useEffect,useState} from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';

export default function Nearby(){
  const [items,setItems]=useState([]);
  useEffect(()=>{
    navigator.geolocation.getCurrentPosition(async pos=>{
      const { latitude:lat, longitude:lng } = pos.coords;
      await API.post('/social/geo',{ lat, lng });
      const r = await API.get(`/social/nearby?lat=${lat}&lng=${lng}&km=50`);
      setItems(r.data);
    }, ()=>{});
  },[]);
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h3 className="text-xl font-semibold mb-3">Nearby users</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map(u=>(
          <Link key={u._id} to={`/profile/${u._id}`} className="card p-3 flex items-center gap-3">
            <img src={u.avatar||'/default-avatar.png'} className="w-10 h-10 rounded-full"/>
            <div>{u.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
