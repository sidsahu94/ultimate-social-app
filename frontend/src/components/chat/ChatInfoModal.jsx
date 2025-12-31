import React from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaSignOutAlt, FaCrown } from 'react-icons/fa'; // Added FaCrown
import UserAvatar from '../ui/UserAvatar';
import { useToast } from '../ui/ToastProvider';

export default function ChatInfoModal({ isOpen, onClose, chat, onLeave }) {
  const { add } = useToast();

  if (!isOpen || !chat) return null;

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      await API.post(`/chat/${chat._id}/leave`); 
      onLeave();
      onClose();
    } catch (e) {
      add("Failed to leave group", { type: 'error' });
    }
  };

  // Safe check for admins array (it might be undefined if not populated properly or old chat schema)
  const isAdmin = (userId) => {
      // Assuming chat.admins is an array of IDs or Objects
      return chat.admins?.some(admin => 
          (typeof admin === 'string' ? admin : admin._id) === userId
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">{chat.name || "Group Info"}</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold text-gray-500 uppercase mb-2">Members ({chat.participants?.length})</div>
          <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
            {chat.participants?.map(p => (
              <div key={p._id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
                <div className="flex items-center gap-3">
                  <UserAvatar src={p.avatar} name={p.name} className="w-8 h-8" />
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                
                {/* 🔥 ADMIN INDICATOR */}
                {isAdmin(p._id) && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <FaCrown size={10} /> ADMIN
                    </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {chat.isGroup && (
          <button onClick={handleLeave} className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition">
            <FaSignOutAlt /> Leave Group
          </button>
        )}
      </motion.div>
    </div>
  );
}