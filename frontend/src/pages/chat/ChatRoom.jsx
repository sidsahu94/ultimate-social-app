import React,{useEffect,useState,useRef} from 'react';
import socket from '../../services/socket';
import API from '../../services/api';

export default function ChatRoom() {
  const chatId = window.location.pathname.split('/').pop();
  const [chat,set]=useState({});
  const [msg,setMsg]=useState('');
  const [recording,setRecording]=useState(false);
  const media = useRef(null);
  const chunks=[];

  useEffect(()=>load(),[]);
  const load=async()=>{ set((await API.get(`/chat/${chatId}`)).data); };

  const send = async()=>{ await API.post(`/chat/${chatId}/message`,{content:msg}); setMsg(''); load(); };

  const start = ()=>{
    navigator.mediaDevices.getUserMedia({ audio:true }).then(stream=>{
      media.current=new MediaRecorder(stream);
      media.current.ondataavailable=e=>chunks.push(e.data);
      media.current.onstop=async()=>{
        const blob=new Blob(chunks,{type:'audio/webm'});
        const form=new FormData();
        form.append('audio',blob);
        await API.post(`/extra/voice/${chatId}`,form);
        load();
      };
      media.current.start(); setRecording(true);
    })
  };
  const stop=()=>{ media.current.stop(); setRecording(false); };

  return (
    <div className="chat">
      <div className="messages">
        {(chat.messages||[]).map(x=>(
          <div className="msg" key={x._id}>
            {x.audio
              ? <audio controls src={x.audio}/>
              : x.content}
          </div>
        ))}
      </div>
      <footer className="flex gap-2">
        <input value={msg} onChange={e=>setMsg(e.target.value)}/>
        <button onClick={send}>Send</button>
        {!recording ? <button onClick={start}>🎤</button> : <button onClick={stop}>⏹</button>}
      </footer>
    </div>
  );
}
