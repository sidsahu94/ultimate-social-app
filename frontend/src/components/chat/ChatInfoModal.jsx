//frontend/src/components/chat/ChatInfoModal.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaSignOutAlt, FaCrown, FaUserMinus, FaArrowUp, FaPen, FaCheck } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { useToast } from '../ui/ToastProvider';
import { useSelector } from 'react-redux';

export default function ChatInfoModal({ isOpen, onClose, chat, onLeave, onUpdate }) {
  const { user: me } = useSelector(s => s.auth);
  const { add } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(chat?.name || '');

  if (!isOpen || !chat) return null;

  // Check if I am admin
  const amIAdmin = chat.participants?.find(p => p._id === me._id)?.isAdmin || chat.admins?.some(a => (typeof a === 'string' ? a : a._id) === me._id);

  const handleAction = async (userId, action) => {
    try {
      const res = await API.put(`/chat/${chat._id}/members`, { userId, action });
      if (onUpdate) onUpdate(res.data);
      add(`User ${action}ed`, { type: 'success' });
    } catch (e) {
      add('Action failed', { type: 'error' });
    }
  };

  // 🔥 FIXED: Updated endpoint to match backend route (/details)
  const handleSaveGroup = async () => {
      if(!editName.trim()) return;
      try {
          const res = await API.put(`/chat/${chat._id}/details`, { name: editName });
          
          if(onUpdate) onUpdate(res.data);
          setIsEditing(false);
          add("Group updated", { type: 'success' });
      } catch(e) { 
          add("Failed to update group", { type: 'error' }); 
      }
  };

  const handleLeave = async () => {
    if (!confirm("Leave group?")) return;
    try {
      await API.post(`/chat/${chat._id}/leave`); 
      onLeave();
      onClose();
    } catch (e) { add("Failed", { type: 'error' }); }
  };

  const isAdmin = (uid) => chat.admins?.some(a => (typeof a === 'string' ? a : a._id) === uid);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-xl">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          {isEditing ? (
              <div className="flex gap-2 w-full mr-4">
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-sm outline-none border focus:border-indigo-500"
                    autoFocus
                  />
                  <button onClick={handleSaveGroup} className="text-green-500 hover:bg-green-50 p-1 rounded"><FaCheck /></button>
                  <button onClick={() => setIsEditing(false)} className="text-red-500 hover:bg-red-50 p-1 rounded"><FaTimes /></button>
              </div>
          ) : (
              <div className="flex items-center gap-2 overflow-hidden">
                  <h3 className="font-bold text-lg truncate">{chat.name || "Group Info"}</h3>
                  {amIAdmin && (
                    <button onClick={() => { setEditName(chat.name); setIsEditing(true); }} className="text-gray-400 hover:text-indigo-500 p-1">
                        <FaPen size={12}/>
                    </button>
                  )}
              </div>
          )}
          {!isEditing && <button onClick={onClose}><FaTimes /></button>}
        </div>

        <div className="mb-6">
          <div className="text-xs font-bold text-gray-500 uppercase mb-2">Members ({chat.participants?.length})</div>
          <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
            {chat.participants?.map(p => (
              <div key={p._id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group">
                <div className="flex items-center gap-3">
                  <UserAvatar src={p.avatar} name={p.name} className="w-8 h-8" />
                  <span className="text-sm font-medium dark:text-gray-200">{p.name}</span>
                  {isAdmin(p._id) && <FaCrown className="text-yellow-500 text-xs" />}
                </div>
                
                {amIAdmin && p._id !== me._id && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isAdmin(p._id) && (
                            <button onClick={() => handleAction(p._id, 'promote')} className="p-1.5 bg-blue-100 text-blue-600 rounded" title="Promote">
                                <FaArrowUp size={10} />
                            </button>
                        )}
                        <button onClick={() => handleAction(p._id, 'kick')} className="p-1.5 bg-red-100 text-red-600 rounded" title="Kick">
                            <FaUserMinus size={10} />
                        </button>
                    </div>
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