import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { useSelector } from "react-redux";
import { FaPaperPlane, FaArrowLeft, FaImage, FaTimes, FaVideo, FaPen, FaArrowDown } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import Spinner from "../common/Spinner";
import UserAvatar from "../ui/UserAvatar";
import MessageBubble from "./MessageBubble";
import AudioRecorder from "./AudioRecorder";
import Lightbox from "../ui/Lightbox";
import ForwardModal from "./ForwardModal";
import PinnedMessage from "./PinnedMessage";

export default function ChatBox({ chatId, onBack }) {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  
  // Interaction State
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [pinnedIds, setPinnedIds] = useState([]); 
  const [forwardMsg, setForwardMsg] = useState(null); 

  // UI State
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const myId = useSelector((s) => s.auth.user?._id);
  const scrollRef = useRef();
  const containerRef = useRef();
  const previousScrollHeight = useRef(0);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    setMessages([]);
    setReplyingTo(null);
    setEditingMsg(null);
    setPinnedIds([]);
    setText("");

    const loadData = async () => {
      try {
        const { data } = await API.get(`/chat/${chatId}`);
        setMessages(data.messages || []);
        setPinnedIds(data.pinnedMessages || []);
        
        const other = data.participants.find(p => p._id !== myId) || data.participants[0];
        setOtherUser(other);

        // Mark as Read immediately
        API.post(`/chat/extras/${chatId}/read`).catch(() => {});
        
      } catch (err) {
        console.error("Failed to load chat", err);
        if (onBack) onBack(); // Handle navigation failure gracefully
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chatId, myId]);

  // --- 2. PAGINATION ---
  const loadOlderMessages = async () => {
    if (messages.length === 0 || loadingMore) return;
    
    // Capture scroll height before loading to maintain position
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

  // --- 3. REAL-TIME SOCKETS ---
  useEffect(() => {
    socket.emit('joinRoom', { room: chatId });

    // New Message Listener with Deduplication
    const handleMsg = (payload) => {
      if (payload.chatId === chatId) {
        setMessages((prev) => {
            // 🔥 CRITICAL FIX: Check if message ID already exists before adding
            const exists = prev.some(m => m._id === payload.message._id);
            if (exists) return prev; 
            
            return [...prev, payload.message];
        });
        
        // Auto-scroll logic
        const el = containerRef.current;
        if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
            setTimeout(scrollToBottom, 100);
            API.post(`/chat/extras/${chatId}/read`).catch(() => {});
        } else {
            setShowScrollBtn(true);
        }
      }
    };

    // Message Edited Listener
    const handleUpdate = (payload) => {
        if (payload.chatId === chatId) {
            setMessages(prev => prev.map(m => 
                m._id === payload.messageId 
                    ? { ...m, content: payload.newContent, editedAt: payload.editedAt } 
                    : m
            ));
        }
    };

    // Chat Pinned Listener
    const handlePin = ({ pinnedMessages }) => {
        setPinnedIds(pinnedMessages);
    };

    // Read Receipt Listener
    const handleRead = ({ chatId: eventChatId, userId }) => {
        if (eventChatId === chatId) {
            setMessages(prev => prev.map(m => {
                if ((m.sender === myId || m.sender?._id === myId) && !m.seenBy.includes(userId)) {
                    return { ...m, seenBy: [...(m.seenBy || []), userId] };
                }
                return m;
            }));
        }
    };

    socket.on("receiveMessage", handleMsg);
    socket.on("message:updated", handleUpdate);
    socket.on("message:read", handleRead);
    socket.on("chat:pinned", handlePin);

    return () => {
        socket.emit('leaveRoom', { room: chatId });
        socket.off("receiveMessage", handleMsg);
        socket.off("message:updated", handleUpdate);
        socket.off("message:read", handleRead);
        socket.off("chat:pinned", handlePin);
    };
  }, [chatId, myId]);

  // --- 4. SCROLL HANDLING ---
  const scrollToBottom = () => scrollRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom();
  }, [loading, chatId]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
  };

  // --- 5. ACTIONS ---
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

  const handlePin = async (msgId) => {
      try {
          await API.put(`/chat/${chatId}/pin/${msgId}`);
      } catch(e) { console.error(e); }
  };

  const handleForward = (msg) => setForwardMsg(msg);

  const cancelAction = () => {
      setReplyingTo(null);
      setEditingMsg(null);
      setText("");
      setFile(null);
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { chatId });
    typingTimeoutRef.current = setTimeout(() => {
        // Optional: socket.emit('stopTyping');
    }, 2000);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !file) return;

    // Handle Edit
    if (editingMsg) {
        try {
            await API.put(`/chat/${chatId}/message/${editingMsg._id}`, { newContent: text });
            // Optimistic update
            setMessages(prev => prev.map(m => m._id === editingMsg._id ? { ...m, content: text, editedAt: Date.now() } : m));
            cancelAction();
        } catch (e) { console.error("Edit failed", e); }
        return;
    }

    // Handle New Message
    try {
        let mediaUrl = null;
        if (file) {
            const fd = new FormData(); fd.append('media', file);
            mediaUrl = (await API.post('/extra/upload', fd)).data.url;
        }

        const payload = { content: text, media: mediaUrl };
        if (replyingTo) payload.replyTo = replyingTo._id;

        const { data } = await API.post(`/chat/${chatId}/message`, payload);
        
        // Optimistic append with Deduplication Check
        const newMsg = { ...data, replyTo: replyingTo }; 
        setMessages(prev => {
             const exists = prev.some(m => m._id === newMsg._id);
             if (exists) return prev;
             return [...prev, newMsg];
        });
        
        cancelAction();
        setTimeout(scrollToBottom, 100);
    } catch (err) { console.error("Send failed", err); }
  };

  // Filter pinned messages for the banner
  const pinnedMessagesList = messages.filter(m => pinnedIds.includes(m._id));

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black relative">
      
      {/* 1. Header (Fixed) */}
      <div className="h-[60px] px-4 flex items-center gap-3 bg-white dark:bg-gray-900 border-b dark:border-gray-800 z-30 flex-shrink-0 shadow-sm">
        {onBack && <button onClick={onBack} className="md:hidden text-gray-600 dark:text-gray-300"><FaArrowLeft /></button>}
        
        <UserAvatar src={otherUser?.avatar} name={otherUser?.name} userId={otherUser?._id} className="w-9 h-9" />
        
        <div className="flex-1">
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">{otherUser?.name || "Chat"}</h3>
          <div className="flex items-center gap-2">
             {otherUser?.isVerified && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded font-bold">Verified</span>}
             {otherUser?.userStatus && <span className="text-[10px] text-green-600 dark:text-green-400 truncate max-w-[150px]">{otherUser.userStatus}</span>}
          </div>
        </div>
        
        <button 
            onClick={() => navigate(`/chat/call/${chatId}`)}
            className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 transition"
        >
            <FaVideo size={14} />
        </button>
      </div>

      {/* 2. Pinned Message Bar (Stacks Naturally) */}
      <div className="z-20">
        <PinnedMessage messages={pinnedMessagesList} onUnpin={handlePin} />
      </div>

      {/* 3. Messages List (Scrollable Area) */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-white/50 dark:bg-transparent"
        onScroll={handleScroll}
      >
        {messages.length > 15 && (
            <div className="text-center py-4">
                <button 
                    onClick={loadOlderMessages}
                    disabled={loadingMore}
                    className="text-xs bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-300 transition"
                >
                    {loadingMore ? 'Loading...' : 'Load older messages'}
                </button>
            </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble 
            key={m._id || i} 
            message={m} 
            isMe={(m.sender?._id || m.sender) === myId} 
            onReply={handleReply} 
            onEdit={handleEdit} 
            onForward={handleForward} 
            onPin={handlePin} 
            onDelete={() => { /* stub for delete */ }} 
          />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Scroll To Bottom Button */}
      {showScrollBtn && (
        <button 
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 bg-white dark:bg-gray-800 text-indigo-600 p-3 rounded-full shadow-lg border dark:border-gray-700 z-40 animate-bounce"
        >
            <FaArrowDown />
        </button>
      )}

      {/* 4. Input Area (Fixed Bottom) */}
      <div className="p-3 bg-white dark:bg-gray-900 border-t dark:border-gray-800 z-30 flex-shrink-0">
        
        {/* Context Banner (Reply/Edit) */}
        {(replyingTo || editingMsg) && (
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-t-xl border-l-4 border-indigo-500 mb-2 animate-slide-up">
                <div className="text-xs text-gray-600 dark:text-gray-300 px-2 flex-1">
                    {editingMsg ? (
                        <span className="font-bold text-yellow-600 flex items-center gap-1 mb-0.5"><FaPen size={10}/> Edit Message</span>
                    ) : (
                        <span className="font-bold text-indigo-500 mb-0.5 block">Replying to {replyingTo.sender?.name || 'User'}</span>
                    )}
                    <div className="truncate opacity-80">{editingMsg ? "" : (replyingTo.content || "Media Attachment")}</div>
                </div>
                <button onClick={cancelAction} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"><FaTimes size={12}/></button>
            </div>
        )}

        {/* File Preview */}
        {file && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg w-fit border border-indigo-100 dark:border-indigo-900">
                <FaImage className="text-indigo-500"/>
                <span className="text-xs truncate max-w-[200px] font-medium">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-red-500 hover:bg-red-100 p-1 rounded-full"><FaTimes/></button>
            </div>
        )}

        <div className="flex gap-2 items-end">
            <label className="text-gray-400 hover:text-indigo-500 cursor-pointer p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <FaImage size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            </label>

            <div className="pb-1">
                <AudioRecorder chatId={chatId} />
            </div>

            <textarea
                id="chat-input"
                value={text}
                onChange={handleTyping}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                }}
                placeholder={editingMsg ? "Edit your message..." : "Type a message..."}
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none max-h-32 custom-scrollbar transition-all placeholder-gray-400"
                rows={1}
                style={{ minHeight: '44px' }}
            />
            
            <button
                onClick={sendMessage}
                disabled={!text.trim() && !file}
                className="p-3 bg-indigo-600 text-white rounded-full disabled:opacity-50 disabled:bg-gray-300 hover:bg-indigo-700 transition shadow-md flex-shrink-0 transform active:scale-95"
            >
                <FaPaperPlane size={16} />
            </button>
        </div>
      </div>

      {/* Modals */}
      <ForwardModal isOpen={!!forwardMsg} onClose={() => setForwardMsg(null)} message={forwardMsg} />
      <Lightbox open={!!lightboxSrc} index={0} images={[lightboxSrc]} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}