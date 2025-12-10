import React,{useEffect,useState} from 'react';
import API from '../../services/api';
import PostCard from '../../components/posts/PostCard';

export default function Memories(){
  const [items,setItems]=useState([]);
  useEffect(()=>{ (async()=> setItems((await API.get('/social/memories')).data) )(); },[]);
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h3 className="text-xl font-semibold mb-3">Memories</h3>
      {items.length===0 ? <div className="card p-6 text-gray-500">No flashbacks today.</div> :
        items.map(p => <PostCard key={p._id} post={p}/>)
      }
    </div>
  );
}
