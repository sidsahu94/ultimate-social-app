import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import API from "../../services/api";
import socket from "../../services/socket";
import { useSelector } from "react-redux";
import { FaPaperPlane, FaArrowLeft, FaImage, FaTimes, FaArrowDown, FaVideo } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import Spinner from "../common/Spinner";
import UserAvatar from "../ui/UserAvatar";
import AudioRecorder from "./AudioRecorder";
import Lightbox from "../ui/Lightbox"; 

export default function ChatBox({ chatId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // Pagination state
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  const myId = useSelector((s) => s.auth.user?._id);
  const scrollRef = useRef();
  const containerRef = useRef();
  const previousScrollHeight = useRef(0); // For Scroll Retention logic
  const typingTimeoutRef = useRef(null); // Ref for debouncing typing emit
  
  const navigate = useNavigate();

  // --- 1. Load Initial Chat Data ---
  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    setMessages([]);

    const loadData = async () => {
      try {
        const { data } = await API.get(`/chat/${chatId}`);
        setMessages(data.messages || []);
        
        const other = data.participants.find(p => p._id !== myId) || data.participants[0];
        setOtherUser(other);

        // Mark as Read immediately on open
        API.post(`/chat/extras/${chatId}/read`).catch(() => {}); 
        
      } catch (err) {
        console.error("Failed to load chat", err);
        // Handle 404 (Invalid Chat ID)
        if (err.response && err.response.status === 404) {
            if(onBack) onBack(); 
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chatId, myId]); // onBack intentionally omitted

  // UX FIX: Mobile Keyboard Viewport Handling
  useEffect(() => {
    const handleResize = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'auto' });
        }
    };

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleResize);
        }
    };
  }, []);

  // --- 2. Load Older Messages (Pagination) ---
  const loadOlderMessages = async () => {
    if (messages.length === 0 || loadingMore) return;
    
    // Capture height before loading to maintain scroll position
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

  // Restore Scroll Position after loading older messages
  useLayoutEffect(() => {
    if (!loadingMore && previousScrollHeight.current > 0 && containerRef.current) {
        const newScrollHeight = containerRef.current.scrollHeight;
        const diff = newScrollHeight - previousScrollHeight.current;
        containerRef.current.scrollTop = diff; // Jump to where we were
        previousScrollHeight.current = 0;
    }
  }, [messages, loadingMore]);

  // --- 3. Real-time Socket Listener ---
  useEffect(() => {
    // Join the specific chat room so "typing" and "read" events work
    socket.emit('joinRoom', { room: chatId });

    const handleMsg = (payload) => {
      if (payload.chatId === chatId) {
        setMessages((prev) => [...prev, payload.message]);
        
        // Auto-scroll if near bottom
        const el = containerRef.current;
        if (el) {
            const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
            if (isNearBottom) {
                setTimeout(scrollToBottom, 100);
                // If I am viewing this chat, mark the incoming message as read immediately
                API.post(`/chat/extras/${chatId}/read`).catch(() => {});
            } else {
                setShowScrollBtn(true);
            }
        }
      }
    };

    // Update "Ticks" when other user reads
    const handleRead = ({ chatId: eventChatId }) => {
        if (eventChatId === chatId) {
            setMessages(prev => prev.map(m => {
                // If I sent it, mark it as seen
                if (m.sender === myId || m.sender?._id === myId) {
                    // "other" is a dummy value to trigger length > 0 check for double ticks
                    return { ...m, seenBy: [...(m.seenBy || []), "other"] }; 
                }
                return m;
            }));
        }
    };
    
    socket.on("receiveMessage", handleMsg);
    socket.on("message:read", handleRead);

    return () => {
        socket.emit('leaveRoom', { room: chatId });
        socket.off("receiveMessage", handleMsg);
        socket.off("message:read", handleRead);
    };
  }, [chatId, myId]);

  // --- 4. Scroll Handling ---
  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  // Initial scroll on load
  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom();
  }, [loading, chatId]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show "Scroll Down" button if far up
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBtn(distanceToBottom > 300);
  };

  // --- 5. Handlers ---
  
  // Format Date Headers
  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Render Links
  const renderContent = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-indigo-300 hover:text-white break-all transition">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Start Video Call
  const startVideoCall = () => {
    if (!otherUser?._id) return;
    
    // Use chatId as room ID for simplicity
    const callRoomId = chatId;

    // Emit "Ring" signal
    socket.emit('call:start', {
        toUserId: otherUser._id,
        roomId: callRoomId,
        callerName: "User", // In a real app, pass currentUser.name from Redux
        callerAvatar: null
    });

    // Go to waiting room
    navigate(`/chat/call/${callRoomId}`);
  };

  // Handle Typing
  const handleTyping = (e) => {
    setText(e.target.value);

    // Debounce the emit to prevent flooding the server
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    socket.emit('typing', { chatId });

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
        // Optional: socket.emit('stopTyping', { chatId });
    }, 2000);
  };

  // Send Message
  const sendMessage = async (e) => {
    e?.preventDefault(); // Handle if called from form event
    if (!text.trim() && !file) return;

    let mediaUrl = null;
    const tempFile = file; 
    setFile(null); 
    setText("");

    try {
      if (tempFile) {
        const fd = new FormData();
        fd.append('media', tempFile);
        const uploadRes = await API.post('/extra/upload', fd, { 
            headers: { 'Content-Type': 'multipart/form-data' } 
        });
        mediaUrl = uploadRes.data.url;
      }

      const { data } = await API.post(`/chat/${chatId}/message`, { 
        content: text, 
        media: mediaUrl 
      });
      
      // Optimistic update using returned data
      if (data.messages) {
          setMessages((prev) => [...prev, data.messages[data.messages.length - 1]]); 
          setTimeout(scrollToBottom, 100);
      }
    } catch (err) { 
        console.error(err);
        alert("Failed to send message");
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative">
      {/* Header */}
      <div className="p-3 border-b dark:border-gray-700 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 z-10 shadow-sm">
        {onBack && (
          <button onClick={onBack} className="md:hidden text-gray-600 dark:text-gray-300">
            <FaArrowLeft />
          </button>
        )}
        <UserAvatar src={otherUser?.avatar} name={otherUser?.name} userId={otherUser?._id} className="w-10 h-10" />
        <div className="flex-1">
          <h3 className="font-bold text-sm md:text-base">{otherUser?.name || "Chat"}</h3>
          {otherUser?.isVerified && <span className="text-[10px] text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900/30 px-1 rounded">Verified</span>}
        </div>
        
        {/* Video Call Button */}
        <button 
            onClick={startVideoCall}
            className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full hover:bg-indigo-200 transition"
            title="Start Video Call"
        >
            <FaVideo />
        </button>
      </div>

      {/* Messages List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/50 dark:bg-black/20"
        onScroll={handleScroll}
      >
        {/* Load More Button */}
        <div className="text-center py-2">
            <button 
                onClick={loadOlderMessages}
                disabled={loadingMore}
                className="text-xs text-indigo-500 font-medium hover:underline disabled:opacity-50"
            >
                {loadingMore ? 'Loading history...' : 'Load older messages'}
            </button>
        </div>

        {messages.map((m, i) => {
          const isMe = (m.sender?._id || m.sender) === myId;
          
          // Date Header Logic
          const showDateHeader = i === 0 || new Date(m.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();

          return (
            <React.Fragment key={m._id || i}>
                {showDateHeader && (
                    <div className="flex justify-center my-4 sticky top-0 z-0">
                        <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm opacity-90">
                            {formatDateHeader(m.createdAt)}
                        </span>
                    </div>
                )}

                <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] md:max-w-[60%] px-4 py-2 rounded-2xl text-sm shadow-sm relative group ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-600"
                    }`}
                  >
                    {/* Audio */}
                    {m.audio && (
                        <audio controls src={m.audio} className="h-8 w-48 mb-2 mt-1" />
                    )}
                    
                    {/* Image */}
                    {m.media && (
                        <img 
                          src={m.media} 
                          className="mt-1 mb-2 rounded-lg max-h-60 object-cover cursor-zoom-in hover:opacity-90 transition bg-black/10" 
                          alt="attachment" 
                          onClick={() => setLightboxSrc(m.media)}
                        />
                    )}

                    {/* Text */}
                    {m.content && <div className="whitespace-pre-wrap leading-relaxed">{renderContent(m.content)}</div>}
                    
                    {/* Timestamp & Read Receipts */}
                    <div className={`text-[9px] mt-1 text-right flex justify-end items-center gap-1 ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {isMe && (
                            <span className={m.seenBy?.length > 0 ? "text-blue-200" : ""}>
                                {m.seenBy?.length > 0 ? '✓✓' : '✓'}
                            </span>
                        )}
                    </div>
                  </div>
                </div>
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Floating Scroll Button */}
      {showScrollBtn && (
        <button 
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-xl hover:bg-indigo-700 transition animate-bounce z-20"
        >
            <FaArrowDown />
        </button>
      )}

      {/* Input Area */}
      <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
        {file && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit animate-fade-in border border-gray-200 dark:border-gray-600">
                <FaImage className="text-indigo-500"/>
                <span className="text-xs truncate max-w-[200px]">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-red-500 hover:bg-red-100 p-1 rounded-full"><FaTimes /></button>
            </div>
        )}

        <div className="flex gap-2 items-end">
            <label className="text-gray-400 hover:text-indigo-500 cursor-pointer p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <FaImage size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            </label>

            <div className="pb-1">
                <AudioRecorder 
                    chatId={chatId} 
                    onSent={(data) => {
                        if (data.messages) {
                            setMessages(prev => [...prev, data.messages[data.messages.length - 1]]);
                            setTimeout(scrollToBottom, 100);
                        }
                    }} 
                />
            </div>

            <textarea
                value={text}
                onChange={handleTyping}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none max-h-32 custom-scrollbar transition-all"
                rows={1}
                style={{ minHeight: '44px' }}
            />
            
            <button
                onClick={sendMessage}
                disabled={!text.trim() && !file}
                className="p-3 bg-indigo-600 text-white rounded-full disabled:opacity-50 hover:bg-indigo-700 transition shadow-md flex-shrink-0"
            >
                <FaPaperPlane />
            </button>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox 
        open={!!lightboxSrc} 
        index={0} 
        images={[lightboxSrc]} 
        onClose={() => setLightboxSrc(null)} 
      />
    </div>
  );
}