import React, { useEffect, useMemo, useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaSignOutAlt, FaCrown, FaUserMinus, FaPen, FaCheck } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { useToast } from '../ui/ToastProvider';
import { useSelector } from 'react-redux';

export default function ChatInfoModal({ isOpen, onClose, chat, onLeave, onUpdate }) {
  const { user: me } = useSelector((s) => s.auth);
  const { add } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(chat?.name || chat?.chatName || '');

  useEffect(() => {
    setEditName(chat?.name || chat?.chatName || '');
  }, [chat]);

  const amIAdmin = useMemo(() => {
    if (!chat || !me?._id) return false;
    if (chat.participants?.some((p) => String(p._id) === String(me._id) && p.isAdmin)) return true;
    return chat.admins?.some((a) => String(typeof a === 'string' ? a : a?._id) === String(me._id));
  }, [chat, me]);

  if (!isOpen || !chat) return null;

  const isAdmin = (uid) => chat.admins?.some((a) => String(typeof a === 'string' ? a : a?._id) === String(uid));

  const handleAction = async (userId, action) => {
    try {
      const res = await API.put(`/chat/${chat._id}/members`, { userId, action });
      onUpdate?.(res.data?.data || res.data);
      add(`User ${action}ed`, { type: 'success' });
    } catch (e) {
      add(e.response?.data?.message || 'Action failed', { type: 'error' });
    }
  };

  const handleSaveGroup = async () => {
    if (!editName.trim()) return;
    try {
      const res = await API.put(`/chat/${chat._id}/details`, { name: editName.trim() });
      onUpdate?.(res.data?.data || res.data);
      setIsEditing(false);
      add('Group updated', { type: 'success' });
    } catch (e) {
      add(e.response?.data?.message || 'Failed to update group', { type: 'error' });
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave group?')) return;
    try {
      await API.post(`/chat/${chat._id}/leave`);
      onLeave?.();
      onClose?.();
    } catch (e) {
      add(e.response?.data?.message || 'Failed', { type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#070B14] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        <div className="mb-6 flex items-center justify-between">
          {isEditing ? (
            <div className="flex w-full items-center gap-2 pr-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-[#0A111E] px-3 py-2 text-sm text-[#F7F7FC] outline-none focus:border-[#00F2FE]/50"
                autoFocus
              />
              <button onClick={handleSaveGroup} className="rounded-full p-2 text-[#14B8A6] hover:bg-[#0F766E]/20">
                <FaCheck />
              </button>
              <button onClick={() => setIsEditing(false)} className="rounded-full p-2 text-[#10B981] hover:bg-[#052E24]/20">
                <FaTimes />
              </button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-lg font-bold text-[#F7F7FC] font-serif">
                {chat.name || chat.chatName || 'Group Info'}
              </h3>
              {amIAdmin && (
                <button onClick={() => setIsEditing(true)} className="rounded-full p-1.5 text-[#D4AF37] hover:text-[#F4D49A]">
                  <FaPen size={12} />
                </button>
              )}
            </div>
          )}
          {!isEditing && (
            <button onClick={onClose} className="rounded-full p-2 text-[#CBD5E1]/60 hover:bg-white/10 hover:text-white transition">
              <FaTimes />
            </button>
          )}
        </div>

        <div className="mb-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#CBD5E1]/60">
            Members ({chat.participants?.length || 0})
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {chat.participants?.map((p) => (
              <div key={p._id} className="group flex items-center justify-between rounded-2xl px-2.5 py-2 transition hover:bg-white/[0.04] border border-transparent hover:border-white/5">
                <div className="flex items-center gap-3">
                  <UserAvatar src={p.avatar} name={p.name} className="h-9 w-9 border border-white/10" />
                  <span className="text-sm font-medium text-[#CBD5E1]">{p.name}</span>
                  {isAdmin(p._id) && <FaCrown className="text-xs text-[#F4D49A]" />}
                </div>

                {amIAdmin && String(p._id) !== String(me?._id) && (
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    {!isAdmin(p._id) && (
                      <button onClick={() => handleAction(p._id, 'promote')} className="rounded-full p-2 text-[#D4AF37] hover:bg-white/10" title="Promote">
                        <FaCrown />
                      </button>
                    )}
                    <button onClick={() => handleAction(p._id, 'remove')} className="rounded-full p-2 text-[#10B981] hover:bg-[#052E24]/20" title="Remove">
                      <FaUserMinus />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button onClick={handleLeave} className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-[#FF6B8A] hover:bg-[#052E24]/20 transition">
            <FaSignOutAlt /> Leave
          </button>
          <button onClick={onClose} className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition">
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
