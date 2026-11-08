// frontend/src/components/chat/NewChatModal.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';

export default function NewChatModal({ isOpen, onClose, onUserSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setLoading(true);
        try {
          const r = await API.get(`/users/search?q=${encodeURIComponent(query)}`);
          setResults(r.data.users || r.data.data || r.data || []);
        } catch (e) {
          console.error(e);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-[28px] border border-[rgba(226,232,240,0.16)] bg-[#070B14] p-6 shadow-2xl text-[#F8FAFC]">
        <div className="mb-4 flex items-center justify-between border-b border-[rgba(226,232,240,0.1)] pb-3">
          <h2 className="text-xl font-black text-[#F8FAFC]">New Message</h2>
          <button onClick={onClose} className="rounded-full p-2 text-[#CBD5E1]/60 hover:text-white hover:bg-white/[0.08] transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="relative mb-4">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#CBD5E1]/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people..."
            autoFocus
            className="w-full rounded-2xl border border-[rgba(226,232,240,0.14)] bg-[#04070D] px-4 py-3 pl-10 text-sm text-[#F8FAFC] placeholder-[#CBD5E1]/40 outline-none focus:ring-1 focus:ring-[#00F2FE] transition-all"
          />
        </div>

        <div className="mb-2 max-h-60 space-y-2 overflow-y-auto pr-1">
          {loading && <div className="py-6 text-center text-xs text-[#CBD5E1]/60 font-mono">Searching…</div>}
          {!loading && results.length === 0 && query.length > 2 && (
            <div className="py-6 text-center text-sm text-[#CBD5E1]/50">No users found</div>
          )}

          {results.map((u) => (
            <button
              key={u._id}
              onClick={() => {
                onUserSelect?.(u._id);
                onClose?.();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-white/[0.06]"
            >
              <UserAvatar src={u.avatar} name={u.name} className="h-10 w-10" />
              <div className="min-w-0">
                <div className="truncate font-semibold text-[#F8FAFC]">{u.name}</div>
                <div className="truncate text-xs text-[#CBD5E1]/60">@{u.email?.split('@')[0] || 'user'}</div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
