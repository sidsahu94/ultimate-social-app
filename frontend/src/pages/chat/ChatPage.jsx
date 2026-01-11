// frontend/src/pages/chat/ChatPage.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { useSelector } from "react-redux";
import { FaUsers, FaUserPlus, FaPaperPlane, FaTimes, FaSearch, FaImage, FaMicrophone } from 'react-icons/fa';
import UserAvatar from "../../components/ui/UserAvatar";
import CreateGroupModal from "../../components/chat/CreateGroupModal";
import NewChatModal from "../../components/chat/NewChatModal";
import { useToast } from "../../components/ui/ToastProvider";
import ChatBox from "../../components/chat/ChatBox";
import { useNavigate, useParams } from "react-router-dom";

export default function ChatPage() {
  const { id: paramChatId } = useParams();
  const navigate = useNavigate();

  const myId = useSelector(s => s.auth?.user?._id || localStorage.getItem('meId'));
  const [conversations, setConversations] = useState([]);
  const { add: addToast } = useToast();
  
  const [chatSearch, setChatSearch] = useState("");
  const [typingMap, setTypingMap] = useState({});
  const typingTimeouts = useRef({});

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
    
    // Live update when message received
    const onMsg = (payload) => {
        setConversations(prev => {
            // Find chat, update lastMessage, move to top
            const otherChats = prev.filter(c => c._id !== payload.chatId);
            const targetChat = prev.find(c => c._id === payload.chatId);
            
            if (targetChat) {
                // Update the existing chat object with new lastMessage
                const updatedChat = { 
                    ...targetChat, 
                    lastMessage: payload.message,
                    updatedAt: new Date().toISOString() 
                };
                return [updatedChat, ...otherChats];
            } else {
                // New chat created externally or not in list yet -> Reload list
                loadConversations(); 
                return prev;
            }
        });
    };

    socket.on('receiveMessage', onMsg);
    return () => socket.off('receiveMessage', onMsg);
  }, []);

  // --- Typing Logic ---
  useEffect(() => {
    const handleTyping = ({ chatId }) => {
        setTypingMap(prev => ({ ...prev, [chatId]: true }));
        if (typingTimeouts.current[chatId]) clearTimeout(typingTimeouts.current[chatId]);
        // Auto-clear typing status after 3s
        typingTimeouts.current[chatId] = setTimeout(() => {
            setTypingMap(prev => {
                const next = { ...prev };
                delete next[chatId];
                return next;
            });
        }, 3000);
    };
    
    socket.on('typing', handleTyping);
    return () => {
        socket.off('typing', handleTyping);
        Object.values(typingTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const activeChat = paramChatId 
    ? conversations.find(c => c._id === paramChatId) || { _id: paramChatId, temp: true } 
    : null;

  const startNewChat = async (targetUserId) => {
    try {
        const res = await API.post('/chat', { participants: [targetUserId] });
        const newConv = res.data;
        // Add new chat to top if not exists
        setConversations(prev => [newConv, ...prev.filter(c => c._id !== newConv._id)]);
        navigate(`/chat/${newConv._id}`);
    } catch (e) { addToast("Failed to start chat", { type: 'error' }); }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
        await API.delete(`/chat/${chatId}`);
        setConversations(prev => prev.filter(c => c._id !== chatId));
        if (paramChatId === chatId) navigate('/chat');
    } catch (e) { addToast("Failed to delete", { type: 'error' }); }
  };

  const getOther = (c) => {
      if (c.isGroup) return { name: c.name || 'Group Chat', avatar: null };
      return c.participants?.find(p => p._id !== myId) || { name: "User" };
  };

  const renderPreview = (c) => {
      const isTyping = typingMap[c._id];
      if (isTyping) return <span className="text-green-500 font-bold animate-pulse">Typing...</span>;
      
      const msg = c.lastMessage;
      if (!msg) return 'Start chatting';

      // Safe check: msg might be an ID string if population failed, or an object
      if (typeof msg === 'string') return 'Sent a message'; 

      if (msg.media) return <span className="flex items-center gap-1"><FaImage size={10} /> Photo</span>;
      if (msg.audio) return <span className="flex items-center gap-1"><FaMicrophone size={10} /> Voice</span>;
      
      const senderName = msg.sender?._id === myId ? 'You' : (msg.sender?.name?.split(' ')[0] || 'User');
      return <span className="truncate">{senderName}: {msg.content}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-140px)] md:h-[85vh] flex gap-4 relative">
        {/* Left Sidebar */}
        <div className={`w-full md:w-1/3 card flex flex-col ${paramChatId ? 'hidden md:flex' : 'flex'} bg-white dark:bg-gray-900 border dark:border-gray-800`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-3xl">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold text-xl">Chats</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowGroupModal(true)} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition"><FaUsers /></button>
                        <button onClick={() => setShowNewChat(true)} className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition"><FaUserPlus /></button>
                    </div>
                </div>
                <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input 
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-white dark:bg-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none border border-gray-200 dark:border-gray-600"
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {conversations.length === 0 && <div className="text-center text-gray-400 mt-10">No chats yet.</div>}
                
                {conversations
                    .filter(c => getOther(c).name.toLowerCase().includes(chatSearch.toLowerCase()))
                    .map(c => {
                        const other = getOther(c);
                        // Safe Map access
                        const isUnread = c.unread && c.unread[myId] > 0;
                        const isActive = paramChatId === c._id;

                        return (
                            <div 
                                key={c._id} 
                                onClick={() => navigate(`/chat/${c._id}`)} 
                                className={`group relative p-3 rounded-xl flex items-center gap-3 cursor-pointer transition ${isActive ? 'bg-indigo-500 text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <div className="relative">
                                    <UserAvatar src={other.avatar} name={other.name} userId={other._id} className="w-12 h-12" />
                                    {isUnread && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{other.name}</div>
                                    <div className={`text-xs truncate ${isActive ? 'text-indigo-100' : isUnread ? 'font-bold text-gray-800 dark:text-gray-200' : 'text-gray-500'}`}>
                                        {renderPreview(c)}
                                    </div>
                                </div>
                                <button onClick={(e) => deleteChat(c._id, e)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-2"><FaTimes size={12} /></button>
                            </div>
                        );
                })}
            </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 card flex flex-col ${!paramChatId ? 'hidden md:flex' : 'flex'} bg-white dark:bg-gray-900 overflow-hidden border dark:border-gray-800`}>
            {!activeChat ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
                    <FaPaperPlane size={30} className="opacity-30" />
                    <div>Select a chat to start messaging</div>
                </div>
            ) : (
                <ChatBox chatId={activeChat._id} onBack={() => navigate('/chat')} />
            )}
        </div>

        <CreateGroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} onCreated={loadConversations} />
        <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} onUserSelect={startNewChat} />
    </div>
  );
}