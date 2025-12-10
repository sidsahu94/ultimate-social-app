import React,{useEffect,useRef,useState} from 'react';
import { useParams } from 'react-router-dom';
import API from '../../services/api';
import socket from '../../services/socket';
import Peer from 'simple-peer';

export default function LiveWatch(){
  const { roomId } = useParams();
  const remoteRef = useRef(null);
  const [donation,setDonation]=useState(10);
  const [msg,setMsg]=useState('');
  const [live,setLive]=useState(null);

  useEffect(()=>{
    (async()=>{
      try{ setLive((await API.get(`/live/${roomId}`)).data); }catch{}
    })();
    socket.connect();
    socket.emit('live:viewer', { roomId });
    socket.on('live:signal', async ({ data })=>{
      const peer = new Peer({ initiator:false, trickle:false });
      peer.on('signal', s => socket.emit('live:return', { roomId, data:s }));
      peer.on('stream', stream => remoteRef.current.srcObject = stream);
      peer.signal(data);
    });
    return ()=>{ socket.off('live:signal'); };
  },[roomId]);

  const superchat = async ()=>{
    await API.post(`/live/${roomId}/superchat`, { amount:donation, message:msg });
    setMsg('');
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <video ref={remoteRef} autoPlay controls className="w-full rounded bg-black h-80 object-cover"/>
      <div className="card p-3 mt-3 flex items-center gap-2">
        <input type="number" value={donation} onChange={e=>setDonation(Number(e.target.value))} className="w-28 p-2 border rounded"/>
        <input value={msg} onChange={e=>setMsg(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Send a superchat message"/>
        <button className="btn-primary" onClick={superchat}>Send</button>
      </div>
    </div>
  );
}
