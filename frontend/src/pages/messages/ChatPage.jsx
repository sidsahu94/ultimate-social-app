// src/pages/messages/ChatPage.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import ChatBox from '../../components/chat/ChatBox';

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    API.get('/chat').then(res => setChats(res.data)).catch(()=>{});
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-3 gap-4">
      <div className="col-span-1 bg-white rounded shadow p-3">
        <h3 className="font-semibold mb-3">Chats</h3>
        {chats.map(c => (
          <div key={c._id} className="p-2 cursor-pointer border-b" onClick={()=>setActive(c._id)}>
            {c.participants.map(p => <div key={p._id}>{p.name}</div>)}
          </div>
        ))}
      </div>
      <div className="col-span-2">
        {active ? <ChatBox chatId={active} /> : <div className="p-6 bg-white rounded shadow">Select a chat</div>}
      </div>
    </div>
  );
};

export default ChatPage;
