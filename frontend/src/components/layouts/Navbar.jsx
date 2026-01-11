// frontend/src/components/layouts/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from "../../redux/slices/authSlice";
import { useSocket } from '../../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
// Icons
import { 
  IoHome, IoHomeOutline,
  IoCompass, IoCompassOutline,
  IoVideocam, IoVideocamOutline,
  IoChatbubbleEllipses, IoChatbubbleEllipsesOutline,
  IoHeart, IoHeartOutline,
  IoPerson, IoPersonOutline,
  IoAddCircle,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoLogOutOutline,
  IoClose,
  IoDownloadOutline
} from 'react-icons/io5';
import { FaFire } from 'react-icons/fa'; // Retaining FaFire for the classic streak look

// Components & Hooks
import AppDrawer from './AppDrawer';
import ThemeToggle from '../ui/ThemeToggle';
import UserAvatar from '../ui/UserAvatar';
import LevelProgress from '../ui/LevelProgress'; // Gamification
import usePWAInstall from '../../hooks/usePWAInstall'; // PWA

// --- Desktop Nav Item Component ---
const NavItem = ({ to, iconActive, iconInactive, label, active, onClick, badge = 0, color }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`
      relative flex items-center gap-4 rounded-[16px] px-4 py-3 my-1.5 transition-all duration-300 group
      ${active 
        ? 'bg-[#E0E5EC] dark:bg-[#141517] shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_#0b0c0d,inset_-3px_-3px_6px_#202125]' 
        : 'hover:bg-white/50 dark:hover:bg-white/5'
      }
      ${color || ''}
    `}
  >
    {/* Icon Wrapper */}
    <div className={`
      relative text-2xl transition-all duration-300
      ${active ? 'scale-110 drop-shadow-md' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
    `}>
      {active ? (
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600">
          {iconActive}
        </span>
      ) : iconInactive}

      {/* Notification Badge */}
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white dark:border-gray-900 text-[8px] text-white font-bold items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        </span>
      )}
    </div>

    {/* Label */}
    <span className={`
      font-bold text-sm tracking-wide transition-colors duration-300
      ${active ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400' : 'text-gray-500 dark:text-gray-400'}
    `}>
      {label}
    </span>

    {/* Active Indicator Dot */}
    {active && (
      <motion.div 
        layoutId="active-dot"
        className="absolute right-4 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
      />
    )}
  </Link>
);

// --- Mobile Nav Item Component ---
const MobileNavItem = ({ to, iconActive, iconInactive, active, onClick, badge = 0, isProfile, user }) => {
  if (isProfile) {
    return (
      <button onClick={onClick} className="flex items-center justify-center relative group">
        <div className={`p-[2px] rounded-full transition-all duration-300 ${active ? 'bg-gradient-to-tr from-primary to-secondary shadow-neon-blue scale-110' : 'bg-transparent'}`}>
           <UserAvatar src={user?.avatar} name={user?.name} className="w-7 h-7" showStatus={false} />
        </div>
      </button>
    );
  }
  return (
    <Link to={to} onClick={onClick} className="flex flex-col items-center justify-center relative w-full h-full">
      <div className={`text-2xl transition-all duration-300 ${active ? 'text-primary -translate-y-1 drop-shadow-[0_0_10px_rgba(41,121,255,0.6)]' : 'text-gray-400 dark:text-gray-500'}`}>
        {active ? iconActive : iconInactive}
        {badge > 0 && <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full border border-[#E0E5EC] dark:border-[#1A1B1E]"></span>}
      </div>
      {active && <motion.div layoutId="mobile-glow" className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full shadow-neon-cyan" />}
    </Link>
  );
};

export default function Navbar() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { isReady, installApp } = usePWAInstall(); // 🔥 PWA Hook

  const [activityCount, setActivityCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // --- Real-time Listeners ---
  useEffect(() => {
    if (!user?._id || !socket) return;
    
    const onNotif = () => setActivityCount(p => p + 1);
    const onMsg = (payload) => {
        const currentPath = window.location.pathname;
        const chatId = payload.chatId || payload.room;
        if (!currentPath.includes(chatId)) setMsgCount(p => p + 1);
    };

    // 🔥 Clear badge when user views notifications
    const onClearNotifs = () => setActivityCount(0);

    socket.on('notification', onNotif);
    socket.on('receiveMessage', onMsg);
    window.addEventListener('notificationsRead', onClearNotifs);
    
    if(location.pathname === '/notifications') setActivityCount(0);
    if(location.pathname === '/chat') setMsgCount(0);

    return () => {
      socket.off('notification', onNotif);
      socket.off('receiveMessage', onMsg);
      window.removeEventListener('notificationsRead', onClearNotifs);
    };
  }, [user, socket, location.pathname]);

  const handleLogout = () => {
    if (socket) socket.disconnect();
    dispatch(logout());
    navigate('/login');
  };

  const openCreate = () => window.dispatchEvent(new CustomEvent('openCreatePost'));
  const isActive = (p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p));

  const desktopLinks = [
    { to: '/', iconActive: <IoHome />, iconInactive: <IoHomeOutline />, label: 'Home' },
    { to: '/explore', iconActive: <IoCompass />, iconInactive: <IoCompassOutline />, label: 'Explore' },
    { to: '/reels', iconActive: <IoVideocam />, iconInactive: <IoVideocamOutline />, label: 'Reels' },
    { to: '/chat', iconActive: <IoChatbubbleEllipses />, iconInactive: <IoChatbubbleEllipsesOutline />, label: 'Messages', badge: msgCount },
    { to: '/notifications', iconActive: <IoHeart />, iconInactive: <IoHeartOutline />, label: 'Activity', badge: activityCount },
    { to: `/profile/${user?._id}`, iconActive: <IoPerson />, iconInactive: <IoPersonOutline />, label: 'Profile' },
  ];

  return (
    <>
      {/* ======================= 1. DESKTOP SIDEBAR ======================= */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[280px] bg-[#E0E5EC] dark:bg-[#1A1B1E] border-r border-white/50 dark:border-white/5 z-50">
        
        {/* Header & Gamification */}
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-neon-blue">
                <span className="font-black text-xl">S</span>
            </div>
            <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tighter">
                    SocialApp
                </h1>
                {/* 🔥 Streak Display */}
                {user?.streak?.count > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 animate-pulse mt-0.5">
                        <FaFire /> {user.streak.count} Day Streak!
                    </div>
                )}
            </div>
          </div>
          
          {/* 🔥 Level Progress Bar */}
          <LevelProgress />
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2 space-y-6">
          <nav>
            {desktopLinks.map(l => <NavItem key={l.label} {...l} active={isActive(l.to)} />)}
            {user?.role === 'admin' && <NavItem to="/admin/dashboard" iconActive={<IoShieldCheckmarkOutline />} iconInactive={<IoShieldCheckmarkOutline />} label="Admin" color="text-red-500" />}
          </nav>

          {/* Create Button */}
          <button onClick={openCreate} className="btn-neon w-full flex items-center justify-center gap-2 mt-4 group">
            <IoAddCircle className="text-2xl group-hover:rotate-90 transition-transform duration-300" /> 
            <span>Create</span>
          </button>

          {/* 🔥 PWA Install Button */}
          {isReady && (
              <button 
                onClick={installApp}
                className="mt-4 w-full py-3 rounded-[16px] bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:scale-[1.02] transition-transform animate-pulse"
              >
                <IoDownloadOutline size={20} /> Install App
              </button>
          )}

          {/* App Drawer (Ecosystem) */}
          <div className="pt-6 mt-4 border-t border-gray-300 dark:border-gray-800">
            <AppDrawer />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-300 dark:border-gray-800 mt-auto bg-[#E0E5EC] dark:bg-[#1A1B1E]">
          <div className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-3 rounded-[16px] shadow-neu-pressed dark:shadow-neu-dark-pressed">
            <div className="flex gap-1">
                <Link to="/settings" className="p-2 text-gray-500 hover:text-primary transition rounded-full hover:bg-white dark:hover:bg-gray-800"><IoSettingsOutline size={20}/></Link>
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition rounded-full hover:bg-white dark:hover:bg-gray-800"><IoLogOutOutline size={22}/></button>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ======================= 2. MOBILE TOP BAR ======================= */}
      <nav className="md:hidden fixed top-4 left-4 right-4 h-[60px] z-50 flex justify-between items-center px-4 rounded-[20px] bg-[#E0E5EC]/90 dark:bg-[#1A1B1E]/90 backdrop-blur-md shadow-neu-flat dark:shadow-neu-dark-flat border border-white/30 dark:border-white/5 transition-all">
          <div className="flex items-center gap-2" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
             <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-sm">
                <span className="font-black text-sm">S</span>
             </div>
             <div>
                 <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none">Social</h1>
                 {/* Mobile Streak */}
                 {user?.streak?.count > 0 && <span className="text-[9px] text-orange-500 font-bold flex items-center gap-0.5"><FaFire/> {user.streak.count}</span>}
             </div>
          </div>

          <div className="flex items-center gap-4">
              <Link to="/notifications" className="relative text-slate-600 dark:text-slate-300">
                  <IoHeartOutline size={26} />
                  {activityCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#E0E5EC] dark:border-[#1A1B1E]"></span>}
              </Link>
              <Link to="/chat" className="relative text-slate-600 dark:text-slate-300">
                  <IoChatbubbleEllipsesOutline size={26} />
                  {msgCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#E0E5EC] dark:border-[#1A1B1E]">{msgCount}</span>}
              </Link>
          </div>
      </nav>

      {/* ======================= 3. MOBILE FLOATING DOCK ======================= */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 h-[70px] bg-[#E0E5EC]/90 dark:bg-[#1A1B1E]/90 backdrop-blur-xl border border-white/40 dark:border-white/5 z-50 rounded-[24px] shadow-neu-flat dark:shadow-neu-dark-flat px-2 grid grid-cols-5 items-center">
          <MobileNavItem to="/" iconActive={<IoHome />} iconInactive={<IoHomeOutline />} active={location.pathname === '/'} />
          <MobileNavItem to="/explore" iconActive={<IoCompass />} iconInactive={<IoCompassOutline />} active={location.pathname === '/explore'} />
          
          {/* Create Button (Floating) */}
          <div className="flex justify-center items-center -mt-8">
             <button 
                onClick={openCreate} 
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary text-white shadow-neon-blue flex items-center justify-center transform active:scale-90 transition-transform duration-200 border-4 border-[#E0E5EC] dark:border-[#1A1B1E]"
             >
                <IoAddCircle className="text-3xl" />
             </button>
          </div>

          <MobileNavItem to="/reels" iconActive={<IoVideocam />} iconInactive={<IoVideocamOutline />} active={location.pathname === '/reels'} />
          <MobileNavItem onClick={() => setShowMobileMenu(true)} isProfile user={user} active={showMobileMenu} />
      </nav>

      {/* ======================= 4. MOBILE FULL MENU (Drawer) ======================= */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="md:hidden fixed inset-0 z-[60] bg-[#E0E5EC] dark:bg-[#1A1B1E] p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black dark:text-white">Menu</h2>
              <button onClick={() => setShowMobileMenu(false)} className="p-3 bg-[#E0E5EC] dark:bg-[#1A1B1E] shadow-neu-flat dark:shadow-neu-dark-flat rounded-full text-slate-600 dark:text-slate-300 active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed transition-all">
                  <IoClose size={24} />
              </button>
            </div>
            
            <Link to={`/profile/${user?._id}`} onClick={() => setShowMobileMenu(false)} className="neu-card flex items-center gap-4 mb-8 !p-4 !rounded-[24px]">
                <div className="p-1 rounded-full bg-gradient-to-br from-primary to-secondary">
                    <UserAvatar src={user?.avatar} name={user?.name} className="w-14 h-14 border-2 border-[#E0E5EC] dark:border-[#1A1B1E]" />
                </div>
                <div>
                    <div className="font-bold text-lg dark:text-white">{user?.name}</div>
                    <div className="text-primary text-sm font-medium">View Profile</div>
                    {/* Mobile Level Progress */}
                    <div className="mt-2 w-32"><LevelProgress /></div>
                </div>
            </Link>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link to="/settings" onClick={()=>setShowMobileMenu(false)} className="neu-card !p-4 flex flex-col items-center gap-2 active:scale-95 transition">
                  <IoSettingsOutline className="text-2xl text-blue-500"/> <span className="font-bold text-sm">Settings</span>
              </Link>
              {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" onClick={()=>setShowMobileMenu(false)} className="neu-card !p-4 flex flex-col items-center gap-2 active:scale-95 transition border-red-500/20">
                      <IoShieldCheckmarkOutline className="text-2xl text-red-500"/> <span className="font-bold text-sm text-red-500">Admin</span>
                  </Link>
              )}
            </div>
            
            {/* Install App on Mobile Menu */}
            {isReady && (
              <button 
                onClick={installApp}
                className="mb-8 w-full py-3 rounded-[16px] bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
              >
                <IoDownloadOutline size={20} /> Install App
              </button>
            )}

            <div className="mb-8">
                <AppDrawer />
            </div>
            
            <div className="mt-auto pt-6 border-t border-gray-300 dark:border-gray-800 flex justify-between items-center">
                <button onClick={handleLogout} className="text-red-500 font-bold flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition">
                    <IoLogOutOutline size={20} /> Log Out
                </button>
                <ThemeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}