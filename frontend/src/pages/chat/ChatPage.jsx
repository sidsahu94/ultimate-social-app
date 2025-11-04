// frontend/src/pages/chat/ChatPage.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";

/**
 * Chat page that works with backend routes:
 *  GET /api/chat           -> list chats (existing)
 *  GET /api/chat/:chatId   -> get single chat with messages
 *  POST /api/chat/:chatId/message -> send message
 *
 * This component is resilient: if certain endpoints don't exist it falls
 * back to reading fields returned by the conversations list.
 */

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingChats(true);
      try {
        const r = await API.get("/chat");
        if (mounted && r?.data) setConversations(r.data);
      } catch (e) {
        // fallback to /conversations if /chat missing
        try {
          const r2 = await API.get("/conversations");
          if (mounted && r2?.data) setConversations(r2.data);
        } catch (err) {
          // ignore; UI will show "no conversations"
          console.warn("Failed to load chats", err);
        }
      } finally {
        setLoadingChats(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openConversation = async (conv) => {
    setActive(conv);
    // try to load the chat messages via GET /chat/:id
    try {
      const r = await API.get(`/chat/${conv._id}`);
      if (r?.data && Array.isArray(r.data.messages)) {
        setMessages(r.data.messages.map(m => ({ ...m, fromMe: String(m.sender) === (localStorage.getItem('meId') || '') })));
        return;
      }
    } catch (e) {
      // fallback - some frontends expect messages embedded on conversation object
      if (conv.messages) {
        setMessages(conv.messages.map(m => ({ ...m, fromMe: !!m.fromMe })));
        return;
      }
      // no messages
      setMessages([]);
    }
  };

  const send = async () => {
    if (!text.trim() || !active) return;
    const tempId = `tmp-${Date.now()}`;
    const payloadText = text;
    // optimistic update
    const tempMsg = { _id: tempId, content: payloadText, createdAt: new Date().toISOString(), fromMe: true, sender: localStorage.getItem('meId') || null };
    setMessages((m) => [...m, tempMsg]);
    setText("");

    try {
      // backend expects POST /chat/:chatId/message
      await API.post(`/chat/${active._id}/message`, { content: payloadText });
      // Optionally refresh messages for accurate server state:
      try {
        const r = await API.get(`/chat/${active._id}`);
        if (r?.data && Array.isArray(r.data.messages)) {
          setMessages(r.data.messages.map(m => ({ ...m, fromMe: String(m.sender) === (localStorage.getItem('meId') || '') })));
        }
      } catch (e) {
        // ignore refresh errors
      }
    } catch (err) {
      console.error("Failed to send message", err);
      // mark the temp message as failed in UI (optional)
      setMessages((arr) => arr.map(x => (x._id === tempId ? { ...x, failed: true } : x)));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[70vh]">
      <div className="lg:col-span-1 card p-3">
        <div className="font-semibold mb-2">Chats</div>
        {loadingChats ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <div className="text-gray-500">No conversations yet.</div>
            ) : (
              conversations.map((c) => {
                // compute display name: if chat schema uses participants array, try to show other user
                const other = c.participants?.find(p => String(p._id) !== (localStorage.getItem('meId') || '')) || c.with || c.withUser || {};
                const lastMsg = c.lastMessage || c.last || c.messages?.[c.messages.length - 1]?.content || '';
                return (
                  <motion.div
                    key={c._id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => openConversation(c)}
                    className={`p-2 rounded cursor-pointer ${active?._id === c._id ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={other?.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full" alt={other?.name} />
                      <div>
                        <div className="font-medium">{other?.name || c.name || "Conversation"}</div>
                        <div className="text-xs text-gray-500">{(lastMsg || "").slice(0, 40)}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 card p-3 flex flex-col">
        <div className="border-b pb-3 mb-3">
          <div className="font-semibold">{active ? (active.with?.name || active.name || (active.participants || []).map(p => p.name).join(', ')) : "Select a chat"}</div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 px-2">
          {messages.length === 0 ? (
            <div className="text-gray-400">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((m) => (
              <div key={m._id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] p-2 rounded ${m.fromMe ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  <div className="text-sm">{m.content || m.text}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {m.failed ? 'Failed to send • ' : ''}
                    {new Date(m.createdAt || m.updatedAt || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Write a message..." />
          <button onClick={send} className="btn-primary">Send</button>
        </div>
      </div>
    </div>
  );
}
