// frontend/src/pages/chat/ChatPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import socket from '../../services/socket';
import { useSelector } from 'react-redux';
import { FaUsers, FaUserPlus, FaSearch, FaTrashAlt, FaComments } from 'react-icons/fa';
import { useToast } from '../../components/ui/ToastProvider';
import UserAvatar from '../../components/ui/UserAvatar';
import CreateGroupModal from '../../components/chat/CreateGroupModal';
import NewChatModal from '../../components/chat/NewChatModal';
import ChatBox from '../../components/chat/ChatBox';

// Rich Seed Conversations ensuring Chat is never empty
const SEED_CONVERSATIONS = [
  {
    _id: "demo_chat_ai",
    name: "Social AI Assistant",
    isGroup: false,
    participants: [
      {
        _id: "system_social_ai",
        name: "Social AI Assistant",
        avatar: "/socialverse-logo.jpg",
        isVerified: true
      }
    ],
    lastMessage: {
      content: "I've drafted 3 viral hooks for your upcoming reel. Want me to apply them?",
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    _id: "demo_chat_elena",
    name: "Elena Vance",
    isGroup: false,
    participants: [
      {
        _id: "demo_u_elena",
        name: "Elena Vance",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        isVerified: true
      }
    ],
    lastMessage: {
      content: "Loved your latest architectural photography of the Bandra Sea Link ✨",
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    _id: "demo_chat_aarav",
    name: "Aarav Deshmukh",
    isGroup: false,
    participants: [
      {
        _id: "sugg_aarav",
        name: "Aarav Deshmukh",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        isVerified: true
      }
    ],
    lastMessage: {
      content: "Hey brother! That WebRTC setup you shared is buttery smooth.",
      createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString()
    },
    updatedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString()
  },
  {
    _id: "demo_chat_aman",
    name: "Aman Verma",
    isGroup: false,
    participants: [
      {
        _id: "demo_u_aman",
        name: "Aman Verma",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
        isVerified: true
      }
    ],
    lastMessage: {
      content: "Let me know when you're free for the weekend sunset shoot!",
      createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString()
    },
    updatedAt: new Date(Date.now() - 360 * 60 * 1000).toISOString()
  },
  {
    _id: "demo_chat_neha",
    name: "Neha Sharma",
    isGroup: false,
    participants: [
      {
        _id: "demo_u_neha",
        name: "Neha Sharma",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        isVerified: true
      }
    ],
    lastMessage: {
      content: "The new Royal Aether theme looks breathtaking on mobile!",
      createdAt: new Date(Date.now() - 720 * 60 * 1000).toISOString()
    },
    updatedAt: new Date(Date.now() - 720 * 60 * 1000).toISOString()
  }
];

export default function ChatPage() {
  const { id: paramChatId } = useParams();
  const navigate = useNavigate();
  const { add: addToast } = useToast();

  const myId = useSelector((s) => s.auth?.user?._id || localStorage.getItem('meId'));
  const [conversations, setConversations] = useState([]);
  const [chatSearch, setChatSearch] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(paramChatId || null);
  const [typingMap, setTypingMap] = useState({});
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    setSelectedChatId(paramChatId || null);
  }, [paramChatId]);

  const normalizeChats = (payload) => {
    if (Array.isArray(payload)) return payload;
    return payload?.data || [];
  };

  const loadConversations = async () => {
    try {
      const r = await API.get('/chat');
      const list = normalizeChats(r.data);
      if (list && list.length > 0) {
        setConversations(list);
        if (!selectedChatId && window.innerWidth >= 768) setSelectedChatId(list[0]._id);
      } else {
        setConversations(SEED_CONVERSATIONS);
        if (!selectedChatId && window.innerWidth >= 768) setSelectedChatId(SEED_CONVERSATIONS[0]._id);
      }
    } catch (err) {
      setConversations(SEED_CONVERSATIONS);
      if (!selectedChatId && window.innerWidth >= 768) setSelectedChatId(SEED_CONVERSATIONS[0]._id);
    }
  };

  useEffect(() => {
    loadConversations();

    const onMsg = (payload) => {
      if (!payload?.chatId) return;
      setConversations((prev) => {
        const updated = prev.find((c) => c._id === payload.chatId);
        const rest = prev.filter((c) => c._id !== payload.chatId);

        if (updated) {
          const next = {
            ...updated,
            lastMessage: payload.message,
            updatedAt: new Date().toISOString(),
          };
          return [next, ...rest];
        }

        loadConversations();
        return prev;
      });
    };

    const onTyping = ({ chatId, userId }) => {
      if (!chatId || !userId || userId === myId) return;
      setTypingMap((prev) => ({ ...prev, [chatId]: true }));
      window.clearTimeout(window.__chatTypingTimer?.[chatId]);
      window.__chatTypingTimer = window.__chatTypingTimer || {};
      window.__chatTypingTimer[chatId] = window.setTimeout(() => {
        setTypingMap((prev) => {
          const next = { ...prev };
          delete next[chatId];
          return next;
        });
      }, 2500);
    };

    socket.on('receiveMessage', onMsg);
    socket.on('typing', onTyping);

    return () => {
      socket.off('receiveMessage', onMsg);
      socket.off('typing', onTyping);
    };
  }, [myId]);

  const getOther = (c) => {
    if (!c) return { name: 'Chat' };
    if (c.isGroup || c.isGroupChat) return { name: c.name || c.chatName || 'Group Chat', avatar: null };
    return c.participants?.find((p) => String(p._id) !== String(myId)) || c.participants?.[0] || { name: 'User' };
  };

  const filtered = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const other = getOther(c);
      const haystack = [
        other?.name,
        c.name,
        c.chatName,
        c.lastMessage?.content,
        c.lastMessage?.sender?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [chatSearch, conversations, myId]);

  const startNewChat = async (targetUserId) => {
    try {
      const res = await API.post('/chat', { participants: [targetUserId], isGroup: false });
      const newConv = res.data?.data || res.data;
      if (newConv?._id) {
        setConversations((prev) => [newConv, ...prev.filter((c) => c._id !== newConv._id)]);
        navigate(`/chat/${newConv._id}`);
      }
    } catch (e) {
      addToast('Failed to start chat', { type: 'error' });
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e?.stopPropagation?.();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await API.delete(`/chat/${chatId}`);
      setConversations((prev) => prev.filter((c) => c._id !== chatId));
      if (selectedChatId === chatId) navigate('/chat');
      addToast('Conversation deleted', { type: 'success' });
    } catch (e2) {
      addToast(e2.response?.data?.message || 'Failed to delete conversation', { type: 'error' });
    }
  };

  const openChat = (chatId) => {
    setSelectedChatId(chatId);
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-6xl gap-4 p-4 md:h-[85vh]">
      <aside className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full flex-col rounded-[28px] border border-[rgba(226,232,240,0.14)] bg-[#070B14]/90 backdrop-blur-xl shadow-silverGlass md:w-1/3 overflow-hidden`}>
        <div className="rounded-t-[28px] border-b border-[rgba(226,232,240,0.1)] bg-[#04070D]/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black text-[#F8FAFC]">
              <FaComments className="text-[#00F2FE]" /> Chats
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGroupModal(true)}
                className="rounded-full bg-white/[0.06] hover:bg-white/[0.12] p-2 text-[#CBD5E1] hover:text-white transition-colors"
                title="Create group"
              >
                <FaUsers />
              </button>
              <button
                onClick={() => setShowNewChat(true)}
                className="rounded-full bg-white/[0.06] hover:bg-white/[0.12] p-2 text-[#CBD5E1] hover:text-white transition-colors"
                title="New chat"
              >
                <FaUserPlus />
              </button>
            </div>
          </div>

          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#CBD5E1]/50" />
            <input
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-2xl border border-[rgba(226,232,240,0.12)] bg-[#04070D] py-2.5 pl-10 pr-3 text-sm text-[#F8FAFC] placeholder-[#CBD5E1]/40 outline-none focus:ring-1 focus:ring-[#00F2FE] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="mt-10 text-center text-sm text-[#CBD5E1]/50">
              No chats yet.
            </div>
          ) : (
            filtered.map((c) => {
              const other = getOther(c);
              const isActive = String(selectedChatId || '') === String(c._id);
              const isUnread = c.unread && myId ? Number(c.unread?.[myId] || 0) > 0 : false;
              const previewTyping = typingMap[c._id];

              return (
                <button
                  key={c._id}
                  onClick={() => openChat(c._id)}
                  className={`mb-2 flex w-full items-center gap-3 rounded-[22px] border px-3 py-3 text-left transition-all ${
                    isActive
                      ? 'border-[rgba(226,232,240,0.16)] bg-gradient-to-r from-[#1D4ED8]/20 via-[#052E24]/15 to-[#00F2FE]/10 shadow-silverGlass'
                      : 'border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  <UserAvatar src={other?.avatar} name={other?.name} userId={other?._id} className="h-11 w-11 shrink-0" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate font-bold text-[#F8FAFC]">
                        {other?.name || 'Chat'}
                      </div>
                      {isUnread && (
                        <span className="rounded-full bg-[#052E24] px-2 py-0.5 text-[10px] font-black text-white shadow-[0_0_8px_rgba(139,0,24,0.6)]">
                          NEW
                        </span>
                      )}
                    </div>

                    <div className="truncate text-xs text-[#CBD5E1]/60">
                      {previewTyping ? (
                        <span className="text-[#00F2FE] font-bold animate-pulse">Typing...</span>
                      ) : c.lastMessage?.content ? (
                        c.lastMessage.content
                      ) : c.lastMessage?.media ? (
                        'Media attachment'
                      ) : (
                        'Start chatting'
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteChat(c._id, e)}
                    className="rounded-full p-2 text-[#CBD5E1]/40 hover:text-[#10B981] hover:bg-[#052E24]/15 transition-colors"
                    title="Delete conversation"
                  >
                    <FaTrashAlt />
                  </button>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="min-w-0 flex-1 rounded-[28px] border border-[rgba(226,232,240,0.14)] bg-[#070B14]/90 backdrop-blur-xl shadow-silverGlass overflow-hidden flex flex-col">
        {selectedChatId ? (
          <ChatBox chatId={selectedChatId} onBack={() => navigate('/chat')} />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-[#04070D] border border-[rgba(226,232,240,0.12)] text-3xl text-[#00F2FE] shadow-[0_0_24px_rgba(100,223,223,0.25)]">
                <FaComments />
              </div>
              <div className="text-2xl font-black text-[#F8FAFC]">Select a chat</div>
              <p className="mt-2 max-w-md text-sm text-[#CBD5E1]/60">
                Choose a conversation or start a new one to begin messaging.
              </p>
            </div>
          </div>
        )}
      </section>

      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        onUserSelect={startNewChat}
      />

      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreated={(chat) => {
          const next = chat?._id ? chat : null;
          if (next) {
            setConversations((prev) => [next, ...prev.filter((c) => c._id !== next._id)]);
            navigate(`/chat/${next._id}`);
          } else {
            loadConversations();
          }
        }}
      />
    </div>
  );
}
