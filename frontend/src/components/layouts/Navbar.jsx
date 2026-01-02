// frontend/src/components/layouts/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from "../../redux/slices/authSlice";
import { useSocket } from '../../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome, FaCompass, FaCommentDots, FaHeart,
  FaUser, FaPlus, FaFilm, FaTimes, FaSignOutAlt,
  FaCog, FaShieldAlt, FaBolt, FaStickyNote
} from 'react-icons/fa';
import AppDrawer from './AppDrawer';
import ThemeToggle from '../ui/ThemeToggle';
import UserAvatar from '../ui/UserAvatar';

const NavItem = ({ to, icon, label, active, onClick, isMobile, badge = 0, color }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`relative flex items-center gap-4 rounded-2xl transition-all duration-300 group ${active ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30' : `${color || 'text-gray-500 dark:text-gray-400'} hover:bg-gray-100 dark:hover:bg-white/5 hover:text-cyan-500`} ${isMobile ? 'flex-col gap-1 p-2 text-[10px] justify-center' : 'p-3'}`}
  >
    <div className="relative group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { size: isMobile ? 24 : 22 })}
      {badge > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-bold items-center justify-center">{badge > 9 ? '9+' : badge}</span></span>}
    </div>
    {!isMobile && <span className="font-semibold text-sm tracking-wide">{label}</span>}
  </Link>
);

export default function Navbar() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  const [activityCount, setActivityCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Listeners
  useEffect(() => {
    if (!user?._id || !socket) return;
    
    const onNotif = () => setActivityCount(p => p + 1);
    const onMsg = (payload) => {
        const currentPath = window.location.pathname;
        const chatId = payload.chatId || payload.room;
        if (!currentPath.includes(chatId)) setMsgCount(p => p + 1);
    };

    socket.on('notification', onNotif);
    socket.on('receiveMessage', onMsg);
    
    // Clear counts on page visit
    if(location.pathname === '/notifications') setActivityCount(0);
    if(location.pathname === '/chat') setMsgCount(0);

    return () => {
      socket.off('notification', onNotif);
      socket.off('receiveMessage', onMsg);
    };
  }, [user, socket, location.pathname]);

  const handleLogout = () => {
    if (socket) socket.disconnect();
    dispatch(logout());
    navigate('/login');
  };

  const openCreate = () => window.dispatchEvent(new CustomEvent('openCreatePost'));
  const isActive = (p) => location.pathname === p;

  const navLinks = [
    { to: '/', icon: <FaHome />, label: 'Home' },
    { to: '/explore', icon: <FaCompass />, label: 'Explore' },
    { to: '/reels', icon: <FaFilm />, label: 'Reels' },
    { to: '/chat', icon: <FaCommentDots />, label: 'Messages', badge: msgCount },
    { to: '/notifications', icon: <FaHeart />, label: 'Activity', badge: activityCount },
    { to: `/profile/${user?._id}`, icon: <FaUser />, label: 'Profile' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[280px] bg-white/80 dark:bg-[#0B1120]/90 backdrop-blur-xl border-r dark:border-gray-800 z-50">
        <div className="p-6 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg"><FaBolt size={20} /></div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 bg-clip-text text-transparent tracking-tighter">SocialApp</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-6">
          <nav className="space-y-1">
            {navLinks.map(l => <NavItem key={l.label} {...l} active={isActive(l.to)} />)}
            {user?.role === 'admin' && <NavItem to="/admin/dashboard" icon={<FaShieldAlt />} label="Admin" color="text-red-500" />}
          </nav>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openCreate} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-xl font-bold tracking-wide">
            <FaPlus /> Create Post
          </motion.button>

          <div className="pt-4 border-t dark:border-gray-800/50">
            <AppDrawer />
          </div>
        </div>

        <div className="p-6 border-t dark:border-gray-800 mt-auto bg-white/50 dark:bg-[#0B1120]/50 backdrop-blur-md shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
                <Link to="/settings" className="text-gray-500 hover:text-indigo-500"><FaCog /></Link>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500"><FaSignOutAlt /></button>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl z-50 flex justify-between items-center px-6 pt-3 pb-safe transition-all">
          <NavItem to="/" icon={<FaHome />} active={isActive('/')} isMobile />
          <NavItem to="/explore" icon={<FaCompass />} active={isActive('/explore')} isMobile />
          
          <div className="-mt-8">
            <motion.button whileTap={{ scale: 0.9 }} onClick={openCreate} className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg border-4 border-gray-50 dark:border-slate-900"><FaPlus size={24} /></motion.button>
          </div>

          {/* 🔥 SWAPPED: Message Icon Here */}
          <NavItem to="/chat" icon={<FaCommentDots />} active={isActive('/chat')} badge={msgCount} isMobile />

          <button onClick={() => setShowMobileMenu(true)} className="flex flex-col items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-500 transition-colors">
            <UserAvatar src={user?.avatar} name={user?.name} className={`w-6 h-6 border-2 ${showMobileMenu ? 'border-cyan-500' : 'border-transparent'}`} />
            Menu
          </button>
      </nav>

      {/* MOBILE FULL MENU */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="md:hidden fixed inset-0 z-[60] bg-white dark:bg-slate-900 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Menu</h2>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><FaTimes size={20} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              
              {/* 🔥 SWAPPED: Activity Here */}
              <Link to="/notifications" onClick={()=>setShowMobileMenu(false)} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex flex-col items-center gap-2 relative">
                  {activityCount > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></span>}
                  <FaHeart className="text-2xl text-pink-500"/> Activity
              </Link>

              <Link to="/settings" onClick={()=>setShowMobileMenu(false)} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex flex-col items-center gap-2"><FaCog className="text-2xl text-blue-500"/> Settings</Link>
              <Link to="/drafts" onClick={()=>setShowMobileMenu(false)} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex flex-col items-center gap-2"><FaStickyNote className="text-2xl text-yellow-500"/> Drafts</Link>
              
              {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" onClick={()=>setShowMobileMenu(false)} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl flex flex-col items-center gap-2 border border-red-100 dark:border-red-900"><FaShieldAlt className="text-2xl text-red-500"/> Admin</Link>
              )}
            </div>
            
            <AppDrawer />
            
            <div className="mt-8 pt-6 border-t dark:border-gray-800 flex justify-between">
                <button onClick={handleLogout} className="text-red-500 font-bold flex items-center gap-2"><FaSignOutAlt /> Log Out</button>
                <ThemeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}