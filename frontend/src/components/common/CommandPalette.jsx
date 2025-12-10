// frontend/src/components/common/CommandPalette.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaHashtag, FaUser, FaBolt, FaVideo, FaCog, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeProvider';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const nav = useNavigate();
  const { toggle: toggleTheme } = useTheme();

  // Toggle on Cmd+K or Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const actions = [
    { id: 'home', title: 'Go to Feed', icon: <FaHashtag />, action: () => nav('/') },
    { id: 'reels', title: 'Watch Reels', icon: <FaBolt />, action: () => nav('/reels') },
    { id: 'explore', title: 'Explore', icon: <FaSearch />, action: () => nav('/explore') },
    { id: 'messages', title: 'Messages', icon: <FaUser />, action: () => nav('/chat') },
    { id: 'live', title: 'Go Live Studio', icon: <FaVideo />, action: () => nav('/live/studio') },
    { id: 'theme', title: 'Toggle Theme', icon: <FaMoon />, action: toggleTheme },
  ];

  const filtered = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  const execute = (action) => {
    action();
    setOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4" onClick={() => setOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center p-4 border-b dark:border-gray-700">
              <FaSearch className="text-gray-400 mr-3" />
              <input 
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent outline-none text-lg text-gray-800 dark:text-gray-100"
              />
              <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">ESC</span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2">
              {filtered.length === 0 && <div className="p-4 text-center text-gray-500">No results found.</div>}
              {filtered.map(action => (
                <button
                  key={action.id}
                  onClick={() => execute(action.action)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                    {action.icon}
                  </div>
                  <span className="font-medium">{action.title}</span>
                </button>
              ))}
            </div>
            
            <div className="p-2 bg-gray-50 dark:bg-gray-800/50 text-xs text-center text-gray-400 border-t dark:border-gray-700">
              Pro tip: Use arrow keys to navigate (coming soon)
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}