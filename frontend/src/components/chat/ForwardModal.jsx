import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaPaperPlane, FaSearch } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { useToast } from '../ui/ToastProvider';
import { useSelector } from 'react-redux';

export default function ForwardModal({ isOpen, onClose, message }) {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(null);
  const myId = useSelector(s => s.auth.user?._id);
  const { add } = useToast();

  useEffect(() => {
    if (isOpen) {
      API.get('/chat').then(r => setChats(r.data)).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !message) return null;

  const handleForward = async (chatId) => {
    setSending(chatId);
    try {
      await API.post(`/chat/${chatId}/message`, { 
        content: message.content,
        media: message.media, // Forward media too
        isForwarded: true     // 🔥 Flag as forwarded
      });
      add('Message forwarded!', { type: 'success' });
      onClose();
    } catch (e) {
      add('Failed to forward', { type: 'error' });
    } finally {
      setSending(null);
    }
  };

  const getOther = (c) => c.participants?.find(p => p._id !== myId) || { name: 'User' };
  const filtered = chats.filter(c => getOther(c).name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold">Forward to...</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>

        {/* Message Preview */}
        <div className="p-3 bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 italic border-b dark:border-gray-700 truncate">
            "{message.content || 'Media Attachment'}"
        </div>

        <div className="p-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
            <FaSearch className="text-gray-400 mr-2" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent outline-none w-full text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map(c => {
            const other = getOther(c);
            return (
              <div key={c._id} onClick={() => handleForward(c._id)} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <UserAvatar src={other.avatar} name={other.name} className="w-10 h-10" />
                  <div className="font-medium text-sm">{other.name}</div>
                </div>
                <button disabled={sending === c._id} className="text-indigo-600">
                  <FaPaperPlane />
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}