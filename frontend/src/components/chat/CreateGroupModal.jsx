import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaUsers, FaSearch, FaCheck } from 'react-icons/fa';

export default function CreateGroupModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);

  const search = async (q) => {
    setQuery(q);
    if (q.length > 2) {
      const r = await API.get(`/users/search?q=${q}`);
      setResults(r.data.users || []);
    }
  };

  const toggleUser = (u) => {
    if (selected.find(s => s._id === u._id)) {
      setSelected(selected.filter(s => s._id !== u._id));
    } else {
      setSelected([...selected, u]);
    }
  };

  const create = async () => {
    if (!name || selected.length === 0) return;
    try {
      await API.post('/chat', {
        name,
        isGroup: true,
        participants: selected.map(u => u._id)
      });
      onCreated();
      onClose();
    } catch (e) { alert('Failed'); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Create Group</h2>
        
        <input 
          value={name} 
          onChange={e => setName(e.target.value)}
          placeholder="Group Name" 
          className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 outline-none"
        />

        <div className="mb-2 font-medium text-sm">Add Members</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map(u => (
            <span key={u._id} onClick={() => toggleUser(u)} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs cursor-pointer flex items-center gap-1">
              {u.name} <FaTimes />
            </span>
          ))}
        </div>

        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input 
            value={query} 
            onChange={e => search(e.target.value)}
            placeholder="Search users..." 
            className="w-full p-3 pl-10 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
          {results.map(u => (
            <div key={u._id} onClick={() => toggleUser(u)} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
              <img src={u.avatar || '/default-avatar.png'} className="w-8 h-8 rounded-full" />
              <div className="flex-1">{u.name}</div>
              {selected.find(s => s._id === u._id) && <FaCheck className="text-green-500" />}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-500">Cancel</button>
          <button onClick={create} disabled={!name || selected.length===0} className="btn-primary">Create</button>
        </div>
      </motion.div>
    </div>
  );
}