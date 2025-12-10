import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from "../../redux/slices/authSlice";
import socket from '../../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaCompass, FaCommentDots, FaHeart, 
  FaUser, FaPlus, FaSignOutAlt, FaFilm, FaCog, FaBell 
} from 'react-icons/fa';
import AppDrawer from './AppDrawer'; // Ensure this component exists from previous steps

const NavItem = ({ to, icon, label, active, onClick, isMobile, badge }) => {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`
        relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group
        ${active 
          ? 'text-white bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400'}
        ${isMobile ? 'flex-col gap-1 p-2 text-[10px] justify-center' : ''}
      `}
    >
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative">
        {React.cloneElement(icon, { size: isMobile ? 24 : 22 })}
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </motion.div>
      {!isMobile && <span className="font-semibold text-sm tracking-wide">{label}</span>}
    </Link>
  );
};

export default function Navbar() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifCount, setNotifCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false); // Dropdown state

  useEffect(() => {
    if (!user?._id) return;
    
    // Live Notification Listener
    const onNotif = () => setNotifCount(prev => prev + 1);
    const onMsg = () => setNotifCount(prev => prev + 1);

    socket.on('notification', onNotif);
    socket.on('receiveMessage', onMsg);
    
    return () => { 
        socket.off('notification', onNotif); 
        socket.off('receiveMessage', onMsg); 
    };
  }, [user]);

  // Clean Logout
  const handleLogout = () => {
    if (socket.connected) socket.disconnect();
    dispatch(logout());
    navigate('/login');
    window.location.reload(); 
  };

  const isActive = (path) => location.pathname === path;
  const openCreate = () => window.dispatchEvent(new CustomEvent('openCreatePost'));

  if (!user) return null;

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 w-[260px] glass-panel rounded-3xl z-50 p-6 border border-white/20 dark:border-white/5 bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-2xl shadow-xl overflow-y-auto no-scrollbar">
        
        {/* Logo */}
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
             <img src="/logo.svg" className="w-6 h-6" alt="S" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent tracking-tight">SocialApp</h1>
        </div>

        {/* Main Nav */}
        <nav className="space-y-1">
          <NavItem to="/" icon={<FaHome />} label="Home" active={isActive('/')} />
          <NavItem to="/explore" icon={<FaCompass />} label="Explore" active={isActive('/explore')} />
          <NavItem to="/reels" icon={<FaFilm />} label="Reels" active={isActive('/reels')} />
          <NavItem to="/chat" icon={<FaCommentDots />} label="Messages" active={isActive('/chat')} />
          
          {/* Notification Dropdown Trigger */}
          <div className="relative">
            <button 
                onClick={() => setShowNotif(!showNotif)}
                className={`w-full relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group ${showNotif ? 'bg-gray-100 dark:bg-white/10 text-indigo-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
            >
                <div className="relative">
                    <FaHeart size={22} className={showNotif ? 'text-red-500' : ''} />
                    {notifCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
                </div>
                <span className="font-semibold text-sm tracking-wide">Activity</span>
            </button>

            <AnimatePresence>
                {showNotif && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-gray-700 p-2 z-50 origin-top-left"
                    >
                        <div className="p-3 border-b dark:border-gray-800 text-sm font-bold text-gray-500">Recent Updates</div>
                        <div className="max-h-60 overflow-y-auto p-2 text-center text-sm text-gray-500">
                            {notifCount === 0 ? "No new notifications" : "You have new activity!"}
                            <Link to="/notifications" onClick={() => { setShowNotif(false); setNotifCount(0); }} className="block mt-3 text-indigo-500 font-bold hover:underline">
                                View All
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <NavItem to={`/profile/${user._id}`} icon={<FaUser />} label="Profile" active={isActive(`/profile/${user._id}`)} />
          <NavItem to="/settings" icon={<FaCog />} label="Settings" active={isActive('/settings')} />
        </nav>

        {/* Create Button */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl p-3 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 font-bold text-sm tracking-wide"
        >
          <FaPlus /> Create Post
        </motion.button>

        {/* Apps Drawer (Expanded Features) */}
        <div className="mt-6">
            <AppDrawer />
        </div>

        {/* Logout */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/10">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all w-full font-medium text-sm"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* --- MOBILE FLOATING DOCK --- */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/90 dark:bg-[#1E293B]/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full shadow-2xl z-50 flex justify-between items-center px-6 py-3">
          <NavItem to="/" icon={<FaHome />} active={isActive('/')} isMobile />
          <NavItem to="/explore" icon={<FaCompass />} active={isActive('/explore')} isMobile />
          
          <div className="relative -top-8">
            <motion.button 
              onClick={openCreate}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 border-4 border-[#f8fafc] dark:border-[#0f172a]"
            >
              <FaPlus size={22} />
            </motion.button>
          </div>

          <NavItem to="/reels" icon={<FaFilm />} active={isActive('/reels')} isMobile />
          
          {/* Mobile Profile Icon */}
          <Link to={`/profile/${user._id}`} className={`relative p-1 rounded-full ${isActive(`/profile/${user._id}`) ? 'ring-2 ring-indigo-500' : ''}`}>
             <img src={user.avatar || '/default-avatar.png'} className="w-7 h-7 rounded-full object-cover" alt="Me" />
          </Link>
      </nav>
    </>
  );
}