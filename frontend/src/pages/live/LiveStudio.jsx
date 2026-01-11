// frontend/src/pages/live/LiveStudio.jsx
import React,{useEffect,useRef,useState} from 'react';
import API from '../../services/api';
import socket from '../../services/socket';
import Peer from 'simple-peer';
import { useNavigate } from 'react-router-dom';

export default function LiveStudio(){
  const nav = useNavigate();
  const localRef = useRef(null);
  const [room,setRoom] = useState(null);
  const [title,setTitle] = useState('My Live');

  const start = async ()=>{
    const r = await API.post('/live/start',{ title });
    setRoom(r.data.roomId);
    const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    localRef.current.srcObject = stream;

    socket.connect();
    socket.emit('live:host', { roomId:r.data.roomId });
    socket.on('live:viewer-request', sid=>{
      const peer = new Peer({ initiator:true, trickle:false, stream });
      peer.on('signal', data => socket.emit('live:signal', { to:sid, data, roomId:r.data.roomId }));
    });
  };

  const end = async ()=>{
    if (!room) return;
    await API.post(`/live/end/${room}`);
    nav('/live/list');
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Live Studio</h2>
      <input value={title} onChange={e=>setTitle(e.target.value)} className="p-2 border rounded mb-3" placeholder="Title"/>
      <div className="grid md:grid-cols-2 gap-4">
        <video ref={localRef} autoPlay muted className="w-full rounded bg-black h-64 object-cover"/>
        <div className="card p-3">
          <div className="font-medium">Controls</div>
          <button className="btn-primary mt-2" onClick={start}>Go Live</button>
          <button className="px-3 py-2 rounded border mt-2" onClick={end}>End</button>
        </div>
      </div>
    </div>
  );
}
