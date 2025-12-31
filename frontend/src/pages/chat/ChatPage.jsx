import React, { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { useSelector } from "react-redux";
import { FaUsers, FaUserPlus, FaPaperPlane, FaTimes, FaSearch } from 'react-icons/fa';
import UserAvatar from "../../components/ui/UserAvatar";
import CreateGroupModal from "../../components/chat/CreateGroupModal";
import NewChatModal from "../../components/chat/NewChatModal";
import { useToast } from "../../components/ui/ToastProvider";
import ChatBox from "../../components/chat/ChatBox";
import { useNavigate, useParams } from "react-router-dom";

export default function ChatPage() {
  const { id: paramChatId } = useParams(); // Get ID from URL
  const navigate = useNavigate();

  const myId = useSelector(s => s.auth?.user?._id || localStorage.getItem('meId'));
  const [conversations, setConversations] = useState([]);
  const { add: addToast } = useToast();
  
  // Search State
  const [chatSearch, setChatSearch] = useState("");

  // 🔥 Typing Status State & Refs
  const [typingMap, setTypingMap] = useState({});
  const typingTimeouts = useRef({}); // Store timeouts per chatId to prevent flickering

  // Modals
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // --- Load Conversations ---
  const loadConversations = async () => {
    try {
      const r = await API.get("/chat");
      setConversations(r.data || []);
    } catch (err) { console.warn(err); }
  };

  useEffect(() => { 
    loadConversations();
    
    // Listen for incoming messages to re-order the sidebar list
    const onMsg = () => loadConversations();
    socket.on('receiveMessage', onMsg);
    return () => socket.off('receiveMessage', onMsg);
  }, []);

  // 🔥 Track Typing Globally (Debounced Fix)
  useEffect(() => {
    const handleTyping = ({ chatId }) => {
        // 1. Set typing status immediately
        setTypingMap(prev => ({ ...prev, [chatId]: true }));
        
        // 2. Clear any existing timeout for this specific chat
        if (typingTimeouts.current[chatId]) {
            clearTimeout(typingTimeouts.current[chatId]);
        }

        // 3. Set new timeout to clear status after 3 seconds of silence
        typingTimeouts.current[chatId] = setTimeout(() => {
            setTypingMap(prev => {
                const next = { ...prev };
                delete next[chatId]; // Cleanup
                return next;
            });
        }, 3000);
    };
    
    // Optional: handleStop event if backend sends 'stopTyping'
    const handleStop = ({ chatId }) => { 
        if (typingTimeouts.current[chatId]) clearTimeout(typingTimeouts.current[chatId]);
        setTypingMap(prev => ({ ...prev, [chatId]: false }));
    };

    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStop);

    return () => {
        socket.off('typing', handleTyping);
        socket.off('stopTyping', handleStop);
        // Cleanup all timeouts on unmount
        Object.values(typingTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // If URL has an ID, find that chat or create a temp object if loading
  const activeChat = paramChatId 
    ? conversations.find(c => c._id === paramChatId) || { _id: paramChatId, temp: true } 
    : null;

  const startNewChat = async (targetUserId) => {
    try {
        const res = await API.post('/chat', { participants: [targetUserId] });
        const newConv = res.data;
        setConversations(prev => [newConv, ...prev.filter(c => c._id !== newConv._id)]);
        navigate(`/chat/${newConv._id}`);
    } catch (e) { addToast("Failed to start chat", { type: 'error' }); }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    try {
        await API.delete(`/chat/${chatId}`);
        setConversations(prev => prev.filter(c => c._id !== chatId));
        
        if (paramChatId === chatId) {
            navigate('/chat');
        }
        addToast("Chat deleted", { type: 'info' });
    } catch (e) {
        addToast("Failed to delete chat", { type: 'error' });
    }
  };

  const getOther = (c) => {
      if (c.isGroup) return { name: c.name || 'Group Chat', avatar: null, isGroup: true };
      return c.participants?.find(p => p._id !== myId) || { name: "User" };
  };

  return (
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-140px)] md:h-[85vh] flex gap-4 relative">
        {/* Left Sidebar - Hidden on mobile if a chat is active (paramChatId exists) */}
        <div className={`w-full md:w-1/3 card flex flex-col ${paramChatId ? 'hidden md:flex' : 'flex'} bg-white dark:bg-gray-900 border dark:border-gray-800`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-3xl">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold text-xl">Chats</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowGroupModal(true)} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition" title="New Group">
                            <FaUsers />
                        </button>
                        <button onClick={() => setShowNewChat(true)} className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition" title="New Message">
                            <FaUserPlus />
                        </button>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input 
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full bg-white dark:bg-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition border border-gray-200 dark:border-gray-600"
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {conversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                        <FaPaperPlane className="mb-2 text-2xl opacity-20" />
                        No chats yet. Start one!
                    </div>
                )}
                
                {conversations
                    .filter(c => {
                        const name = getOther(c).name || "";
                        return name.toLowerCase().includes(chatSearch.toLowerCase());
                    })
                    .map(c => {
                        const other = getOther(c);
                        const isUnread = c.unread && c.unread[myId] > 0;
                        const isActive = paramChatId === c._id;
                        const isTyping = typingMap[c._id]; // 🔥 Check typing status

                        return (
                            <div 
                                key={c._id} 
                                onClick={() => navigate(`/chat/${c._id}`)} 
                                className={`group relative p-3 rounded-xl flex items-center gap-3 cursor-pointer transition ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <div className="relative">
                                    <UserAvatar src={other.avatar} name={other.name} userId={other._id} className="w-12 h-12" />
                                    {isUnread && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{other.name}</div>
                                    <div className={`text-xs truncate ${isActive ? 'text-indigo-100' : isUnread ? 'font-bold text-gray-800 dark:text-gray-200' : 'text-gray-500'}`}>
                                        {/* 🔥 Show Typing Indicator or Last Message */}
                                        {isTyping ? (
                                            <span className="text-green-500 font-bold animate-pulse">Typing...</span>
                                        ) : (
                                            c.messages?.[c.messages.length - 1]?.content || 'Start chatting'
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={(e) => deleteChat(c._id, e)}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ${isActive ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    title="Delete Chat"
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        );
                })}
            </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 card flex flex-col ${!paramChatId ? 'hidden md:flex' : 'flex'} bg-white dark:bg-gray-900 overflow-hidden border dark:border-gray-800`}>
            {!activeChat ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <FaPaperPlane size={30} className="opacity-30" />
                    </div>
                    <div className="font-medium">Select a chat to start messaging</div>
                </div>
            ) : (
                <ChatBox 
                    chatId={activeChat._id} 
                    onBack={() => navigate('/chat')} 
                />
            )}
        </div>

        <CreateGroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} onCreated={loadConversations} />
        <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} onUserSelect={startNewChat} />
    </div>
  );
}