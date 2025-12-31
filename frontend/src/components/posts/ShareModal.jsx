import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaPaperPlane, FaSearch, FaRetweet } from 'react-icons/fa'; // 🔥 Imported FaRetweet
import UserAvatar from '../ui/UserAvatar';
import { useToast } from '../ui/ToastProvider';
import { useSelector } from 'react-redux';

export default function ShareModal({ isOpen, onClose, post }) {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(null); // ID of chat being sent to
  const myId = useSelector(s => s.auth.user?._id);
  const { add } = useToast();

  useEffect(() => {
    if (isOpen) {
      API.get('/chat').then(r => setChats(r.data)).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !post) return null;

  // 🔥 NEW: Repost Logic
  const handleRepost = () => {
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    // Dispatch event to open CreatePostModal with content
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
      add('Sent!', { type: 'success' });
    } catch (e) {
      add('Failed to send', { type: 'error' });
    } finally {
      setSending(null);
    }
  };

  const getOther = (c) => c.participants?.find(p => p._id !== myId) || { name: 'User' };
  const filtered = chats.filter(c => getOther(c).name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold">Share</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>

        {/* 🔥 NEW REPOST OPTION */}
        <div className="p-4 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button 
                onClick={handleRepost}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-700 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition font-bold text-gray-700 dark:text-gray-200 border dark:border-gray-600 shadow-sm"
            >
                <FaRetweet className="text-green-500" /> Repost to Feed
            </button>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-black/20">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border dark:border-gray-700">
            <FaSearch className="text-gray-400 mr-2" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search people to msg..."
              className="bg-transparent outline-none w-full text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map(c => {
            const other = getOther(c);
            return (
              <div key={c._id} className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer" onClick={() => handleSend(c._id)}>
                <div className="flex items-center gap-3">
                  <UserAvatar src={other.avatar} name={other.name} className="w-10 h-10" />
                  <div className="font-medium text-sm">{other.name}</div>
                </div>
                <button 
                  disabled={sending === c._id}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${sending === c._id ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'}`}
                >
                  {sending === c._id ? 'Sent' : 'Send'}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}