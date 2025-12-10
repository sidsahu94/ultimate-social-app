// frontend/src/components/chat/ChatBox.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { useSelector } from "react-redux";
import { FaPaperPlane, FaArrowLeft } from "react-icons/fa";
import Spinner from "../common/Spinner";
import UserAvatar from "../ui/UserAvatar"; // See Fix #4

export default function ChatBox({ chatId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  
  const myId = useSelector((s) => s.auth.user?._id);
  const scrollRef = useRef();

  // Load Chat Data
  useEffect(() => {
    if (!chatId) return;
    setLoading(true);

    const loadData = async () => {
      try {
        const { data } = await API.get(`/chat/${chatId}`);
        setMessages(data.messages || []);
        
        // Find the "other" participant for header details
        const other = data.participants.find(p => p._id !== myId) || data.participants[0];
        setOtherUser(other);
      } catch (err) {
        console.error("Failed to load chat", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chatId, myId]);

  // Socket Listener for *this specific* chat
  useEffect(() => {
    const handleMsg = (payload) => {
      // payload structure: { chatId, message: { ... } }
      if (payload.chatId === chatId) {
        setMessages((prev) => [...prev, payload.message]);
      }
    };
    
    socket.on("receiveMessage", handleMsg);
    return () => socket.off("receiveMessage", handleMsg);
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const tempId = Date.now();
    const content = text;
    setText(""); // Clear input immediately

    // Optimistic Update
    const optimisticMsg = {
      _id: tempId,
      sender: { _id: myId }, // mocked sender object
      content: content,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { data } = await API.post(`/chat/${chatId}/message`, { content });
      
      // Replace optimistic message with real one
      setMessages((prev) => 
        prev.map((m) => (m._id === tempId ? data : m))
      );
      
      // Emit socket event so the other user sees it instantly
      // (Note: Backend usually handles the emit to the room, but if your backend 
      // expects client-to-client trigger, keep this. Based on your backend code, 
      // the backend emits 'receiveMessage' to participants inside sendMessage controller, 
      // so we might not strictly need to emit here, but it's safe.)
    } catch (err) {
      console.error("Send failed", err);
      // Remove optimistic message on fail
      setMessages((prev) => prev.filter(m => m._id !== tempId));
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b dark:border-gray-700 flex items-center gap-3 bg-gray-50 dark:bg-gray-800">
        {onBack && (
          <button onClick={onBack} className="md:hidden text-gray-600">
            <FaArrowLeft />
          </button>
        )}
        <UserAvatar src={otherUser?.avatar} name={otherUser?.name} className="w-10 h-10" />
        <div>
          <h3 className="font-bold text-sm md:text-base">{otherUser?.name || "Chat"}</h3>
          {otherUser?.isVerified && <span className="text-[10px] text-blue-500">Verified</span>}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-black/20">
        {messages.map((m, i) => {
          const isMe = (m.sender?._id || m.sender) === myId;
          return (
            <div key={m._id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm rounded-bl-none"
                } ${m.isOptimistic ? "opacity-70" : "opacity-100"}`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-3 bg-indigo-600 text-white rounded-full disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}