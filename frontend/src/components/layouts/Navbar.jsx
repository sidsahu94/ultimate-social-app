import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from "../../redux/slices/authSlice";
import socket from '../../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome, FaCompass, FaCommentDots, FaHeart,
  FaUser, FaPlus, FaFilm, FaTimes, FaSignOutAlt,
  FaCog, FaWallet, FaGamepad, FaShieldAlt, FaBolt
} from 'react-icons/fa';
import AppDrawer from './AppDrawer';
import ThemeToggle from '../ui/ThemeToggle';
import UserAvatar from '../ui/UserAvatar';

// --- NAV ITEM COMPONENT ---
const NavItem = ({ to, icon, label, active, onClick, isMobile, badge = 0 }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`
      relative flex items-center gap-4 rounded-2xl transition-all duration-300 group
      ${active
        ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30' // 🎨 NEW: Electric Cyan Active State
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-cyan-500'}
      ${isMobile ? 'flex-col gap-1 p-2 text-[10px] justify-center' : 'p-3'}
    `}
  >
    <div className="relative group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { size: isMobile ? 24 : 22 })}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-gray-900"></span>
        </span>
      )}
    </div>
    {!isMobile && <span className="font-semibold text-sm tracking-wide">{label}</span>}
  </Link>
);

// --- MOBILE MENU CARD COMPONENT ---
const MenuCard = ({ to, icon, label, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick} 
    className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition active:scale-95"
  >
    <div className="text-2xl text-cyan-500">{icon}</div>
    <span className="font-medium text-sm">{label}</span>
  </Link>
);

export default function Navbar() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifCount, setNotifCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // --- Real-time Notifications ---
  useEffect(() => {
    if (!user?._id) return;

    const inc = () => setNotifCount(p => p + 1);
    
    socket.on('notification', inc);
    socket.on('receiveMessage', inc);

    return () => {
      socket.off('notification', inc);
      socket.off('receiveMessage', inc);
    };
  }, [user]);

  // --- Prevent Body Scroll when Mobile Menu is Open ---
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [showMobileMenu]);

  const handleLogout = () => {
    if (socket?.connected) socket.disconnect();
    dispatch(logout());
    navigate('/login');
    window.location.reload();
  };

  if (!user) return null;

  const isActive = (p) => location.pathname === p;
  const openCreate = () => window.dispatchEvent(new CustomEvent('openCreatePost'));

  const navLinks = [
    { to: '/', icon: <FaHome />, label: 'Home' },
    { to: '/explore', icon: <FaCompass />, label: 'Explore' },
    { to: '/reels', icon: <FaFilm />, label: 'Reels' },
    { to: '/chat', icon: <FaCommentDots />, label: 'Messages', badge: notifCount },
    { to: '/notifications', icon: <FaHeart />, label: 'Activity' },
    { to: `/profile/${user._id}`, icon: <FaUser />, label: 'Profile' },
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[280px] bg-white/80 dark:bg-[#0B1120]/90 backdrop-blur-xl border-r dark:border-gray-800 z-50 shadow-2xl shadow-cyan-900/5">
        
        {/* 1. Header (Fixed) */}
        <div className="p-6 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            {/* 🎨 NEW LOGO: Electric Bolt */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <FaBolt size={20} />
            </div>
            {/* 🎨 NEW APP NAME COLOR: Cyan to Pink Gradient */}
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 bg-clip-text text-transparent tracking-tighter">
              SocialApp
            </h1>
          </div>
        </div>

        {/* 2. Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-6">
          <nav className="space-y-1">
            {navLinks.map(l => (
              <NavItem key={l.label} {...l} active={isActive(l.to)} />
            ))}
          </nav>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreate}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/20 font-bold tracking-wide"
          >
            <FaPlus /> Create Post
          </motion.button>

          {/* App Drawer */}
          <div className="pt-4 border-t dark:border-gray-800/50">
            <AppDrawer />
          </div>
        </div>

        {/* 3. Footer (Fixed) */}
        <div className="p-6 border-t dark:border-gray-800 mt-auto bg-white/50 dark:bg-[#0B1120]/50 backdrop-blur-md shrink-0">
          <div className="flex justify-between items-center">
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 flex items-center gap-2 text-sm font-medium transition-colors">
              <FaSignOutAlt /> Logout
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM DOCK ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl z-50 flex justify-between items-center px-6 pt-3 pb-safe safe-pb transition-all">
        <NavItem to="/" icon={<FaHome />} active={isActive('/')} isMobile />
        <NavItem to="/explore" icon={<FaCompass />} active={isActive('/explore')} isMobile />

        {/* Floating FAB */}
        <div className="-mt-8">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={openCreate}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/40 border-4 border-gray-50 dark:border-slate-900"
          >
            <FaPlus size={24} />
          </motion.button>
        </div>

        <NavItem to="/chat" icon={<FaCommentDots />} active={isActive('/chat')} badge={notifCount} isMobile />

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setShowMobileMenu(true)}
          className="flex flex-col items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-500 transition-colors"
        >
          <UserAvatar src={user.avatar} name={user.name} className={`w-6 h-6 border-2 ${showMobileMenu ? 'border-cyan-500' : 'border-transparent'}`} />
          Menu
        </button>
      </nav>

      {/* ================= MOBILE FULL MENU OVERLAY ================= */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="md:hidden fixed inset-0 z-[60] bg-white dark:bg-slate-900 p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Menu</h2>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-500 transition">
                <FaTimes size={20} />
              </button>
            </div>

            {/* Profile Card */}
            <div className="flex items-center gap-4 mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <UserAvatar src={user.avatar} name={user.name} className="w-16 h-16" />
              <div>
                <h3 className="font-bold text-lg">{user.name}</h3>
                <Link to={`/profile/${user._id}`} onClick={() => setShowMobileMenu(false)} className="text-cyan-500 text-sm font-medium hover:underline">
                  View Profile
                </Link>
              </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <MenuCard to="/reels" icon={<FaFilm />} label="Reels" onClick={() => setShowMobileMenu(false)} />
              <MenuCard to="/wallet" icon={<FaWallet />} label="Wallet" onClick={() => setShowMobileMenu(false)} />
              <MenuCard to="/games" icon={<FaGamepad />} label="Games" onClick={() => setShowMobileMenu(false)} />
              <MenuCard to="/settings" icon={<FaCog />} label="Settings" onClick={() => setShowMobileMenu(false)} />
            </div>

            {/* Apps Drawer Integration */}
            <div className="mb-8">
              <h3 className="font-bold mb-4 text-gray-400 uppercase text-xs tracking-wider">Apps</h3>
              <AppDrawer />
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-between items-center border-t dark:border-gray-800 pt-6 mt-auto">
              <button onClick={handleLogout} className="text-red-500 font-bold flex items-center gap-2">
                <FaSignOutAlt /> Log Out
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}