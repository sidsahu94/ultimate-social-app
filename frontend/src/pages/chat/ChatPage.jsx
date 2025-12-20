// frontend/src/pages/chat/ChatPage.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { useSelector } from "react-redux";
import { FaPaperPlane, FaArrowLeft, FaTimes, FaImage, FaUsers, FaUserPlus } from 'react-icons/fa';
import UserAvatar from "../../components/ui/UserAvatar";
import MessageBubble from "../../components/chat/MessageBubble";
import CreateGroupModal from "../../components/chat/CreateGroupModal";
import NewChatModal from "../../components/chat/NewChatModal";
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
  const fileInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    // Small timeout ensures DOM is rendered before scrolling
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // --- Socket Listeners ---
  useEffect(() => {
    const onReceive = (payload) => {
      if (!payload) return;
      
      // Check if message belongs to current chat
      // Note: payload structure depends on backend. Usually { chatId, message }
      const incomingChatId = payload.chatId || payload.room;
      
      if (active && incomingChatId === active._id) {
        setMessages(prev => {
            // Prevent duplicates
            if (prev.some(m => m._id === payload.message._id)) return prev;
            return [...prev, payload.message];
        });
        scrollToBottom();
      }
      
      // Always refresh conversation list order (to show unread dot or move to top)
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
    
    // Join the specific chat room
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
    if ((!text.trim() && !replyTo) || !active) return;
    
    const content = text;
    const currentReply = replyTo;
    setText("");
    setReplyTo(null);

    // 1. Optimistic Update (Immediate Show)
    const tempId = "temp-" + Date.now();
    const optimisticMsg = { 
        _id: tempId, 
        content, 
        sender: { _id: myId }, // Simplified sender for immediate render
        replyTo: currentReply, 
        createdAt: new Date().toISOString(),
        isOptimistic: true // Optional flag for styling (opacity)
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      // 2. Server Request
      const res = await API.post(`/chat/${active._id}/message`, { content, replyToId: currentReply?._id });
      const sentMsg = res.data.messages ? res.data.messages[res.data.messages.length - 1] : res.data; 
      
      // 3. Replace Optimistic Message with Real One
      setMessages(prev => prev.map(m => (m._id === tempId ? sentMsg : m)));
      
      // 4. Emit Socket (Redundancy, backend usually broadcasts too)
      const otherIds = (active.participants || []).map(p => p._id).filter(id => id !== myId);
      socket.emit('sendMessage', { toUserIds: otherIds, chatId: active._id, message: sentMsg });
      
    } catch (err) { 
        console.error(err);
        addToast("Failed to send message", { type: 'error' });
        // Remove optimistic message on fail
        setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  const startNewChat = async (targetUserId) => {
    try {
        const res = await API.post('/chat', { participants: [targetUserId] });
        const newConv = res.data;
        setConversations(prev => [newConv, ...prev.filter(c => c._id !== newConv._id)]);
        openConversation(newConv);
    } catch (e) { addToast("Failed to start chat", { type: 'error' }); }
  };

  const getOther = (c) => {
      if (c.isGroup) return { name: c.name || 'Group Chat', avatar: null, isGroup: true };
      return c.participants?.find(p => p._id !== myId) || { name: "User" };
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
                                </div>
                                <div className={`text-xs truncate ${active?._id === c._id ? 'text-indigo-100' : 'text-gray-500'}`}>
                                    {c.messages?.[c.messages.length - 1]?.content || 'Start chatting'}
                                </div>
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
                                isMe={String(m.sender?._id || m.sender) === String(myId)}
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

        <CreateGroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} onCreated={loadConversations} />
        <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} onUserSelect={startNewChat} />
    </div>
  );
}