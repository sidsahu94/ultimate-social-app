// frontend/src/components/chat/CreateGroupModal.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaUsers, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';

export default function CreateGroupModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);

  const search = async (q) => {
    setQuery(q);
    if (q.length > 2) {
      try {
        const r = await API.get(`/users/search?q=${encodeURIComponent(q)}`);
        setResults(r.data.users || r.data.data || r.data || []);
      } catch (_) {
        setResults([]);
      }
    } else {
      setResults([]);
    }
  };

  const toggleUser = (u) => {
    setSelected((prev) => {
      if (prev.some((s) => s._id === u._id)) return prev.filter((s) => s._id !== u._id);
      return [...prev, u];
    });
  };

  const create = async () => {
    if (!name.trim() || selected.length === 0) return;
    try {
      const res = await API.post('/chat', {
        name: name.trim(),
        isGroup: true,
        participants: selected.map((u) => u._id),
      });
      onCreated?.(res.data?.data || res.data);
      onClose?.();
      setName('');
      setQuery('');
      setResults([]);
      setSelected([]);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create group');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-[28px] border border-[rgba(226,232,240,0.16)] bg-[#070B14] p-6 shadow-2xl text-[#F8FAFC]">
        <div className="mb-5 flex items-center justify-between border-b border-[rgba(226,232,240,0.1)] pb-3">
          <h2 className="flex items-center gap-2 text-xl font-black text-[#F8FAFC]">
            <FaUsers className="text-[#00F2FE]" /> Create Group
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-[#CBD5E1]/60 hover:text-white hover:bg-white/[0.08] transition-colors">
            <FaTimes />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="mb-4 w-full rounded-2xl border border-[rgba(226,232,240,0.14)] bg-[#04070D] px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#CBD5E1]/40 outline-none focus:ring-1 focus:ring-[#00F2FE] transition-all"
        />

        <div className="mb-2 text-sm font-semibold text-[#CBD5E1]/80">Add members</div>
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((u) => (
            <span
              key={u._id}
              onClick={() => toggleUser(u)}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-3 py-1 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors"
            >
              {u.name} <FaTimes size={10} />
            </span>
          ))}
        </div>

        <div className="relative mb-4">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#CBD5E1]/40" />
          <input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-2xl border border-[rgba(226,232,240,0.14)] bg-[#04070D] px-4 py-3 pl-10 text-sm text-[#F8FAFC] placeholder-[#CBD5E1]/40 outline-none focus:ring-1 focus:ring-[#00F2FE] transition-all"
          />
        </div>

        <div className="mb-5 max-h-48 space-y-2 overflow-y-auto pr-1">
          {results.map((u) => {
            const active = selected.some((s) => s._id === u._id);
            return (
              <button
                key={u._id}
                type="button"
                onClick={() => toggleUser(u)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                  active ? 'bg-[#1D4ED8]/25 border border-[rgba(226,232,240,0.15)]' : 'hover:bg-white/[0.06]'
                }`}
              >
                <img
                  src={u.avatar || '/default-avatar.png'}
                  alt={u.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#F8FAFC]">{u.name}</div>
                  <div className="truncate text-xs text-[#CBD5E1]/60">@{u.email?.split('@')[0] || 'user'}</div>
                </div>
                {active && <FaCheck className="text-[#00F2FE]" />}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 border-t border-[rgba(226,232,240,0.1)] pt-4">
          <button onClick={onClose} className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#CBD5E1]/70 hover:bg-white/[0.06] hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={create}
            disabled={!name.trim() || selected.length === 0}
            className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#00F2FE] px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 shadow-sapphireGlow hover:opacity-95 transition-all"
          >
            Create Group
          </button>
        </div>
      </motion.div>
    </div>
  );
}
