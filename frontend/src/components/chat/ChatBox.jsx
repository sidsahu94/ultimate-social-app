// frontend/src/components/chat/ChatBox.jsx
import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { useSelector } from "react-redux";
import { 
  FaPaperPlane, FaArrowLeft, FaImage, FaTimes, FaVideo, FaPen, 
  FaArrowDown, FaSearch, FaChevronUp, FaChevronDown 
} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import Spinner from "../common/Spinner";
import UserAvatar from "../ui/UserAvatar";
import MessageBubble from "./MessageBubble";
import AudioRecorder from "./AudioRecorder";
import Lightbox from "../ui/Lightbox";
import ForwardModal from "./ForwardModal";
import PinnedMessage from "./PinnedMessage";
import { useToast } from "../ui/ToastProvider";
import { encryptMessage } from '../../utils/security';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatBox({ chatId, onBack }) {
  const { add: addToast } = useToast();
  const myId = useSelector((s) => s.auth.user?._id);
  const navigate = useNavigate();

  // --- STATE ---
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Inputs
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Interaction
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [pinnedIds, setPinnedIds] = useState([]); 
  const [forwardMsg, setForwardMsg] = useState(null); 

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);

  // UI
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false); // 🔥 NEW STATE

  // Refs
  const scrollRef = useRef();
  const containerRef = useRef();
  const previousScrollHeight = useRef(0);
  const typingTimeoutRef = useRef(null);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    setMessages([]);
    setReplyingTo(null);
    setEditingMsg(null);
    setPinnedIds([]);
    setText("");
    setShowSearch(false);
    setSearchResults([]);
    setShowNewMsgBtn(false);

    const loadData = async () => {
      try {
        const { data } = await API.get(`/chat/${chatId}`);
        setMessages(data.messages || []);
        setPinnedIds(data.pinnedMessages || []);
        
        const other = data.participants.find(p => p._id !== myId) || data.participants[0];
        setOtherUser(other);

        API.post(`/chat/${chatId}/read`).catch(() => {});
      } catch (err) {
        console.error("Failed to load chat", err);
        if (onBack) onBack(); 
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chatId, myId]);

  // --- 2. PAGINATION ---
  const loadOlderMessages = async () => {
    if (messages.length === 0 || loadingMore) return;
    
    if (containerRef.current) {
        previousScrollHeight.current = containerRef.current.scrollHeight;
    }

    const oldestMsg = messages[0];
    setLoadingMore(true);
    
    try {
      const res = await API.get(`/chat/${chatId}/messages?before=${oldestMsg.createdAt}`);
      if (res.data.length > 0) {
        setMessages(prev => [...res.data, ...prev]);
      }
    } catch (e) {
      console.error("History load error", e);
    } finally {
      setLoadingMore(false);
    }
  };

  useLayoutEffect(() => {
    if (!loadingMore && previousScrollHeight.current > 0 && containerRef.current) {
        const newScrollHeight = containerRef.current.scrollHeight;
        containerRef.current.scrollTop = newScrollHeight - previousScrollHeight.current;
        previousScrollHeight.current = 0;
    }
  }, [messages, loadingMore]);

  // --- 3. SOCKET LISTENERS ---
  useEffect(() => {
    if(!chatId) return;
    
    socket.emit('joinRoom', { room: chatId });

    const handleMsg = (payload) => {
      if (payload.chatId === chatId) {
        setMessages((prev) => {
            const exists = prev.some(m => m._id === payload.message._id);
            if (exists) return prev; 
            return [...prev, payload.message];
        });
        
        setIsTyping(false);

        const el = containerRef.current;
        // Check if user is near bottom
        const isNearBottom = el && el.scrollHeight - el.scrollTop - el.clientHeight < 200;

        if (isNearBottom) {
            setTimeout(scrollToBottom, 100);
            API.post(`/chat/${chatId}/read`).catch(() => {});
        } else {
            // User is reading old messages, don't auto-scroll, SHOW BUTTON
            setShowNewMsgBtn(true);
        }
      }
    };

    const handleUpdate = (payload) => {
        if (payload.chatId === chatId) {
            setMessages(prev => prev.map(m => 
                m._id === payload.messageId 
                    ? { 
                        ...m, 
                        content: payload.newContent || m.content, 
                        pollOptions: payload.pollOptions || m.pollOptions,
                        editedAt: payload.editedAt || m.editedAt
                      } 
                    : m
            ));
        }
    };

    const handlePin = ({ pinnedMessages }) => setPinnedIds(pinnedMessages);

    const onTyping = (data) => {
        if (data.chatId === chatId && data.userId !== myId) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000); 
        }
    };

    socket.on("receiveMessage", handleMsg);
    socket.on("message:updated", handleUpdate);
    socket.on("chat:pinned", handlePin);
    socket.on("typing", onTyping);

    return () => {
        socket.emit('leaveRoom', { room: chatId });
        socket.off("receiveMessage", handleMsg);
        socket.off("message:updated", handleUpdate);
        socket.off("chat:pinned", handlePin);
        socket.off("typing", onTyping);
    };
  }, [chatId, myId]);

  // --- 4. ACTIONS & UTILS ---
  const scrollToBottom = () => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowNewMsgBtn(false); // Hide button on scroll down
  };

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom();
  }, [loading, chatId]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Show standard "Scroll Down" arrow if far up
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
    
    // Auto-hide "New Message" badge if user manually scrolls to bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
        setShowNewMsgBtn(false);
    }
    
    if (scrollTop === 0 && !loadingMore && messages.length >= 20) loadOlderMessages();
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { chatId });
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  const handleSearch = async (e) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      try {
          const res = await API.get(`/chat/${chatId}/search?q=${searchQuery}`);
          setSearchResults(res.data);
          setSearchIndex(0);
          if (res.data.length > 0) {
              const el = document.getElementById(`msg-${res.data[0]._id}`);
              if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
              addToast("No results found", { type: 'info' });
          }
      } catch(e) { }
  };

  const nextResult = () => {
      if (searchResults.length === 0) return;
      const nextIdx = (searchIndex + 1) % searchResults.length;
      setSearchIndex(nextIdx);
      const el = document.getElementById(`msg-${searchResults[nextIdx]._id}`);
      if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleReply = (msg) => {
      setReplyingTo(msg);
      setEditingMsg(null);
      document.getElementById('chat-input')?.focus();
  };

  const handleEdit = (msg) => {
      setEditingMsg(msg);
      setReplyingTo(null);
      setText(msg.content);
      document.getElementById('chat-input')?.focus();
  };

  const handleForward = (msg) => setForwardMsg(msg);

  const handlePinAction = async (msgId) => {
      try { await API.put(`/chat/${chatId}/pin/${msgId}`); } 
      catch(e) { console.error(e); }
  };

  const cancelAction = () => {
      setReplyingTo(null);
      setEditingMsg(null);
      setText("");
      setFile(null);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !file) return;

    if (editingMsg) {
        try {
            await API.put(`/chat/${chatId}/message/${editingMsg._id}`, { newContent: text });
            setMessages(prev => prev.map(m => m._id === editingMsg._id ? { ...m, content: text, editedAt: Date.now() } : m));
            cancelAction();
        } catch (e) { console.error(e); }
        return;
    }

    try {
        let mediaUrl = null;
        if (file) {
            setIsUploading(true);
            const fd = new FormData(); fd.append('media', file);
            const res = await API.post('/extra/upload', fd, {
                onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total))
            });
            mediaUrl = res.data.url;
            setIsUploading(false); setUploadProgress(0);
        }

        const payload = { 
            content: encryptMessage(text), 
            media: mediaUrl,
            isEncrypted: true 
        };
        
        if (replyingTo) payload.replyTo = replyingTo._id;

        const { data } = await API.post(`/chat/${chatId}/message`, payload);
        
        setMessages(prev => {
             const exists = prev.some(m => m._id === data._id);
             if (exists) return prev;
             return [...prev, { ...data, replyTo: replyingTo }];
        });
        
        cancelAction();
        setTimeout(scrollToBottom, 100);
    } catch (err) { 
        console.error("Send failed", err);
        setIsUploading(false); 
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black relative">
      
      {/* HEADER */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-white dark:bg-gray-900 border-b dark:border-gray-800 z-30 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
            {onBack && <button onClick={onBack} className="md:hidden text-gray-600 dark:text-gray-300"><FaArrowLeft /></button>}
            <UserAvatar src={otherUser?.avatar} name={otherUser?.name} userId={otherUser?._id} className="w-9 h-9" />
            
            <div className="flex flex-col">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-none">{otherUser?.name || "Chat"}</h3>
              <div className="h-3 mt-1">
                  {isTyping ? (
                      <span className="text-[10px] text-indigo-500 font-bold animate-pulse">Typing...</span>
                  ) : (
                      <div className="flex items-center gap-2">
                          {otherUser?.isVerified && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded font-bold">Verified</span>}
                          {otherUser?.userStatus && <span className="text-[10px] text-green-600 dark:text-green-400">{otherUser.userStatus}</span>}
                      </div>
                  )}
              </div>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                <FaSearch />
            </button>
            <button onClick={() => navigate(`/chat/call/${chatId}`)} className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 transition">
                <FaVideo size={14} />
            </button>
        </div>
      </div>

      {/* SEARCH BAR OVERLAY */}
      {showSearch && (
          <div className="bg-white dark:bg-gray-800 p-2 border-b dark:border-gray-700 flex items-center gap-2 animate-slide-down z-20">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <input 
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Find in chat..."
                    className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg text-sm outline-none dark:text-white"
                  />
                  <button type="submit" className="text-sm font-bold text-indigo-500">Find</button>
              </form>
              {searchResults.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>{searchIndex + 1}/{searchResults.length}</span>
                      <button onClick={nextResult} className="p-1 hover:bg-gray-200 rounded"><FaChevronDown/></button>
                      <button onClick={() => setSearchIndex(Math.max(0, searchIndex-1))} className="p-1 hover:bg-gray-200 rounded"><FaChevronUp/></button>
                  </div>
              )}
              <button onClick={() => { setShowSearch(false); setSearchResults([]); }} className="text-gray-400 hover:text-red-500"><FaTimes/></button>
          </div>
      )}

      {/* PINNED MESSAGES */}
      <div className="z-20">
        <PinnedMessage messages={messages.filter(m => pinnedIds.includes(m._id))} onUnpin={handlePinAction} />
      </div>

      {/* MESSAGES LIST */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-white/50 dark:bg-transparent"
        onScroll={handleScroll}
      >
        {loadingMore && <div className="text-center text-xs text-gray-400 py-2">Loading older messages...</div>}
        
        {messages.map((m, i) => (
          <div id={`msg-${m._id}`} key={m._id || i}>
            <MessageBubble 
                message={m} 
                isMe={(m.sender?._id || m.sender) === myId} 
                onReply={handleReply} 
                onEdit={handleEdit} 
                onForward={handleForward} 
                onPin={handlePinAction} 
                onDelete={() => {/* stub */}} 
                onMediaLoad={() => scrollToBottom()} 
            />
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* 🔥 NEW MESSAGE BUTTON */}
      <AnimatePresence>
        {showNewMsgBtn && (
           <motion.button 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 20, opacity: 0 }}
             onClick={scrollToBottom} 
             className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg border border-white/20 z-40 flex items-center gap-2 text-sm font-bold"
           >
             <FaArrowDown /> New Message
           </motion.button>
        )}
      </AnimatePresence>

      {/* Standard Scroll Btn (only shows if scrolled up but no new msg) */}
      {showScrollBtn && !showNewMsgBtn && (
        <button onClick={scrollToBottom} className="absolute bottom-20 right-6 bg-white dark:bg-gray-800 text-indigo-600 p-3 rounded-full shadow-lg border dark:border-gray-700 z-40 animate-bounce">
            <FaArrowDown />
        </button>
      )}

      {/* INPUT AREA */}
      <div className="p-3 bg-white dark:bg-gray-900 border-t dark:border-gray-800 z-30 flex-shrink-0">
        
        {(replyingTo || editingMsg) && (
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-t-xl border-l-4 border-indigo-500 mb-2">
                <div className="text-xs px-2 flex-1 dark:text-gray-300">
                    <span className="font-bold text-indigo-500 block">{editingMsg ? "Editing Message" : `Replying to ${replyingTo.sender?.name}`}</span>
                    <span className="truncate opacity-70">{editingMsg ? "" : replyingTo.content}</span>
                </div>
                <button onClick={cancelAction}><FaTimes size={12}/></button>
            </div>
        )}

        {file && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg w-full max-w-xs border border-indigo-100 dark:border-indigo-900">
                <div className="relative w-10 h-10 flex-shrink-0">
                    {isUploading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-full border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <FaImage className="text-indigo-500 w-full h-full p-2"/>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1 dark:text-gray-300">
                        <span className="truncate font-medium">{file.name}</span>
                        {isUploading && <span className="text-indigo-500 font-bold">{uploadProgress}%</span>}
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-200" style={{ width: `${isUploading ? uploadProgress : 0}%` }} />
                    </div>
                </div>
                {!isUploading && (
                    <button onClick={() => setFile(null)} className="text-red-500 hover:bg-red-100 p-1 rounded-full"><FaTimes/></button>
                )}
            </div>
        )}

        <div className="flex gap-2 items-end">
            <label className="text-gray-400 hover:text-indigo-500 cursor-pointer p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <FaImage size={20} />
                <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            
            <div className="pb-1"><AudioRecorder chatId={chatId} /></div>
            
            <textarea
                id="chat-input"
                value={text}
                onChange={handleTyping}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none max-h-32 custom-scrollbar transition-all placeholder-gray-400"
                rows={1}
                style={{ minHeight: '44px' }}
            />
            
            <button onClick={sendMessage} disabled={(!text.trim() && !file) || isUploading} className={`p-3 rounded-full text-white shadow-md flex-shrink-0 transition-all ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}>
                <FaPaperPlane size={16} />
            </button>
        </div>
      </div>

      <ForwardModal isOpen={!!forwardMsg} onClose={() => setForwardMsg(null)} message={forwardMsg} />
      <Lightbox open={!!lightboxSrc} index={0} images={[lightboxSrc]} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}