// frontend/src/components/chat/NewChatModal.jsx
import React, { useState, useEffect } from 'react';
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
          setResults(r.data.users || []);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">New Message</h2>
            <button onClick={onClose}><FaTimes/></button>
        </div>
        
        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people..." 
            autoFocus
            className="w-full p-3 pl-10 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 mb-2 custom-scrollbar">
          {loading && <div className="text-center text-xs text-gray-500">Searching...</div>}
          {!loading && results.length === 0 && query.length > 2 && <div className="text-center text-gray-500">No users found</div>}
          
          {results.map(u => (
            <div 
                key={u._id} 
                onClick={() => { onUserSelect(u._id); onClose(); }} 
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition"
            >
              <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10" />
              <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-gray-500">@{u.email.split('@')[0]}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}