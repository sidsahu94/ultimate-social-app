import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import UserAvatar from '../ui/UserAvatar';
import { Link } from 'react-router-dom';
import FollowButton from '../profile/FollowButton';

export default function LikesModal({ isOpen, onClose, postId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      // We need a backend endpoint for this. 
      // For now, we will fetch the post again and expand the 'likes' array 
      // (assuming backend populates it, or we add a specific endpoint).
      // Let's assume we need to add a specific endpoint to be scalable.
      API.get(`/posts/${postId}/likes`)
         .then(res => setUsers(res.data))
         .catch(() => setUsers([]))
         .finally(() => setLoading(false));
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-xl flex flex-col max-h-[60vh]">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold">Likes</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? <div className="p-4 text-center text-gray-500">Loading...</div> : (
            users.length === 0 ? <div className="p-4 text-center text-gray-500">No likes yet.</div> :
            users.map(u => (
              <div key={u._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition">
                <Link to={`/profile/${u._id}`} onClick={onClose} className="flex items-center gap-3">
                  <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10" />
                  <span className="font-semibold text-sm">{u.name}</span>
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