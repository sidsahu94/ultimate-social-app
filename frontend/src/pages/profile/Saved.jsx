import React,{useEffect,useState} from 'react';
import API from '../../services/api';

export default function Saved() {
  const [saved,set]=useState([]);

  useEffect(()=>{ (async()=>set((await API.get('/extra/saved')).data))() },[]);

  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {saved.map(p=>(
        <img key={p._id} src={p.images?.[0]} className="w-full h-32 object-cover rounded"/>
      ))}
    </div>
  )
}
