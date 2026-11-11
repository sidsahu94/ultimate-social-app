// frontend/src/components/layouts/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoHomeOutline,
  IoHome,
  IoCompassOutline,
  IoCompass,
  IoVideocamOutline,
  IoVideocam,
  IoChatbubbleEllipsesOutline,
  IoChatbubbleEllipses,
  IoHeartOutline,
  IoHeart,
  IoBookmarkOutline,
  IoBookmark,
  IoCalendarOutline,
  IoCalendar,
  IoStorefrontOutline,
  IoStorefront,
  IoTimeOutline,
  IoTime,
  IoPeopleOutline,
  IoPeople,
  IoPersonOutline,
  IoPerson,
  IoAdd,
  IoNotificationsOutline,
  IoCheckmarkCircle,
  IoDownloadOutline,
  IoGridOutline,
  IoGameControllerOutline,
  IoWalletOutline,
  IoStatsChartOutline,
  IoFlameOutline,
  IoShieldCheckmarkOutline,
  IoSettingsOutline,
  IoChevronDown,
  IoChevronUp,
  IoClose,
  IoMenuOutline,
} from 'react-icons/io5';
import { FaCrown } from 'react-icons/fa';

import { useSocket } from '../../contexts/SocketContext';
import ThemeSelector from '../ui/ThemeSelector';
import UserAvatar from '../ui/UserAvatar';
import usePWAInstall from '../../hooks/usePWAInstall';
import { scrollToTop } from '../../utils/scrollUtils';
import { useTheme } from '../../contexts/ThemeProvider';
import Logo from '../ui/Logo';
import { playSound } from '../../utils/soundEffects';

const NavItem = ({ to, iconActive, iconInactive, label, active, badge = 0, currentTheme, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`relative my-0.5 flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-200 group cursor-pointer ${
      active
        ? 'font-bold text-white shadow-lg'
        : 'text-[#CBD5E1]/75 hover:bg-white/[0.05] hover:text-white'
    }`}
    style={
      active
        ? {
            background: `linear-gradient(90deg, ${currentTheme.color}35 0%, ${currentTheme.accent}20 100%)`,
            border: `1px solid ${currentTheme.border || 'rgba(255,255,255,0.2)'}`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
          }
        : {}
    }
  >
    <div className="flex items-center gap-3.5">
      <div
        className={`text-xl transition-all duration-200 ${
          active ? 'scale-110 drop-shadow-md' : 'group-hover:scale-105'
        }`}
        style={active ? { color: currentTheme.accent } : {}}
      >
        {active ? iconActive : iconInactive}
      </div>
      <span className="text-[13.5px] tracking-tight">{label}</span>
    </div>

    {badge > 0 && (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-black text-white shadow-md"
        style={{
          background: `linear-gradient(135deg, #EF4444, ${currentTheme.color})`,
        }}
      >
        {badge > 99 ? '99+' : badge}
      </span>
    )}

    {active && (
      <motion.div
        layoutId="activeNavPip"
        className="absolute right-2.5 h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: currentTheme.accent,
          boxShadow: `0 0 8px ${currentTheme.accent}`,
        }}
      />
    )}
  </Link>
);

export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { isReady, installApp } = usePWAInstall();
  const { currentTheme } = useTheme();

  const [msgCount, setMsgCount] = useState(5);
  const [activityCount, setActivityCount] = useState(7);
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/chat')) {
      setMsgCount(0);
    }
    if (location.pathname.startsWith('/notifications')) {
      setActivityCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = () => setMsgCount((c) => c + 1);
    const onNewNotification = () => setActivityCount((c) => c + 1);
    socket.on('chat:message', onNewMessage);
    socket.on('notification', onNewNotification);
    return () => {
      socket.off('chat:message', onNewMessage);
      socket.off('notification', onNewNotification);
    };
  }, [socket]);

  const isActive = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/welcome')) return true;
    return location.pathname.startsWith(path) && path !== '/';
  };

  const triggerHaptic = (ms = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (_) {}
    }
  };

  const openCreate = () => {
    triggerHaptic(20);
    window.dispatchEvent(new CustomEvent('openCreatePost'));
  };

  // Core Main Sidebar Links (Images 1 & 2)
  const navLinks = [
    { to: '/', label: 'Home', iconActive: <IoHome />, iconInactive: <IoHomeOutline /> },
    { to: '/explore', label: 'Explore', iconActive: <IoCompass />, iconInactive: <IoCompassOutline /> },
    { to: '/reels', label: 'Reels', iconActive: <IoVideocam />, iconInactive: <IoVideocamOutline /> },
    { to: '/chat', label: 'Messages', iconActive: <IoChatbubbleEllipses />, iconInactive: <IoChatbubbleEllipsesOutline />, badge: msgCount > 0 ? msgCount : null },
    { to: '/notifications', label: 'Notifications', iconActive: <IoHeart />, iconInactive: <IoHeartOutline />, badge: activityCount > 0 ? activityCount : null },
    { to: '/discovery/follow-suggestions', label: 'Groups', iconActive: <IoPeople />, iconInactive: <IoPeopleOutline /> },
    { to: '/events', label: 'Events', iconActive: <IoCalendar />, iconInactive: <IoCalendarOutline /> },
    { to: '/saved', label: 'Saved', iconActive: <IoBookmark />, iconInactive: <IoBookmarkOutline /> },
    { to: '/memories', label: 'Memories', iconActive: <IoTime />, iconInactive: <IoTimeOutline /> },
    { to: '/shop', label: 'Marketplace', iconActive: <IoStorefront />, iconInactive: <IoStorefrontOutline /> },
  ];

  // Extended Previous App Features (Fully Preserved & Integrated)
  const studioFeatures = [
    { to: '/live', label: 'Live Studio', icon: <IoVideocamOutline /> },
    { to: '/games', label: 'Games Arcade', icon: <IoGameControllerOutline /> },
    { to: '/wallet', label: 'Creator Wallet', icon: <IoWalletOutline /> },
    { to: '/analytics', label: 'Analytics', icon: <IoStatsChartOutline /> },
    { to: '/discover', label: 'Swipe Discovery', icon: <IoFlameOutline /> },
    { to: '/feature-hub', label: 'Features Hub', icon: <IoGridOutline /> },
    { to: '/scheduled-posts', label: 'Scheduled Posts', icon: <IoTimeOutline /> },
    { to: '/report', label: 'Safety Center', icon: <IoShieldCheckmarkOutline /> },
    { to: '/settings', label: 'Settings', icon: <IoSettingsOutline /> },
  ];

  const displayName = user?.name || 'Sidhanta Sahu';
  const username = user?.username || 'sidhanta';

  return (
    <>
      {/* =========================================================================
          DESKTOP LEFT SIDEBAR (Images 1 & 2)
          ========================================================================= */}
      <aside
        className="hidden md:flex h-screen w-[275px] flex-col border-r border-[rgba(255,255,255,0.12)] bg-[#070B14]/94 backdrop-blur-3xl fixed left-0 top-0 z-40 transition-colors duration-300 shadow-[4px_0_40px_rgba(0,0,0,0.7)]"
        style={{
          borderColor: currentTheme.border || 'rgba(255,255,255,0.12)',
        }}
      >
        {/* Brand & Mini Profile Header */}
        <div className="p-5 pb-3">
          <Link to="/" onClick={scrollToTop} className="block cursor-pointer">
            <Logo size={40} subtitle="Beyond Social" />
          </Link>

          {/* User Mini Profile Badge with iridescent border */}
          {user && (
            <Link
              to={`/profile/${user._id}`}
              className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 transition-all hover:bg-white/[0.07] hover:border-white/20 group cursor-pointer"
            >
              <div
                className="rounded-full p-[2px] transition-transform duration-500 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent}, #F4D49A)`,
                }}
              >
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  userId={user._id}
                  className="h-10 w-10 border border-[#04070D]"
                  showStatus={false}
                />
              </div>

              <div className="min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-bold text-white truncate">{displayName}</span>
                  <IoCheckmarkCircle className="text-[#38BDF8] text-sm shrink-0" />
                </div>
                <span className="text-xs text-[#CBD5E1]/60 font-mono block truncate">@{username}</span>
              </div>
            </Link>
          )}

          {/* Gamification Level 8 Card */}
          {user && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3 shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-[#F59E0B]">
                  <FaCrown size={12} className="text-[#F59E0B]" /> Level 8
                </span>
                <span className="font-mono text-[11px] text-[#CBD5E1]/80 font-medium">
                  8,420 / 10,000 XP
                </span>
              </div>

              {/* Glowing XP Progress Bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '84.2%' }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="relative h-full rounded-full shadow-md overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, ${currentTheme.color}, ${currentTheme.accent})`,
                    boxShadow: `0 0 12px ${currentTheme.accent}`,
                  }}
                >
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                  />
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-4 py-1 custom-scrollbar">
          <nav className="space-y-0.5">
            {navLinks.map((item) => (
              <NavItem
                key={item.label}
                {...item}
                active={isActive(item.to)}
                currentTheme={currentTheme}
              />
            ))}

            {/* Expandable "Studio & More" Menu for All Previous Features */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowMoreFeatures((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-bold text-[#CBD5E1]/80 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                <span>Studio &amp; More Features</span>
                {showMoreFeatures ? <IoChevronUp size={14} /> : <IoChevronDown size={14} />}
              </button>

              <AnimatePresence>
                {showMoreFeatures && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-0.5 pl-2 overflow-hidden mt-1"
                  >
                    {studioFeatures.map((feat) => (
                      <Link
                        key={feat.label}
                        to={feat.to}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive(feat.to)
                            ? 'text-white bg-white/10 font-bold'
                            : 'text-[#CBD5E1]/70 hover:text-white hover:bg-white/[0.04]'
                        }`}
                        style={isActive(feat.to) ? { color: currentTheme.accent } : {}}
                      >
                        <span className="text-base">{feat.icon}</span>
                        <span>{feat.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <button
            type="button"
            onClick={() => {
              playSound('install');
              if (isReady) installApp();
              else window.dispatchEvent(new CustomEvent('openInstallApp'));
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
              boxShadow: `0 0 15px ${currentTheme.glow}`,
            }}
          >
            <IoDownloadOutline size={16} /> Install SocialVerse App
          </button>
        </div>

        {/* Bottom Theme Selector Widget */}
        <div className="p-4 border-t border-white/10">
          <ThemeSelector />
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP BAR (Image 3, Screen 1)
          ========================================================================= */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[rgba(255,255,255,0.12)] bg-[#070B14]/92 px-4 backdrop-blur-2xl md:hidden">
        {/* Left Menu / User Avatar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowMobileDrawer(true)}
            className="p-1 -ml-1 text-white/80 hover:text-white cursor-pointer"
          >
            <IoMenuOutline size={24} />
          </button>

          {user && (
            <Link to={`/profile/${user._id}`} className="flex items-center">
              <UserAvatar
                src={user.avatar}
                name={user.name}
                userId={user._id}
                className="h-8 w-8 border border-white/20"
                showStatus={false}
              />
            </Link>
          )}
        </div>

        {/* Centered Brand Logo with 3D Mark */}
        <div onClick={scrollToTop} className="cursor-pointer">
          <Logo size={32} showText={true} subtitle="Beyond Social" />
        </div>

        {/* Notification Bell on Right */}
        <Link to="/notifications" className="relative text-white p-1">
          <IoNotificationsOutline size={22} />
          {activityCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-black text-white">
              {activityCount > 9 ? '9+' : activityCount}
            </span>
          )}
        </Link>
      </header>

      {/* =========================================================================
          MOBILE SLIDE-OVER DRAWER (Access to all features on mobile)
          ========================================================================= */}
      <AnimatePresence>
        {showMobileDrawer && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-4/5 max-w-xs h-full bg-[#070B14] border-r border-white/15 p-5 flex flex-col shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <Logo size={34} subtitle="Beyond Social" />
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1 text-white/60 hover:text-white rounded-full"
                >
                  <IoClose size={22} />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="py-4 space-y-1 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#CBD5E1]/60 px-3 block mb-2">
                  Navigation
                </span>
                {navLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#CBD5E1] hover:text-white hover:bg-white/[0.05]"
                  >
                    <span className="text-lg">{item.iconActive}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}

                <span className="text-[10px] font-black uppercase tracking-widest text-[#CBD5E1]/60 px-3 block pt-4 mb-2">
                  Studio &amp; Tools
                </span>
                {studioFeatures.map((feat) => (
                  <Link
                    key={feat.label}
                    to={feat.to}
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#CBD5E1] hover:text-white hover:bg-white/[0.05]"
                  >
                    <span className="text-base">{feat.icon}</span>
                    <span>{feat.label}</span>
                  </Link>
                ))}
              </div>

              {/* Install App Button in Drawer */}
              <div className="pt-2 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    playSound('install');
                    setShowMobileDrawer(false);
                    if (isReady) installApp();
                    else window.dispatchEvent(new CustomEvent('openInstallApp'));
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                    boxShadow: `0 0 15px ${currentTheme.glow}`,
                  }}
                >
                  <IoDownloadOutline size={16} /> Install App to Device
                </button>
              </div>

              {/* Mobile Drawer Theme Selector */}
              <div className="pt-3 border-t border-white/10">
                <ThemeSelector />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MOBILE FLOATING BOTTOM DOCK (Image 3, Screens 1-4)
          ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none md:hidden">
        <div className="mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] relative overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.18)] bg-[#070B14]/95 px-3 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl pointer-events-auto">
          <div className="flex items-center justify-between">
            {/* 1. Home */}
            <Link
              to="/"
              onClick={() => triggerHaptic(12)}
              className={`flex flex-col items-center justify-center p-1.5 transition-colors ${
                isActive('/') ? 'text-white' : 'text-[#CBD5E1]/60'
              }`}
            >
              <div
                className="text-xl"
                style={isActive('/') ? { color: currentTheme.accent } : {}}
              >
                {isActive('/') ? <IoHome /> : <IoHomeOutline />}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Home</span>
            </Link>

            {/* 2. Explore */}
            <Link
              to="/explore"
              onClick={() => triggerHaptic(12)}
              className={`flex flex-col items-center justify-center p-1.5 transition-colors ${
                isActive('/explore') ? 'text-white' : 'text-[#CBD5E1]/60'
              }`}
            >
              <div
                className="text-xl"
                style={isActive('/explore') ? { color: currentTheme.accent } : {}}
              >
                {isActive('/explore') ? <IoCompass /> : <IoCompassOutline />}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Explore</span>
            </Link>

            {/* 3. Center Elevated + Button with Pulsing Outer Aura */}
            <div className="relative -top-3">
              <button
                type="button"
                onClick={openCreate}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 text-white shadow-2xl hover:scale-105 active:scale-90 transition-transform cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                  boxShadow: `0 0 25px ${currentTheme.glow}`,
                }}
              >
                <IoAdd size={28} />
              </button>
            </div>

            {/* 4. Reels */}
            <Link
              to="/reels"
              onClick={() => triggerHaptic(12)}
              className={`flex flex-col items-center justify-center p-1.5 transition-colors ${
                isActive('/reels') ? 'text-white' : 'text-[#CBD5E1]/60'
              }`}
            >
              <div
                className="text-xl"
                style={isActive('/reels') ? { color: currentTheme.accent } : {}}
              >
                {isActive('/reels') ? <IoVideocam /> : <IoVideocamOutline />}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Reels</span>
            </Link>

            {/* 5. Profile */}
            <Link
              to={user ? `/profile/${user._id}` : '/login'}
              onClick={() => triggerHaptic(12)}
              className={`flex flex-col items-center justify-center p-1.5 transition-colors ${
                isActive('/profile') ? 'text-white' : 'text-[#CBD5E1]/60'
              }`}
            >
              <div
                className="text-xl"
                style={isActive('/profile') ? { color: currentTheme.accent } : {}}
              >
                {isActive('/profile') ? <IoPerson /> : <IoPersonOutline />}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
