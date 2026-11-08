// frontend/src/components/posts/ShareModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaSearch, FaRetweet } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { useToast } from '../ui/ToastProvider';
import { useSelector } from 'react-redux';

export default function ShareModal({ isOpen, onClose, post }) {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(null);
  const myId = useSelector(s => s.auth.user?._id);
  const { add } = useToast();

  useEffect(() => {
    if (isOpen) {
      API.get('/chat')
        .then(r => {
          const payload = r.data?.data || r.data;
          setChats(Array.isArray(payload) ? payload : []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !post) return null;

  const handleRepost = () => {
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    window.dispatchEvent(new CustomEvent('openCreatePost', { 
        detail: { content: `Shared via @${post.user?.name}: ${shareUrl}` } 
    }));
    onClose();
  };

  const handleSend = async (chatId) => {
    setSending(chatId);
    try {
      const postLink = `${window.location.origin}/post/${post._id}`;
      await API.post(`/chat/${chatId}/message`, { 
        content: `Check this out: ${postLink}` 
      });
      add('Broadcast link sent!', { type: 'success' });
    } catch (e) {
      add('Failed to send', { type: 'error' });
    } finally {
      setSending(null);
    }
  };

  const getOther = (c) => c.participants?.find(p => p._id !== myId) || { name: 'User' };
  const filtered = chats.filter(c => getOther(c).name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#070B14]/95 border border-white/15 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[72vh] backdrop-blur-2xl"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#171A26]/50">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#F7F7FC]">Share Broadcast</h3>
          <button onClick={onClose} className="p-1 text-[#A5A9BB] hover:text-[#F7F7FC] transition">
            <FaTimes size={14} />
          </button>
        </div>

        {/* REPOST OPTION */}
        <div className="p-4 border-b border-white/10 bg-[#171A26]/30">
            <button 
                onClick={handleRepost}
                className="w-full flex items-center justify-center gap-2 bg-[#0A111E] hover:bg-white/5 py-3 rounded-2xl transition font-bold text-xs text-[#00F2FE] border border-white/10 shadow-sm"
            >
                <FaRetweet size={14} /> Repost to Global Feed
            </button>
        </div>

        <div className="p-3 bg-[#070B14]">
          <div className="flex items-center bg-[#0A111E] rounded-2xl px-3.5 py-2.5 border border-white/10">
            <FaSearch className="text-[#A5A9BB] mr-2" size={12} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="bg-transparent outline-none w-full text-xs text-[#F7F7FC] placeholder-[#A5A9BB]"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#A5A9BB]">No matching contacts found.</div>
          ) : (
            filtered.map(c => {
              const other = getOther(c);
              return (
                <div key={c._id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition cursor-pointer" onClick={() => handleSend(c._id)}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <UserAvatar src={other.avatar} name={other.name} className="w-10 h-10 border border-white/10" />
                    <div className="font-medium text-xs text-[#F7F7FC] truncate">{other.name}</div>
                  </div>
                  <button 
                    disabled={sending === c._id}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm ${
                      sending === c._id 
                        ? 'bg-[#0F766E] text-white' 
                        : 'bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white hover:opacity-90'
                    }`}
                  >
                    {sending === c._id ? 'Sent' : 'Send'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
