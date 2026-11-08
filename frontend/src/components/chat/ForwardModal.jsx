// frontend/src/components/chat/ForwardModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
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
  const myId = useSelector((s) => s.auth.user?._id);
  const { add } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    API.get('/chat')
      .then((r) => setChats(r.data?.data || r.data || []))
      .catch(() => setChats([]));
  }, [isOpen]);

  const getOther = (c) =>
    c.participants?.find((p) => String(p._id) !== String(myId)) ||
    c.participants?.[0] ||
    { name: 'User' };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => getOther(c).name.toLowerCase().includes(q));
  }, [chats, search, myId]);

  if (!isOpen || !message) return null;

  const handleForward = async (chatId) => {
    setSending(chatId);
    try {
      await API.post(`/chat/${chatId}/message`, {
        content: message.content || '',
        media: message.media || null,
        audio: message.audio || null,
        replyTo: null,
        isForwarded: true,
        isEncrypted: Boolean(message.isEncrypted),
      });
      add('Message forwarded!', { type: 'success' });
      onClose?.();
    } catch (e) {
      add(e.response?.data?.message || 'Failed to forward', { type: 'error' });
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-[28px] border border-[rgba(226,232,240,0.16)] bg-[#070B14] shadow-2xl text-[#F8FAFC]">
        <div className="flex items-center justify-between border-b border-[rgba(226,232,240,0.1)] p-4">
          <h3 className="font-black text-[#F8FAFC]">Forward to…</h3>
          <button onClick={onClose} className="rounded-full p-2 text-[#CBD5E1]/60 hover:text-white hover:bg-white/[0.08] transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="border-b border-[rgba(226,232,240,0.08)] bg-[#04070D] px-4 py-3 text-xs italic text-[#CBD5E1]/70">
          "{message.content || 'Media Attachment'}"
        </div>

        <div className="p-3">
          <div className="flex items-center rounded-2xl bg-[#04070D] border border-[rgba(226,232,240,0.12)] px-3 py-2">
            <FaSearch className="mr-2 text-[#CBD5E1]/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-transparent text-sm outline-none text-[#F8FAFC] placeholder-[#CBD5E1]/40"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((c) => {
            const other = getOther(c);
            return (
              <button
                key={c._id}
                onClick={() => handleForward(c._id)}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar src={other.avatar} name={other.name} className="h-10 w-10" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#F8FAFC]">{other.name}</div>
                    <div className="truncate text-xs text-[#CBD5E1]/60">
                      {c.lastMessage?.content || 'No messages yet'}
                    </div>
                  </div>
                </div>
                <span className="ml-3 text-[#00F2FE]">
                  {sending === c._id ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[rgba(226,232,240,0.2)] border-t-[#00F2FE]" />
                  ) : (
                    <FaPaperPlane />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
