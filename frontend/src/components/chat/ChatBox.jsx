// frontend/src/pages/chat/ChatPage.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

/*
  Lightweight chat page UI. This uses placeholder/local data
  until you wire Socket.io on backend. It provides an attractive
  chat panel and message composer.
*/

const sampleConversations = [
  { id: "c1", name: "Asha", last: "See you tomorrow!", avatar: "/default-avatar.png" },
  { id: "c2", name: "Ravi", last: "Nice work on the post!", avatar: "/default-avatar.png" },
];

export default function ChatPage() {
  const [convos] = useState(sampleConversations);
  const [active, setActive] = useState(convos[0]?.id || null);
  const [messages, setMessages] = useState([
    { id: 1, fromMe: false, text: "Hello!" },
    { id: 2, fromMe: true, text: "Hi — how's it going?" },
  ]);
  const [text, setText] = useState("");

  useEffect(() => {
    // placeholder: in future wire socket.io
  }, []);

  const send = () => {
    if (!text.trim()) return;
    setMessages(m => [...m, { id: Date.now(), fromMe: true, text }]);
    setText("");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 card p-2">
        <h4 className="font-semibold px-3 py-2">Messages</h4>
        <div className="divide-y">
          {convos.map(c => (
            <div key={c.id} onClick={() => setActive(c.id)} className={`p-3 flex items-center gap-3 cursor-pointer ${active === c.id ? "bg-gray-50" : ""}`}>
              <img src={c.avatar} className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-500">{c.last}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 card p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
              <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`px-4 py-2 rounded-lg ${m.fromMe ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                {m.text}
              </motion.div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2 items-center">
          <input className="flex-1 p-2 border rounded" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." />
          <button onClick={send} className="btn-primary">Send</button>
        </div>
      </div>
    </div>
  );
}
