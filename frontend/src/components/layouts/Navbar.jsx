// frontend/src/components/layouts/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useSocket } from '../../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

import {
  IoHome,
  IoHomeOutline,
  IoCompass,
  IoCompassOutline,
  IoVideocam,
  IoVideocamOutline,
  IoChatbubbleEllipses,
  IoChatbubbleEllipsesOutline,
  IoHeart,
  IoHeartOutline,
  IoPerson,
  IoPersonOutline,
  IoAddCircle,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoLogOutOutline,
  IoClose,
  IoDownloadOutline,
  IoGrid,
  IoGridOutline,
  IoBookmark,
  IoBookmarkOutline,
  IoWalletOutline,
} from 'react-icons/io5';
import { FaFire, FaSearch } from 'react-icons/fa';

import AppDrawer from './AppDrawer';
import StreakQuestsModal from '../gamification/StreakQuestsModal';
import ThemeToggle from '../ui/ThemeToggle';
import UserAvatar from '../ui/UserAvatar';
import LevelProgress from '../ui/LevelProgress';
import usePWAInstall from '../../hooks/usePWAInstall';
import { scrollToTop } from '../../utils/scrollUtils';

const SocialoBrand = ({ isMobile }) => (
  <div className="flex items-center gap-3 select-none">
    <div
      className={`relative overflow-hidden rounded-[14px] bg-[#070B14] border border-[rgba(0,242,254,0.18)] shadow-silverGlass ring-1 ring-white/10 shrink-0 ${
        isMobile ? 'h-9 w-9' : 'h-10 w-10'
      }`}
    >
      <img src="/socialo-logo.jpg" alt="Socialo" className="h-full w-full object-cover" />
    </div>

    <div className="flex flex-col leading-none">
      <h1
        className={`font-display font-bold tracking-tight text-[#F8FAFC] ${
          isMobile ? 'text-lg' : 'text-2xl'
        }`}
      >
        Socialo<span className="font-bold text-[#D4AF37]">.</span>
      </h1>
      {!isMobile && (
        <span className="mt-1 text-[8.5px] font-semibold tracking-[0.2em] uppercase text-[#CBD5E1]/80">
          AETHERIA NOIR • EMERALD & GOLD
        </span>
      )}
    </div>
  </div>
);

const NavItem = ({ to, iconActive, iconInactive, label, active, badge = 0, color = '' }) => (
  <Link
    to={to}
    className={`relative my-1.5 flex items-center gap-4 rounded-[14px] px-4 py-3 transition-all duration-200 group ${
      active
        ? 'bg-gradient-to-r from-[#1D4ED8]/20 via-[#052E24]/15 to-[#00F2FE]/10 border border-[rgba(0,242,254,0.16)] text-[#F8FAFC] font-bold shadow-silverGlass'
        : 'text-[#CBD5E1]/70 hover:bg-white/[0.04] hover:text-[#F8FAFC]'
    } ${color}`}
  >
    <div
      className={`relative text-2xl transition-all duration-200 ${
        active
          ? 'scale-105 text-[#00F2FE] drop-shadow-[0_0_8px_rgba(100,223,223,0.5)]'
          : 'text-[#CBD5E1]/60 group-hover:text-[#F8FAFC]'
      }`}
    >
      {active ? iconActive : iconInactive}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
          <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-[#052E24] text-[8px] font-bold text-white shadow-[0_0_8px_rgba(139,0,24,0.6)]">
            {badge > 9 ? '9+' : badge}
          </span>
        </span>
      )}
    </div>
    <span
      className={`text-sm transition-all duration-200 ${
        active
          ? 'font-bold text-[#F8FAFC]'
          : 'font-medium'
      }`}
    >
      {label}
    </span>
    {active && <motion.div layoutId="active-nav" className="absolute right-4 h-2 w-2 rounded-full bg-[#00F2FE] shadow-[0_0_8px_#00F2FE]" />}
  </Link>
);

const MobileNavItem = ({ to, iconActive, iconInactive, active, badge = 0, label, isProfile, user, onClick }) => {
  if (isProfile) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative flex flex-1 flex-col items-center justify-center py-1.5 transition-all duration-300 group"
      >
        {active && (
          <motion.div
            layoutId="activeTabGlowCapsule"
            className="absolute inset-x-1 inset-y-0.5 z-0 rounded-xl border border-[rgba(0,242,254,0.2)] bg-gradient-to-r from-[#1D4ED8]/20 to-[#00F2FE]/15"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <motion.div
          whileTap={{ scale: 0.88 }}
          className={`relative z-10 flex flex-col items-center rounded-lg p-1.5 transition-colors ${
            active
              ? 'text-[#00F2FE]'
              : 'text-[#CBD5E1]/60 group-hover:text-[#F8FAFC]'
          }`}
        >
          <div className={`rounded-full p-[2px] ${active ? 'bg-[#1D4ED8]/25 ring-1 ring-[#00F2FE] scale-110' : 'bg-transparent'}`}>
            {user ? (
              <UserAvatar src={user?.avatar} name={user?.name} className="h-6 w-6" showStatus={false} />
            ) : (
              <IoPersonOutline className="text-[24px]" />
            )}
          </div>
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#052E24] px-1 text-[9px] font-black text-white ring-2 ring-[#070B14] shadow-[0_0_8px_rgba(139,0,24,0.6)]">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </motion.div>
        <span
          className={`mt-0.5 text-[9px] font-medium uppercase tracking-wider transition-all z-10 ${
            active ? 'scale-105 font-bold tracking-[0.18em] text-[#00F2FE]' : 'text-[#CBD5E1]/60'
          }`}
        >
          {label}
        </span>
        {active && <motion.div layoutId="navbarLaserDot" className="absolute bottom-0 h-0.5 w-3 rounded-full bg-[#00F2FE] shadow-[0_0_8px_#00F2FE]" />}
      </button>
    );
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center justify-center py-1.5 transition-all duration-300 group"
    >
      {active && (
        <motion.div
          layoutId="activeTabGlowCapsule"
          className="absolute inset-x-1 inset-y-0.5 z-0 rounded-xl border border-[rgba(0,242,254,0.2)] bg-gradient-to-r from-[#1D4ED8]/20 to-[#00F2FE]/15"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <motion.div
        whileTap={{ scale: 0.88 }}
        className={`relative z-10 flex flex-col items-center rounded-lg p-1.5 transition-colors ${
          active
            ? 'text-[#00F2FE]'
            : 'text-[#CBD5E1]/60 group-hover:text-[#F8FAFC]'
        }`}
      >
        <div className="text-[22px]">{active ? iconActive : iconInactive}</div>
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#052E24] px-1 text-[9px] font-black text-white ring-2 ring-[#070B14] shadow-[0_0_8px_rgba(139,0,24,0.6)]">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </motion.div>
      <span
        className={`mt-0.5 text-[9px] font-medium uppercase tracking-wider transition-all z-10 ${
          active ? 'scale-105 font-bold tracking-[0.18em] text-[#00F2FE]' : 'text-[#CBD5E1]/60'
        }`}
      >
        {label}
      </span>
      {active && <motion.div layoutId="navbarLaserDot" className="absolute bottom-0 h-0.5 w-3 rounded-full bg-[#00F2FE] shadow-[0_0_8px_#00F2FE]" />}
    </Link>
  );
};

export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { isReady, installApp } = usePWAInstall();

  const [activityCount, setActivityCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isImmersiveRoute =
    location.pathname.match(/\/chat\/[a-zA-Z0-9]+/) ||
    location.pathname.includes('/reels') ||
    location.pathname.includes('/live/watch');

  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!socket || !user?._id) return;

    const onNotif = () => setActivityCount((p) => p + 1);
    const onMsg = (payload) => {
      const path = window.location.pathname;
      const chatId = payload.chatId || payload.room;
      if (!path.includes(chatId)) setMsgCount((x) => x + 1);
    };
    const clearNotifs = () => setActivityCount(0);

    socket.on('notification', onNotif);
    socket.on('receiveMessage', onMsg);
    window.addEventListener('notificationsRead', clearNotifs);

    if (location.pathname === '/notifications') setActivityCount(0);
    if (location.pathname === '/chat') setMsgCount(0);

    return () => {
      socket.off('notification', onNotif);
      socket.off('receiveMessage', onMsg);
      window.removeEventListener('notificationsRead', clearNotifs);
    };
  }, [socket, user, location.pathname]);

  const handleLogout = () => {
    socket?.disconnect();
    dispatch(logout());
    navigate('/login');
  };

  const openCreate = () => window.dispatchEvent(new CustomEvent('openCreatePost'));
  const isActive = (p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p));

  const desktopLinks = user
    ? [
        { to: '/', iconActive: <IoHome />, iconInactive: <IoHomeOutline />, label: 'Home' },
        { to: '/explore', iconActive: <IoCompass />, iconInactive: <IoCompassOutline />, label: 'Explore' },
        { to: '/stories', iconActive: <FaFire />, iconInactive: <FaFire />, label: 'Stories' },
        { to: '/reels', iconActive: <IoVideocam />, iconInactive: <IoVideocamOutline />, label: 'Reels' },
        { to: '/live/list', iconActive: <IoVideocam />, iconInactive: <IoVideocamOutline />, label: 'Live' },
        {
          to: '/chat',
          iconActive: <IoChatbubbleEllipses />,
          iconInactive: <IoChatbubbleEllipsesOutline />,
          label: 'Messages',
          badge: msgCount,
        },
        {
          to: '/notifications',
          iconActive: <IoHeart />,
          iconInactive: <IoHeartOutline />,
          label: 'Activity',
          badge: activityCount,
        },
        { to: '/saved', iconActive: <IoBookmark />, iconInactive: <IoBookmarkOutline />, label: 'Saved' },
        { to: '/wallet', iconActive: <IoWalletOutline />, iconInactive: <IoWalletOutline />, label: 'Wallet' },
        { to: '/command-center', iconActive: <IoGrid />, iconInactive: <IoGridOutline />, label: 'Command' },
        { to: `/profile/${user._id}`, iconActive: <IoPerson />, iconInactive: <IoPersonOutline />, label: 'Profile' },
      ]
    : [
        { to: '/welcome', iconActive: <IoHome />, iconInactive: <IoHomeOutline />, label: 'Welcome' },
        { to: '/explore', iconActive: <IoCompass />, iconInactive: <IoCompassOutline />, label: 'Explore' },
        { to: '/login', iconActive: <IoPerson />, iconInactive: <IoPersonOutline />, label: 'Log In' },
      ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-[270px] flex-col border-r border-[rgba(0,242,254,0.12)] bg-[#070B14]/95 backdrop-blur-2xl transition-colors duration-300 md:fixed md:left-0 md:top-0 md:z-50 md:flex shadow-[4px_0_30px_rgba(0,0,0,0.6)]">
        <div className="p-7 pb-4">
          <SocialoBrand isMobile={false} />

          {user ? (
            <div className="mt-6">
              <LevelProgress />
              {user?.streak?.count > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#D4AF37] animate-pulse">
                  <FaFire className="text-[#10B981]" /> {user.streak.count} Day Streak
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 text-xs font-semibold tracking-wide text-[#CBD5E1]/70">
              People • Moments • Together
            </div>
          )}
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('openCommandPalette'))}
            className="mb-4 flex w-full items-center justify-between rounded-xl border border-[rgba(0,242,254,0.12)] bg-[#04070D]/80 px-3.5 py-2.5 text-xs text-[#CBD5E1]/70 hover:border-[#00F2FE] hover:text-[#F8FAFC] transition shadow-inner group"
          >
            <span className="flex items-center gap-2 font-medium">
              <FaSearch size={12} className="text-[#00F2FE] group-hover:scale-110 transition-transform" />
              <span>Search &amp; Jump...</span>
            </span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-[#CBD5E1]/60">
              Ctrl+K
            </kbd>
          </button>
          {user && (
            <button
              type="button"
              onClick={() => setShowStreakModal(true)}
              className="mb-3.5 flex w-full items-center justify-between rounded-xl border border-[rgba(212,175,55,0.3)] bg-gradient-to-r from-[#052E24]/25 via-[#070B14] to-[#D4AF37]/20 px-3.5 py-2.5 text-xs text-[#F8FAFC] hover:border-[#D4AF37] transition shadow-[0_0_20px_rgba(212,175,55,0.15)] group cursor-pointer"
            >
              <span className="flex items-center gap-2 font-bold">
                <FaFire size={14} className="text-[#F4D49A] animate-pulse group-hover:scale-125 transition-transform" />
                <span className="text-[#F7F7FC]">Daily Quests &amp; Streak</span>
              </span>
              <span className="rounded-full bg-[#052E24] px-2 py-0.5 font-mono text-[9px] font-black text-white shadow">
                BOUNTIES
              </span>
            </button>
          )}
          <nav className="space-y-1.5">
            {desktopLinks.map((link) => (
              <NavItem key={link.label} {...link} active={isActive(link.to)} />
            ))}

            {user?.role === 'admin' && (
              <NavItem
                to="/admin/dashboard"
                iconActive={<IoShieldCheckmarkOutline />}
                iconInactive={<IoShieldCheckmarkOutline />}
                label="Architect Enclave"
                color="text-[#00F2FE] bg-[#052E24]/15 border border-[#052E24]/30 shadow-[0_0_15px_rgba(139,0,24,0.3)]"
                active={isActive('/admin')}
              />
            )}
          </nav>

          {user && (
            <button
              onClick={openCreate}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] py-3 font-display font-bold text-white shadow-sapphireGlow border border-[rgba(0,242,254,0.18)] transition-all hover:shadow-[0_4px_25px_rgba(29,78,216,0.5)] hover:scale-[1.01] active:scale-95"
            >
              <IoAddCircle className="text-2xl text-white" /> Create
            </button>
          )}

          {isReady && (
            <button
              onClick={installApp}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#0F766E] to-[#00F2FE] py-2.5 font-bold text-white shadow-md transition-all hover:scale-[1.02]"
            >
              <IoDownloadOutline size={18} /> Install App
            </button>
          )}

          {user && (
            <div className="mt-6 border-t border-[rgba(0,242,254,0.1)] pt-5">
              <AppDrawer />
            </div>
          )}
        </div>

        <div className="border-t border-[rgba(0,242,254,0.1)] p-5">
          <div className="flex items-center justify-between rounded-[20px] border border-[rgba(0,242,254,0.14)] bg-[#04070D]/85 p-3.5 shadow-silverGlass">
            <div className="flex gap-2">
              <Link
                to="/settings"
                className="rounded-full p-2 text-[#CBD5E1]/70 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <IoSettingsOutline size={20} />
              </Link>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="rounded-full p-2 text-[#10B981] transition-colors hover:bg-[#052E24]/15 hover:text-red-400"
                >
                  <IoLogOutOutline size={22} />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="rounded-full p-2 text-[#CBD5E1]/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <IoPersonOutline size={22} />
                </Link>
              )}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <nav className="fixed left-4 right-4 top-4 z-40 flex h-[60px] items-center justify-between rounded-[20px] border border-[rgba(0,242,254,0.14)] bg-[#070B14]/90 px-4 shadow-silverGlass backdrop-blur-xl transition-colors duration-300 md:hidden">
        <div onClick={() => scrollToTop()}>
          <SocialoBrand isMobile={true} />
        </div>
        {user && (
          <div className="flex items-center gap-4">
                        <button
              type="button"
              onClick={() => setShowStreakModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#052E24]/25 border border-[#052E24]/40 px-2.5 py-1 text-xs font-bold text-[#F4D49A]"
            >
              <FaFire size={12} className="animate-pulse" />
              <span>Quests</span>
            </button>
            <Link to="/notifications" className="relative text-[#CBD5E1] hover:text-white transition-colors">
              <IoHeartOutline size={26} />
              {activityCount > 0 && (
                <span className="absolute -top-1 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#070B14] bg-[#052E24]" />
              )}
            </Link>
          </div>
        )}
      </nav>

      {/* Mobile bottom nav */}
      <AnimatePresence>
        {!isImmersiveRoute && (
          <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none md:hidden"
          >
            <div className="mx-4 mb-4 relative overflow-hidden rounded-[24px] border border-[rgba(0,242,254,0.16)] bg-[#070B14]/95 px-1 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-auto">
              <div className="relative z-10 flex w-full items-center justify-between">
                <MobileNavItem
                  to={user ? '/' : '/welcome'}
                  active={location.pathname === '/' || location.pathname === '/welcome'}
                  iconActive={<IoHome />}
                  iconInactive={<IoHomeOutline />}
                  label="Home"
                />
                <MobileNavItem
                  to="/explore"
                  active={location.pathname === '/explore'}
                  iconActive={<IoCompass />}
                  iconInactive={<IoCompassOutline />}
                  label="Explore"
                />
                <div className="relative -top-6 flex w-16 justify-center px-2">
                  <button
                    onClick={user ? openCreate : () => navigate('/login')}
                    className={`absolute z-20 flex h-[54px] w-[54px] transform items-center justify-center rounded-full border-[3px] border-[#070B14] text-white transition-all hover:scale-105 active:scale-90 ${
                      user
                        ? 'bg-gradient-to-tr from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white shadow-[0_0_20px_rgba(29,78,216,0.6)]'
                        : 'bg-[#6b7280] shadow-md'
                    }`}
                  >
                    {user ? <IoAddCircle className="text-[32px] text-white" /> : <IoPersonOutline className="text-[26px]" />}
                  </button>
                </div>
                <MobileNavItem
                  to={user ? '/chat' : '/login'}
                  active={location.pathname.startsWith('/chat')}
                  iconActive={<IoChatbubbleEllipses />}
                  iconInactive={<IoChatbubbleEllipsesOutline />}
                  badge={msgCount}
                  label={user ? 'Chats' : 'Log In'}
                />
                <MobileNavItem
                  isProfile
                  user={user}
                  active={showMobileMenu}
                  onClick={() => setShowMobileMenu(true)}
                  label="Menu"
                />
              </div>
            </div>
            <div className="h-[env(safe-area-inset-bottom)] pointer-events-auto" />
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] overflow-y-auto bg-[#04070D]/98 p-6 md:hidden text-[#F8FAFC] backdrop-blur-2xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold font-display text-[#F8FAFC]">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="rounded-full bg-white/[0.06] p-3 text-[#CBD5E1] hover:text-white"
              >
                <IoClose size={28} />
              </button>
            </div>

            {user ? (
              <Link
                to={`/profile/${user._id}`}
                onClick={() => setShowMobileMenu(false)}
                className="mb-8 flex items-center gap-4 rounded-2xl border border-[rgba(0,242,254,0.14)] bg-[#070B14] p-4 shadow-silverGlass"
              >
                <div className="rounded-full bg-[#1D4ED8]/20 p-1 ring-1 ring-[#1D4ED8]/40">
                  <UserAvatar src={user.avatar} name={user.name} className="h-14 w-14" />
                </div>
                <div>
                  <div className="text-lg font-bold text-[#F8FAFC]">{user.name}</div>
                  <div className="text-sm font-medium text-[#00F2FE]">View Profile</div>
                  <div className="mt-2 w-32">
                    <LevelProgress />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl border border-[rgba(0,242,254,0.14)] bg-[#070B14] p-6 shadow-silverGlass">
                <h3 className="text-xl font-bold text-[#F8FAFC]">Welcome</h3>
                <Link
                  to="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] py-3 text-center font-bold text-white shadow-sapphireGlow"
                >
                  Log In or Sign Up
                </Link>
              </div>
            )}

            <div className="mb-8 grid grid-cols-2 gap-4">
              <Link
                to="/stories"
                onClick={() => setShowMobileMenu(false)}
                className="flex flex-col items-center gap-2 rounded-xl border border-[rgba(0,242,254,0.12)] bg-[#070B14] p-4 hover:border-[#052E24]/50 transition-colors"
              >
                <FaFire className="text-2xl text-[#10B981]" />
                <span className="text-sm font-bold text-[#F8FAFC]">Stories</span>
              </Link>
              <Link
                to="/live/list"
                onClick={() => setShowMobileMenu(false)}
                className="flex flex-col items-center gap-2 rounded-xl border border-[rgba(0,242,254,0.12)] bg-[#070B14] p-4 hover:border-[#00F2FE]/50 transition-colors"
              >
                <IoVideocamOutline className="text-2xl text-[#00F2FE]" />
                <span className="text-sm font-bold text-[#F8FAFC]">Live</span>
              </Link>
              <Link
                to="/wallet"
                onClick={() => setShowMobileMenu(false)}
                className="flex flex-col items-center gap-2 rounded-xl border border-[rgba(0,242,254,0.12)] bg-[#070B14] p-4 hover:border-[#D4AF37]/50 transition-colors"
              >
                <IoWalletOutline className="text-2xl text-[#D4AF37]" />
                <span className="text-sm font-bold text-[#F8FAFC]">Wallet</span>
              </Link>
              <Link
                to="/command-center"
                onClick={() => setShowMobileMenu(false)}
                className="flex flex-col items-center gap-2 rounded-xl border border-[rgba(0,242,254,0.12)] bg-[#070B14] p-4 hover:border-[#1D4ED8]/50 transition-colors"
              >
                <IoGridOutline className="text-2xl text-[#1D4ED8]" />
                <span className="text-sm font-bold text-[#F8FAFC]">Command</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowMobileMenu(false)}
                className="flex flex-col items-center gap-2 rounded-xl border border-[rgba(0,242,254,0.12)] bg-[#070B14] p-4 hover:border-white/30 transition-colors"
              >
                <IoSettingsOutline className="text-2xl text-[#CBD5E1]" />
                <span className="text-sm font-bold text-[#F8FAFC]">Settings</span>
              </Link>
              <Link
                to="/saved"
                onClick={() => setShowMobileMenu(false)}
                className="flex flex-col items-center gap-2 rounded-xl border border-[rgba(0,242,254,0.12)] bg-[#070B14] p-4 hover:border-[#0F766E]/50 transition-colors"
              >
                <IoBookmarkOutline className="text-2xl text-[#0F766E]" />
                <span className="text-sm font-bold text-[#F8FAFC]">Saved</span>
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setShowMobileMenu(false)}
                  className="col-span-2 flex flex-col items-center gap-2 rounded-xl border border-[#052E24]/40 bg-[#052E24]/15 p-4 shadow-sm"
                >
                  <IoShieldCheckmarkOutline className="text-2xl text-[#10B981]" />
                  <span className="text-sm font-bold text-[#F4D49A]">Admin Controls</span>
                </Link>
              )}
            </div>

            {isReady && (
              <button
                onClick={installApp}
                className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#00F2FE] py-3 font-bold text-white shadow-md"
              >
                <IoDownloadOutline size={20} /> Install App
              </button>
            )}

            {user && (
              <div className="mt-8">
                <AppDrawer onItemClick={() => setShowMobileMenu(false)} />
              </div>
            )}

            <div className="mt-10 flex items-center justify-between border-t border-[rgba(0,242,254,0.1)] pt-4">
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-[#10B981] transition-colors hover:bg-[#052E24]/15"
                >
                  <IoLogOutOutline size={20} /> Logout
                </button>
              )}
              <ThemeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}