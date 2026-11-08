// frontend/src/components/posts/LikesModal.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaHeart } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { Link } from 'react-router-dom';
import FollowButton from '../profile/FollowButton';

export default function LikesModal({ isOpen, onClose, postId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      API.get(`/posts/${postId}/likes`)
         .then(res => {
           const payload = res.data?.data || res.data;
           setUsers(Array.isArray(payload) ? payload : []);
         })
         .catch(() => setUsers([]))
         .finally(() => setLoading(false));
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#070B14]/95 border border-white/15 w-full max-w-sm rounded-3xl shadow-2xl flex flex-col max-h-[60vh] overflow-hidden backdrop-blur-2xl"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#171A26]/50">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#F7F7FC] flex items-center gap-2">
            <FaHeart className="text-[#10B981]" /> Liked By
          </h3>
          <button onClick={onClose} className="p-1 text-[#A5A9BB] hover:text-[#F7F7FC] transition">
            <FaTimes size={14} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#A5A9BB]">Loading audience...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A5A9BB]">No likes recorded yet.</div>
          ) : (
            users.map(u => (
              <div key={u._id} className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-2xl transition">
                <Link to={`/profile/${u._id}`} onClick={onClose} className="flex items-center gap-3 min-w-0 flex-1">
                  <UserAvatar src={u.avatar} name={u.name} className="w-9 h-9 border border-white/10" />
                  <span className="font-semibold text-xs text-[#F7F7FC] truncate">{u.name}</span>
                </Link>
                <FollowButton userId={u._id} />
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
