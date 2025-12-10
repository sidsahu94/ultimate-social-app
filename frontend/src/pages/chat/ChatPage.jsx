import React, { useEffect, useState, useRef, useCallback } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { useSelector } from "react-redux";
import { FaPlus, FaSearch, FaPaperPlane, FaArrowLeft, FaTimes, FaImage, FaUsers, FaUserPlus } from 'react-icons/fa';
import UserAvatar from "../../components/ui/UserAvatar";
import MessageBubble from "../../components/chat/MessageBubble";
import CreateGroupModal from "../../components/chat/CreateGroupModal";
import NewChatModal from "../../components/chat/NewChatModal"; // New Import
import { useToast } from "../../components/ui/ToastProvider";

export default function ChatPage() {
  const myId = useSelector(s => s.auth?.user?._id || localStorage.getItem('meId'));
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const { add: addToast } = useToast();
  
  // Modals
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Logic
  const [replyTo, setReplyTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false); 
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null); // For image uploads

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // --- Socket Listeners ---
  useEffect(() => {
    const onReceive = (payload) => {
      if (!payload) return;
      if (active && payload.chatId === active._id) {
        setMessages(prev => [...prev, payload.message]);
        scrollToBottom();
      }
      loadConversations();
    };

    const onTyping = ({ chatId, fromUser }) => {
        if (active && active._id === chatId && fromUser !== myId) setIsTyping(true);
    };
    
    const onStopTyping = () => setIsTyping(false);

    socket.on('receiveMessage', onReceive);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);

    return () => { 
        socket.off('receiveMessage', onReceive); 
        socket.off('typing', onTyping);
        socket.off('stopTyping', onStopTyping);
    };
  }, [active, myId, scrollToBottom]);

  const loadConversations = async () => {
    try {
      const r = await API.get("/chat");
      setConversations(r.data || []);
    } catch (err) { console.warn(err); }
  };

  useEffect(() => { loadConversations(); }, []);

  const openConversation = async (conv) => {
    if (active) socket.emit('leaveRoom', { room: active._id });
    setActive(conv);
    setIsTyping(false);
    setReplyTo(null);
    if (conv && conv._id) socket.emit('joinRoom', { room: conv._id });

    try {
      const r = await API.get(`/chat/${conv._id}`);
      setMessages(r.data.messages || []);
      scrollToBottom();
    } catch (e) { console.warn(e); }
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (active) {
        const other = active.participants?.find(p => p._id !== myId);
        if (other) {
            socket.emit('typing', { chatId: active._id, toUserId: other._id, fromUser: myId });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', { toUserId: other._id });
            }, 2000);
        }
    }
  };

  const send = async () => {
    if ((!text.trim() && !replyTo) || !active) return; // Allow sending just reply context or ensure text
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    const content = text;
    const currentReply = replyTo;
    setText("");
    setReplyTo(null);

    const temp = { 
        _id: String(Date.now()), 
        content, 
        sender: { _id: myId }, // mocked structure for UI
        replyTo: currentReply, 
        createdAt: new Date().toISOString() 
    };
    setMessages(m => [...m, temp]);
    scrollToBottom();

    try {
      const res = await API.post(`/chat/${active._id}/message`, { content, replyToId: currentReply?._id });
      const sentMsg = res.data; // Server response with populated sender
      
      const otherIds = (active.participants || []).map(p => p._id).filter(id => id !== myId);
      socket.emit('sendMessage', { toUserIds: otherIds, chatId: active._id, message: sentMsg });
      
      // Update optimistic message with real one
      setMessages(prev => prev.map(m => (m._id === temp._id ? sentMsg : m)));
    } catch (err) { console.error(err); }
  };

  const startNewChat = async (targetUserId) => {
    try {
        const res = await API.post('/chat', { participants: [targetUserId] });
        const newConv = res.data;
        setConversations(prev => [newConv, ...prev.filter(c => c._id !== newConv._id)]);
        openConversation(newConv);
    } catch (e) { addToast("Failed to start chat", { type: 'error' }); }
  };

  // --- NEW: Handle Image Upload ---
  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file || !active) return;
      
      // Optimistic message for image
      const tempId = String(Date.now());
      setMessages(prev => [...prev, { _id: tempId, content: '📷 Sending Image...', sender: { _id: myId }, createdAt: new Date().toISOString() }]);
      scrollToBottom();

      try {
          // Ideally use a dedicated endpoint or generic upload. Using posts upload as fallback or similar.
          // Assuming backend/routes/extra.js has generic upload or we use a FormData approach on message endpoint if supported.
          // Let's assume we use the existing /extra/voice logic but adapted, or create a quick post media logic.
          // Better: Use `CreatePost` logic to get URL, then send message. 
          // For now, simpler simulation:
          const fd = new FormData();
          fd.append('media', file); // Reuse story/post upload logic if endpoint supports it
          // NOTE: Backend needs to support media in message endpoint or separate upload
          // Since we don't have a dedicated chat upload route in previous backend code, 
          // we will use the existing /api/posts route to "hijack" the upload utility if needed, 
          // OR better, create a simple upload endpoint in future.
          // Using a placeholder alert for now to prevent crash if backend isn't ready.
          alert("Image upload requires backend update for 'chat/upload'. Text works perfectly.");
          setMessages(prev => prev.filter(m => m._id !== tempId));
      } catch (err) {
          setMessages(prev => prev.filter(m => m._id !== tempId));
      }
  };

  const getOther = (c) => {
      if (c.isGroup) return { name: c.name || 'Group Chat', avatar: null, isGroup: true };
      return c.participants?.find(p => p._id !== myId) || {};
  };

  return (
    <div className="max-w-6xl mx-auto p-4 h-[85vh] flex gap-4 relative">
        {/* Left Sidebar */}
        <div className={`w-full md:w-1/3 card flex flex-col ${active ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="font-bold text-xl">Chats</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowGroupModal(true)} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200" title="New Group">
                        <FaUsers />
                    </button>
                    <button onClick={() => setShowNewChat(true)} className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200" title="New Message">
                        <FaUserPlus />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {conversations.map(c => {
                    const other = getOther(c);
                    return (
                        <div key={c._id} onClick={() => openConversation(c)} className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition ${active?._id === c._id ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            <UserAvatar src={other.avatar} name={other.name} className="w-12 h-12" />
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate flex items-center gap-2">
                                    {other.name}
                                    {/* Online Indicator (Simulated) */}
                                    {!other.isGroup && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                </div>
                                <div className={`text-xs truncate ${active?._id === c._id ? 'text-indigo-100' : 'text-gray-500'}`}>{c.lastMessage?.content || 'Start chatting'}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 card flex flex-col ${!active ? 'hidden md:flex' : 'flex'} bg-white dark:bg-gray-900`}>
            {!active ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
                    <FaPaperPlane size={40} className="opacity-20" />
                    <div>Select a chat or start a new one</div>
                </div>
            ) : (
                <>
                    <div className="p-3 border-b dark:border-gray-700 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
                        <button onClick={() => setActive(null)} className="md:hidden p-2"><FaArrowLeft /></button>
                        <UserAvatar src={getOther(active).avatar} name={getOther(active).name} />
                        <div>
                            <div className="font-bold flex items-center gap-2">
                                {getOther(active).name}
                                {isTyping && <span className="text-xs text-indigo-500 font-normal animate-pulse">typing...</span>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 dark:bg-black/20">
                        {messages.map((m, i) => (
                            <MessageBubble 
                                key={m._id || i}
                                message={m}
                                isMe={m.sender === myId || m.sender?._id === myId}
                                onReply={(msg) => setReplyTo(msg)}
                                onDelete={() => {}} 
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {replyTo && (
                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700 flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                            <div className="border-l-2 border-indigo-500 pl-2">Replying to: <b>{replyTo.content?.slice(0, 50)}...</b></div>
                            <button onClick={() => setReplyTo(null)} className="text-red-500"><FaTimes /></button>
                        </div>
                    )}

                    <div className="p-3 border-t dark:border-gray-700 flex gap-2 items-center">
                        <button className="text-gray-400 hover:text-indigo-500 p-2" onClick={() => fileInputRef.current.click()}>
                            <FaImage size={20} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        
                        <input 
                            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 focus:outline-none"
                            placeholder="Type a message..."
                            value={text}
                            onChange={handleInputChange}
                            onKeyPress={e => e.key === 'Enter' && send()}
                        />
                        <button onClick={send} className="btn-primary p-3 rounded-full shadow-lg"><FaPaperPlane /></button>
                    </div>
                </>
            )}
        </div>

        {/* Modals */}
        <CreateGroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} onCreated={loadConversations} />
        <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} onUserSelect={startNewChat} />
    </div>
  );
}