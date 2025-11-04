// frontend/src/components/layouts/Navbar.jsx
import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from "../../redux/slices/authSlice";

import { ThemeContext } from '../../contexts/ThemeProvider';
import { motion } from 'framer-motion';

const Icon = ({ name, active }) => {
  const common = `w-6 h-6 ${active ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-100'}`;
  if (name === 'home') return <svg className={common} /* ... */ viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.5L12 4l9 5.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /></svg>;
  if (name === 'explore') return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" /></svg>;
  if (name === 'plus') return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
  if (name === 'message') return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h.01M12 8h.01M17 8h.01M21 12c0 4.418-4.03 8-9 8a9.72 9.72 0 01-4-.9L3 20l1.1-4.1A8.94 8.94 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>;
  if (name === 'heart') return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8c0-2.2 1.8-4 4-4 1.4 0 2.5.7 3 1.8.5-1.1 1.6-1.8 3-1.8 2.2 0 4 1.8 4 4 0 4.4-7 10-7 10s-7-5.6-7-10z" /></svg>;
  return null;
};

const IconButton = ({ children, label, onClick, active }) => (
  <motion.button whileTap={{ scale: 0.95 }} title={label} onClick={onClick}
    className={`p-2 rounded-full ${active ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
    {children}
  </motion.button>
);

export default function Navbar() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const { theme, toggle } = useContext(ThemeContext);
  const [query, setQuery] = useState('');

  const doSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    nav(`/explore?q=${encodeURIComponent(query)}`);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 z-30">
            <Link to="/" className="flex items-center gap-2">
              <div style={{ zIndex: 30 }} className="text-xl font-extrabold" >
                <span style={{backgroundImage:'linear-gradient(90deg,#6a4dff,#ff5e6f)', WebkitBackgroundClip:'text', color:'transparent'}}>UltimateSocial</span>
              </div>
            </Link>
          </div>

          <form onSubmit={doSearch} className="flex-1 max-w-xl mx-4 hidden sm:flex items-center justify-center z-10">
            <div className="w-full">
              <input className="w-full bg-gray-100 dark:bg-gray-800 rounded-full py-2 px-4 text-sm outline-none"
                placeholder="Search users, tags, posts..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </form>

          <div className="flex items-center gap-3">
            <IconButton active={isActive('/')} onClick={() => nav('/')} label="Home"><Icon name="home" active={isActive('/')} /></IconButton>
            <IconButton active={isActive('/explore')} onClick={() => nav('/explore')} label="Explore"><Icon name="explore" active={isActive('/explore')} /></IconButton>
            <IconButton onClick={() => window.dispatchEvent(new CustomEvent('openCreatePost'))} label="Create"><Icon name="plus" /></IconButton>

            <IconButton active={isActive('/chat')} onClick={() => nav('/chat')} label="Messages"><Icon name="message" active={isActive('/chat')} /></IconButton>
            <IconButton active={isActive('/notifications')} onClick={() => nav('/notifications')} label="Notifications"><Icon name="heart" active={isActive('/notifications')} /></IconButton>

            <div className="border-l h-6 border-gray-200 dark:border-gray-800 ml-2"></div>

            {user ? (
              <div className="flex items-center gap-3 ml-3">
                <button onClick={() => nav(`/profile/${user._id}`)} className="flex items-center gap-2">
                  <img src={user.avatar || '/default-avatar.png'} alt="me" className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
                </button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => dispatch(logout())} className="px-3 py-1 rounded text-sm bg-gray-100 dark:bg-gray-800">
                  Logout
                </motion.button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="px-3 py-1 rounded bg-indigo-600 text-white">Log in</Link>
                <Link to="/register" className="px-3 py-1 rounded border">Sign up</Link>
              </div>
            )}

            <button onClick={toggle} className="ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Toggle theme">
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
