import React, { useEffect, useMemo, useRef, useState } from 'react';
import API from '../../services/api';
import socket from '../../services/socket';
import { useSelector } from 'react-redux';
import {
  FaPaperPlane,
  FaArrowLeft,
  FaImage,
  FaTimes,
  FaVideo,
  FaSearch,
  FaChevronUp,
  FaChevronDown,
  FaThumbtack,
  FaLock,
  FaLockOpen,
  FaHourglassHalf,
  FaShieldAlt,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Spinner from '../common/Spinner';
import UserAvatar from '../ui/UserAvatar';
import MessageBubble from './MessageBubble';
import AudioRecorder from './AudioRecorder';
import ForwardModal from './ForwardModal';
import PinnedMessage from './PinnedMessage';
import { useToast } from '../ui/ToastProvider';
import { encryptMessage } from '../../utils/security';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_CHAT_MESSAGES = {
  demo_chat_ai: {
    other: { _id: 'system_social_ai', name: 'Social AI Assistant', avatar: '/socialverse-logo.jpg', isVerified: true },
    messages: [
      { _id: 'm1', content: 'Welcome to SocialVerse AI Studio! 🚀 I have analyzed trending creator hashtags across your network.', sender: { _id: 'system_social_ai', name: 'Social AI Assistant' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { _id: 'm2', content: "I've drafted 3 viral hooks for your upcoming reel. Want me to apply them?", sender: { _id: 'system_social_ai', name: 'Social AI Assistant' }, createdAt: new Date(Date.now() - 300000).toISOString() }
    ]
  },
  demo_chat_elena: {
    other: { _id: 'demo_u_elena', name: 'Elena Vance', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', isVerified: true },
    messages: [
      { _id: 'm1', content: 'Hey Sidhanta! Loved your latest architectural photography of the Bandra Sea Link ✨', sender: { _id: 'demo_u_elena', name: 'Elena Vance' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
      { _id: 'm2', content: 'Are you planning to present your WebRTC and spatial audio work at the Zurich summit?', sender: { _id: 'demo_u_elena', name: 'Elena Vance' }, createdAt: new Date(Date.now() - 2700000).toISOString() }
    ]
  },
  demo_chat_aarav: {
    other: { _id: 'sugg_aarav', name: 'Aarav Deshmukh', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', isVerified: true },
    messages: [
      { _id: 'm1', content: 'Hey brother! That WebRTC setup you shared is buttery smooth.', sender: { _id: 'sugg_aarav', name: 'Aarav Deshmukh' }, createdAt: new Date(Date.now() - 14400000).toISOString() },
      { _id: 'm2', content: "Can't wait to test the minigames on the new Royal Aether theme.", sender: { _id: 'sugg_aarav', name: 'Aarav Deshmukh' }, createdAt: new Date(Date.now() - 7200000).toISOString() }
    ]
  },
  demo_chat_aman: {
    other: { _id: 'demo_u_aman', name: 'Aman Verma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', isVerified: true },
    messages: [
      { _id: 'm1', content: "Let me know when you're free for the weekend sunset shoot!", sender: { _id: 'demo_u_aman', name: 'Aman Verma' }, createdAt: new Date(Date.now() - 21600000).toISOString() }
    ]
  },
  demo_chat_neha: {
    other: { _id: 'demo_u_neha', name: 'Neha Sharma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', isVerified: true },
    messages: [
      { _id: 'm1', content: 'The new Royal Aether theme looks breathtaking on mobile!', sender: { _id: 'demo_u_neha', name: 'Neha Sharma' }, createdAt: new Date(Date.now() - 43200000).toISOString() }
    ]
  }
};

export default function ChatBox({ chatId, onBack }) {
  const { add: addToast } = useToast();
  const currentUser = useSelector((s) => s.auth.user);
  const myId = currentUser?._id;
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [isSecretMode, setIsSecretMode] = useState(false);
  const [ephemeralTimer, setEphemeralTimer] = useState(0); // 0, 10, 60, 3600, 86400

  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [pinnedIds, setPinnedIds] = useState([]);
  const [forwardMsg, setForwardMsg] = useState(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);

  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const atBottomRef = useRef(true);
  const mountedRef = useRef(false);

  const scrollToBottom = (behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
    setShowNewMsgBtn(false);
  };

  const loadData = async () => {
    if (!chatId) return;
    setLoading(true);

    if (chatId.startsWith('demo_chat_') || DEMO_CHAT_MESSAGES[chatId]) {
      const demo = DEMO_CHAT_MESSAGES[chatId] || DEMO_CHAT_MESSAGES.demo_chat_ai;
      setMessages(demo.messages.slice());
      setOtherUser(demo.other);
      setLoading(false);
      requestAnimationFrame(() => scrollToBottom('auto'));
      return;
    }

    try {
      const { data } = await API.get(`/chat/${chatId}`);
      const chat = data?.data || data;

      setMessages((chat.messages || []).slice());
      setPinnedIds(chat.pinnedMessages || []);

      if (typeof chat.isSecret === 'boolean') setIsSecretMode(chat.isSecret);
      if (typeof chat.ephemeralDuration === 'number') setEphemeralTimer(chat.ephemeralDuration);

      const other = chat.participants?.find((p) => String(p._id) !== String(myId)) || chat.participants?.[0] || null;
      setOtherUser(other);

      API.post(`/chat/${chatId}/read`).catch(() => {});
      requestAnimationFrame(() => scrollToBottom('auto'));
    } catch (err) {
      if (DEMO_CHAT_MESSAGES[chatId]) {
        const demo = DEMO_CHAT_MESSAGES[chatId];
        setMessages(demo.messages.slice());
        setOtherUser(demo.other);
      } else {
        onBack?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const getTimerLabel = (secs) => {
    if (!secs) return 'Off';
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
    return `${Math.floor(secs / 86400)}d`;
  };

  const toggleSecretMode = async () => {
    const nextState = !isSecretMode;
    setIsSecretMode(nextState);
    addToast(nextState ? '🔒 End-to-End Encryption enabled' : '🔓 Secret Mode disabled', { type: 'info' });
    try {
      await API.put(`/chat/${chatId}/ephemeral`, { isSecret: nextState });
    } catch (_) {}
  };

  const cycleEphemeralTimer = async () => {
    const timers = [0, 10, 60, 3600, 86400];
    const currentIndex = timers.indexOf(ephemeralTimer);
    const nextIndex = (currentIndex + 1) % timers.length;
    const nextTimer = timers[nextIndex];
    setEphemeralTimer(nextTimer);
    addToast(nextTimer ? `⏱️ Messages will disappear after ${getTimerLabel(nextTimer)}` : '⏱️ Disappearing messages turned off', { type: 'info' });
    try {
      await API.put(`/chat/${chatId}/ephemeral`, { ephemeralDuration: nextTimer });
    } catch (_) {}
  };

  useEffect(() => {
    mountedRef.current = true;
    if (!chatId) return undefined;

    setMessages([]);
    setReplyingTo(null);
    setEditingMsg(null);
    setPinnedIds([]);
    setText('');
    setShowSearch(false);
    setSearchResults([]);
    setShowNewMsgBtn(false);

    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, [chatId, myId]);

  useEffect(() => {
    if (!chatId) return undefined;

    if (!socket.connected) socket.connect();
    socket.emit('joinRoom', { room: chatId });

    const handleMsg = (payload) => {
      if (payload.chatId !== chatId) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === payload.message._id)) return prev;
        return [...prev, payload.message];
      });
      setIsTyping(false);

      if (atBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom('smooth');
        });
        API.post(`/chat/${chatId}/read`).catch(() => {});
      } else {
        setShowNewMsgBtn(true);
      }
    };

    const handleUpdate = (payload) => {
      if (payload.chatId !== chatId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId
            ? {
                ...m,
                content: payload.newContent ?? m.content,
                pollOptions: payload.pollOptions ?? m.pollOptions,
                editedAt: payload.editedAt ?? m.editedAt,
              }
            : m
        )
      );
    };

    const handleDelete = (payload) => {
      if (payload.chatId !== chatId) return;
      setMessages((prev) => prev.filter((m) => m._id !== payload.messageId));
    };

    const handlePin = ({ chatId: pinnedChatId, pinnedMessages }) => {
      if (pinnedChatId !== chatId) return;
      setPinnedIds(pinnedMessages || []);
    };

    const onTyping = (data) => {
      if (data.chatId === chatId && data.userId !== myId) {
        setIsTyping(true);
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => setIsTyping(false), 2500);
      }
    };

    socket.on('receiveMessage', handleMsg);
    socket.on('message:updated', handleUpdate);
    socket.on('message:deleted', handleDelete);
    socket.on('chat:pinned', handlePin);
    socket.on('typing', onTyping);

    return () => {
      socket.emit('leaveRoom', { room: chatId });
      socket.off('receiveMessage', handleMsg);
      socket.off('message:updated', handleUpdate);
      socket.off('message:deleted', handleDelete);
      socket.off('chat:pinned', handlePin);
      socket.off('typing', onTyping);
      window.clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId, myId]);

  const loadOlderMessages = async () => {
    if (!chatId || messages.length === 0 || loadingMore) return 0;
    setLoadingMore(true);
    try {
      const oldestMsg = messages[0];
      const res = await API.get(`/chat/${chatId}/messages?before=${encodeURIComponent(oldestMsg.createdAt)}`);
      const older = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (older.length > 0) {
        setMessages((prev) => [...older.reverse(), ...prev]);
        return older.length;
      }
    } catch (e) {
      console.error('History load error', e);
    } finally {
      setLoadingMore(false);
    }
    return 0;
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socket.emit('typing', { chatId });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await API.get(`/chat/${chatId}/search?q=${encodeURIComponent(searchQuery)}`);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setSearchResults(list);
      setSearchIndex(0);
      if (list.length === 0) addToast('No results found', { type: 'info' });
    } catch (e2) {
      addToast('Search failed', { type: 'error' });
    }
  };

  const nextResult = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (searchIndex + 1) % searchResults.length;
    setSearchIndex(nextIdx);
    const targetId = searchResults[nextIdx]?._id;
    if (!targetId) return;
    const index = messages.findIndex((m) => m._id === targetId);
    if (index !== -1) {
      const el = document.getElementById(`msg-${targetId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    setEditingMsg(null);
    document.getElementById('chat-input')?.focus();
  };

  const handleEdit = (msg) => {
    setEditingMsg(msg);
    setReplyingTo(null);
    setText(msg.content || '');
    document.getElementById('chat-input')?.focus();
  };

  const handleForward = (msg) => setForwardMsg(msg);

  const handleDelete = async (msgId) => {
    try {
      await API.delete(`/chat/${chatId}/message/${msgId}`);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (e) {
      addToast(e.response?.data?.message || 'Delete failed', { type: 'error' });
    }
  };

  const handlePinAction = async (msgId) => {
    try {
      await API.put(`/chat/${chatId}/pin/${msgId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartCall = () => {
    if (!otherUser?._id) {
      addToast('Cannot call this user', { type: 'error' });
      return;
    }
    const callRoomId = `call_${chatId}_${Date.now()}`;
    socket.emit('call:start', {
      toUserId: otherUser._id,
      roomId: callRoomId,
      callerName: currentUser?.name || 'Friend',
      callerAvatar: currentUser?.avatar || null,
    });
    navigate(`/chat/call/${callRoomId}`);
  };

  const cancelAction = () => {
    setReplyingTo(null);
    setEditingMsg(null);
    setText('');
    setFile(null);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !file) return;

    if (editingMsg) {
      try {
        const res = await API.put(`/chat/${chatId}/message/${editingMsg._id}`, { newContent: text });
        const updated = res.data?.data || res.data;
        setMessages((prev) => prev.map((m) => (m._id === editingMsg._id ? { ...m, ...updated } : m)));
        cancelAction();
      } catch (e2) {
        addToast('Edit failed', { type: 'error' });
      }
      return;
    }

    try {
      let mediaUrl = null;
      if (file) {
        setIsUploading(true);
        const fd = new FormData();
        fd.append('media', file);
        const res = await API.post('/extra/upload', fd, {
          onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total)),
        });
        mediaUrl = res.data?.url || res.data?.data?.url || null;
        setIsUploading(false);
        setUploadProgress(0);
      }

      const processedContent = isSecretMode ? await encryptMessage(text, chatId) : text;
      const payload = {
        content: processedContent,
        media: mediaUrl,
        isEncrypted: isSecretMode,
        isEphemeral: ephemeralTimer > 0,
        ephemeralDuration: ephemeralTimer,
      };

      if (replyingTo) payload.replyTo = replyingTo._id;

      if (chatId.startsWith('demo_chat_')) {
        const myMsg = {
          _id: 'msg_' + Date.now(),
          content: text,
          sender: { _id: myId || 'me', name: currentUser?.name || 'You' },
          createdAt: new Date().toISOString()
        };
        setMessages((prev) => [...prev, myMsg]);
        cancelAction();
        requestAnimationFrame(() => scrollToBottom('smooth'));

        // Interactive AI and peer response simulation
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            let replyText = "Received! Let me review this and get back to you shortly.";
            if (chatId === 'demo_chat_ai') {
              replyText = `✨ Social AI: Analyzing "${text}". High engagement potential detected! Adding smart hashtags #SocialVerse #BeyondSocial.`;
            } else if (chatId === 'demo_chat_elena') {
              replyText = "Sounds incredible! Looking forward to collaborating on this.";
            } else if (chatId === 'demo_chat_aarav') {
              replyText = "100%! Testing it right away on my phone.";
            }
            const replyMsg = {
              _id: 'reply_' + Date.now(),
              content: replyText,
              sender: otherUser || { name: 'Peer' },
              createdAt: new Date().toISOString()
            };
            setMessages((prev) => [...prev, replyMsg]);
            requestAnimationFrame(() => scrollToBottom('smooth'));
          }, 1200);
        }, 600);
        return;
      }

      const res = await API.post(`/chat/${chatId}/message`, payload);
      const sent = res.data?.data || res.data;
      if (sent?._id) setMessages((prev) => [...prev, sent]);
      cancelAction();
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } catch (err) {
      console.error('Send failed', err);
      setIsUploading(false);
      addToast(err.response?.data?.message || 'Send failed', { type: 'error' });
    }
  };

  const pinnedMessages = useMemo(
    () => messages.filter((m) => pinnedIds.includes(m._id)),
    [messages, pinnedIds]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#04070D]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#04070D]">
      <div className="flex h-[75px] flex-shrink-0 items-center justify-between border-b border-[rgba(226,232,240,0.1)] px-4 backdrop-blur-2xl bg-[#070B14]/90 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="rounded-full p-2 text-[#CBD5E1] hover:bg-white/[0.08] md:hidden">
              <FaArrowLeft />
            </button>
          )}
          <UserAvatar src={otherUser?.avatar} name={otherUser?.name} userId={otherUser?._id} className="h-9 w-9" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-[#F8FAFC]">
              {otherUser?.name || 'Chat'}
            </h3>
            <div className="h-4">
              {isTyping ? (
                <span className="text-[10px] font-bold text-[#00F2FE] animate-pulse">Typing…</span>
              ) : (
                <span className="text-[10px] text-[#CBD5E1]/60">
                  {otherUser?.isVerified ? 'Verified' : otherUser?.userStatus || ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* E2EE Secret Chat Toggle */}
          <button
            onClick={toggleSecretMode}
            title={isSecretMode ? 'End-to-End Encryption (AES-GCM): ON' : 'Turn on End-to-End Encryption'}
            className={`rounded-full p-2 text-xs transition-all ${
              isSecretMode
                ? 'bg-[#0F766E]/20 text-[#00F2FE] ring-1 ring-[#00F2FE]/50 shadow-[0_0_12px_rgba(100,223,223,0.3)]'
                : 'text-[#CBD5E1]/50 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {isSecretMode ? <FaLock size={14} /> : <FaLockOpen size={14} />}
          </button>

          {/* Ephemeral Disappearing Messages Timer */}
          <button
            onClick={cycleEphemeralTimer}
            title={ephemeralTimer > 0 ? `Disappearing Messages: ${getTimerLabel(ephemeralTimer)}` : 'Disappearing Messages: OFF'}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              ephemeralTimer > 0
                ? 'bg-[#D4AF37]/20 text-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,140,123,0.3)]'
                : 'text-[#CBD5E1]/50 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <FaHourglassHalf size={12} className={ephemeralTimer > 0 ? 'animate-pulse' : ''} />
            {ephemeralTimer > 0 && <span>{getTimerLabel(ephemeralTimer)}</span>}
          </button>

          <button
            onClick={handleStartCall}
            title="Start Video Call"
            className="rounded-full p-2 text-[#CBD5E1]/60 transition-colors hover:text-[#00F2FE] hover:bg-white/[0.06]"
          >
            <FaVideo size={15} />
          </button>

          <button
            onClick={() => setShowSearch((v) => !v)}
            title="Search in chat"
            className="rounded-full p-2 text-[#CBD5E1]/60 transition-colors hover:text-white hover:bg-white/[0.06]"
          >
            <FaSearch size={14} />
          </button>
        </div>
      </div>

      {/* Ambient Security & Privacy Status Bar */}
      {(isSecretMode || ephemeralTimer > 0) && (
        <div className="flex items-center justify-center gap-3 bg-[#070B14] border-b border-[rgba(226,232,240,0.08)] px-4 py-1.5 text-[11px] font-medium select-none">
          {isSecretMode && (
            <span className="flex items-center gap-1.5 text-[#0F766E] font-semibold">
              <FaShieldAlt className="text-[10px] text-[#00F2FE]" /> End-to-End Encrypted (AES-GCM-256)
            </span>
          )}
          {isSecretMode && ephemeralTimer > 0 && <span className="text-white/20">•</span>}
          {ephemeralTimer > 0 && (
            <span className="flex items-center gap-1.5 text-[#D4AF37]">
              <FaHourglassHalf className="text-[10px] animate-pulse" /> Self-destructing after {getTimerLabel(ephemeralTimer)}
            </span>
          )}
        </div>
      )}

      {showSearch && (
        <div className="flex items-center gap-2 border-b border-[rgba(226,232,240,0.1)] bg-[#070B14] px-3 py-2">
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in chat..."
              className="flex-1 rounded-2xl border border-[rgba(226,232,240,0.12)] bg-[#04070D] px-3 py-2 text-sm text-[#F8FAFC] placeholder-[#CBD5E1]/40 outline-none focus:ring-1 focus:ring-[#00F2FE]"
            />
            <button type="submit" className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#00F2FE] px-3 py-2 text-sm font-bold text-white shadow-sm">
              Find
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-[#CBD5E1]/60 font-mono">
              <span>
                {searchIndex + 1}/{searchResults.length}
              </span>
              <button onClick={nextResult} className="rounded-full p-2 hover:bg-white/[0.08] text-[#CBD5E1]">
                <FaChevronDown />
              </button>
              <button onClick={() => setSearchIndex(Math.max(0, searchIndex - 1))} className="rounded-full p-2 hover:bg-white/[0.08] text-[#CBD5E1]">
                <FaChevronUp />
              </button>
            </div>
          )}
          <button onClick={() => { setShowSearch(false); setSearchResults([]); }} className="rounded-full p-2 text-[#CBD5E1]/60 hover:text-[#10B981]">
            <FaTimes />
          </button>
        </div>
      )}

      <div className="z-20">
        <PinnedMessage messages={pinnedMessages} onUnpin={handlePinAction} />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto max-w-4xl space-y-2">
          {messages.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#CBD5E1]/50">
              No messages yet. Say hello.
            </div>
          ) : (
            messages.map((m) => (
              <div id={`msg-${m._id}`} key={m._id}>
                <MessageBubble
                  message={m}
                  isMe={String(m.sender?._id || m.sender) === String(myId)}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onForward={handleForward}
                  onPin={handlePinAction}
                />
              </div>
            ))
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {showNewMsgBtn && (
        <div className="absolute bottom-28 left-1/2 z-20 -translate-x-1/2">
          <button onClick={() => scrollToBottom('smooth')} className="rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#00F2FE] px-4 py-2 text-xs font-bold text-white shadow-sapphireGlow">
            New messages
          </button>
        </div>
      )}

      <AnimatePresence>
        {replyingTo && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="border-t border-[rgba(226,232,240,0.1)] bg-[#070B14] px-4 py-2 text-xs text-[#CBD5E1]">
            Replying to: <span className="font-semibold text-[#F8FAFC]">{replyingTo.content || 'Attachment'}</span>
            <button onClick={() => setReplyingTo(null)} className="ml-2 text-[#10B981] hover:text-red-400">
              <FaTimes />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-[rgba(226,232,240,0.1)] bg-[#070B14]/95 p-3.5 backdrop-blur-xl">
        {isUploading && (
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#04070D]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#00F2FE]" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        <form onSubmit={sendMessage} className="mx-auto flex max-w-4xl items-center gap-2.5">
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[rgba(226,232,240,0.14)] bg-[#04070D] px-3 py-2.5 text-xs text-[#CBD5E1] hover:border-[#00F2FE]/50 transition-colors">
            <FaImage className="text-[#00F2FE]" />
            <span className="hidden md:inline font-semibold">Attach</span>
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="flex-1">
            {file && (
              <div className="mb-2 flex items-center gap-2 rounded-2xl border border-[rgba(226,232,240,0.14)] bg-[#04070D] px-3 py-2 text-xs">
                <span className="truncate text-[#F8FAFC]">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="ml-auto text-[#10B981] hover:text-red-400">
                  <FaTimes />
                </button>
              </div>
            )}

            <input
              id="chat-input"
              value={text}
              onChange={handleTyping}
              placeholder="Write a message…"
              className="w-full rounded-2xl border border-[rgba(226,232,240,0.14)] bg-[#04070D] px-4 py-3 text-sm text-[#F8FAFC] outline-none placeholder:text-[#CBD5E1]/40 focus:ring-1 focus:ring-[#00F2FE] transition-all"
            />
          </div>

          <AudioRecorder
            chatId={chatId}
            onSent={(msg) => {
              if (msg?._id) setMessages((prev) => [...prev, msg]);
              requestAnimationFrame(() => scrollToBottom('smooth'));
            }}
          />

          <button
            type="submit"
            className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#00F2FE] text-white transition shadow-sapphireGlow hover:scale-[1.04] active:scale-95"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>

      <ForwardModal isOpen={!!forwardMsg} onClose={() => setForwardMsg(null)} message={forwardMsg} />
    </div>
  );
}
