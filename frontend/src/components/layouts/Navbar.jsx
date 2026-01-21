// frontend/src/components/layouts/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { useSocket } from "../../contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

// Icons
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
} from "react-icons/io5";
import { FaFire } from "react-icons/fa";

// Components
import AppDrawer from "./AppDrawer";
import ThemeToggle from "../ui/ThemeToggle";
import UserAvatar from "../ui/UserAvatar";
import LevelProgress from "../ui/LevelProgress";
import usePWAInstall from "../../hooks/usePWAInstall";

// ------------------ Desktop Nav Item ------------------
const NavItem = ({
  to,
  iconActive,
  iconInactive,
  label,
  active,
  badge = 0,
  color,
}) => (
  <Link
    to={to}
    className={`relative flex items-center gap-4 rounded-[16px] px-4 py-3 my-1.5 transition-all duration-300 group
      ${
        active
          ? "bg-[#E0E5EC] dark:bg-[#141517] shadow-neu-inset-light dark:shadow-neu-inset-dark"
          : "hover:bg-white/40 dark:hover:bg-white/5"
      }
      ${color || ""}
    `}
  >
    <div
      className={`relative text-2xl transition-all duration-300 ${
        active
          ? "scale-110 text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary drop-shadow-lg"
          : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200"
      }`}
    >
      {active ? iconActive : iconInactive}

      {badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex rounded-full h-full w-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-white border border-white dark:border-black text-[8px] items-center justify-center font-bold">
            {badge > 9 ? "9+" : badge}
          </span>
        </span>
      )}
    </div>

    <span
      className={`font-semibold text-sm transition-all duration-300 ${
        active
          ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500"
          : "text-gray-500 dark:text-gray-400"
      }`}
    >
      {label}
    </span>

    {active && (
      <motion.div
        layoutId="active-nav"
        className="absolute right-4 w-2 h-2 rounded-full bg-primary shadow-neon-blue"
      />
    )}
  </Link>
);

// ------------------ Mobile Nav Item ------------------
const MobileNavItem = ({
  to,
  iconActive,
  iconInactive,
  active,
  badge = 0,
  isProfile,
  user,
  onClick,
}) => {
  if (isProfile) {
    return (
      <button
        onClick={onClick}
        className="relative flex items-center justify-center group"
      >
        <div
          className={`p-[2px] rounded-full transition-all duration-300 ${
            active
              ? "bg-gradient-to-br from-primary to-secondary shadow-neon-blue scale-110"
              : "bg-transparent"
          }`}
        >
          <UserAvatar
            src={user?.avatar}
            name={user?.name}
            className="w-8 h-8"
            showStatus={false}
          />
        </div>
      </button>
    );
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex flex-col items-center justify-center relative"
    >
      <div
        className={`text-2xl transition-all ${
          active
            ? "text-primary drop-shadow-[0_0_12px_rgba(41,121,255,.8)] -translate-y-1"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {active ? iconActive : iconInactive}

        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 h-2.5 w-2.5 bg-red-600 rounded-full border border-white dark:border-black" />
        )}
      </div>

      {active && (
        <motion.div
          layoutId="mobile-nav-dot"
          className="w-1.5 h-1.5 bg-primary rounded-full shadow-neon-blue absolute -bottom-2"
        />
      )}
    </Link>
  );
};

// ------------------ MAIN NAVBAR ------------------
export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { isReady, installApp } = usePWAInstall();

  // Notification Counters
  const [activityCount, setActivityCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Realtime listeners for notifications
  useEffect(() => {
    if (!socket || !user?._id) return;

    const onNotif = () => setActivityCount((p) => p + 1);
    const onMsg = (payload) => {
      const path = window.location.pathname;
      const chatId = payload.chatId || payload.room;
      if (!path.includes(chatId)) setMsgCount((x) => x + 1);
    };

    const clearNotifs = () => setActivityCount(0);

    socket.on("notification", onNotif);
    socket.on("receiveMessage", onMsg);
    window.addEventListener("notificationsRead", clearNotifs);

    if (location.pathname === "/notifications") setActivityCount(0);
    if (location.pathname === "/chat") setMsgCount(0);

    return () => {
      socket.off("notification", onNotif);
      socket.off("receiveMessage", onMsg);
      window.removeEventListener("notificationsRead", clearNotifs);
    };
  }, [socket, user, location.pathname]);

  const handleLogout = () => {
    socket?.disconnect();
    dispatch(logout());
    navigate("/login");
  };

  const openCreate = () =>
    window.dispatchEvent(new CustomEvent("openCreatePost"));

  const isActive = (p) =>
    location.pathname === p || (p !== "/" && location.pathname.startsWith(p));

  const desktopLinks = [
    { to: "/", iconActive: <IoHome />, iconInactive: <IoHomeOutline />, label: "Home" },
    { to: "/explore", iconActive: <IoCompass />, iconInactive: <IoCompassOutline />, label: "Explore" },
    { to: "/reels", iconActive: <IoVideocam />, iconInactive: <IoVideocamOutline />, label: "Reels" },
    { to: "/chat", iconActive: <IoChatbubbleEllipses />, iconInactive: <IoChatbubbleEllipsesOutline />, label: "Messages", badge: msgCount },
    { to: "/notifications", iconActive: <IoHeart />, iconInactive: <IoHeartOutline />, label: "Activity", badge: activityCount },
    { to: `/profile/${user?._id}`, iconActive: <IoPerson />, iconInactive: <IoPersonOutline />, label: "Profile" },
  ];

  return (
    <>
      {/* ======================= DESKTOP SIDEBAR ======================= */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[270px] bg-bg-light dark:bg-bg-dark border-r border-white/40 dark:border-white/5 z-50 shadow-neu-light dark:shadow-neu-dark">

        {/* Logo + Streak */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-neon-blue">
              <span className="font-black text-lg">S</span>
            </div>

            <div>
              <h1 className="font-extrabold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">
                SocialApp
              </h1>

              {user?.streak?.count > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold mt-1 animate-pulse">
                  <FaFire /> {user.streak.count} Day Streak
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <LevelProgress />
          </div>
        </div>

        {/* NAVIGATION LIST */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <nav className="space-y-2">
            {desktopLinks.map((link) => (
              <NavItem key={link.label} {...link} active={isActive(link.to)} />
            ))}

            {user?.role === "admin" && (
              <NavItem
                to="/admin/dashboard"
                iconActive={<IoShieldCheckmarkOutline />}
                iconInactive={<IoShieldCheckmarkOutline />}
                label="Admin"
                color="text-red-500"
                active={isActive("/admin")}
              />
            )}
          </nav>

          {/* CREATE BUTTON */}
          <button
            onClick={openCreate}
            className="btn-neon w-full mt-5 flex items-center justify-center gap-2"
          >
            <IoAddCircle className="text-2xl" />
            Create
          </button>

          {/* PWA INSTALL */}
          {isReady && (
            <button
              onClick={installApp}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/40 hover:scale-[1.02] transition-all"
            >
              <IoDownloadOutline size={20} /> Install App
            </button>
          )}

          {/* APP DRAWER */}
          <div className="pt-6 mt-6 border-t border-white/30 dark:border-white/10">
            <AppDrawer />
          </div>
        </div>

        {/* FOOTER OPTIONS */}
        <div className="p-6 border-t border-white/20 dark:border-white/10">
          <div className="flex justify-between items-center bg-white/40 dark:bg-black/20 p-4 rounded-xl shadow-neu-inset-light dark:shadow-neu-inset-dark">
            <div className="flex gap-2">
              <Link
                to="/settings"
                className="p-2 rounded-full text-gray-600 hover:text-primary dark:text-gray-300 hover:bg-white/30"
              >
                <IoSettingsOutline size={20} />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-600 hover:text-red-500 dark:text-gray-300 hover:bg-white/30"
              >
                <IoLogOutOutline size={22} />
              </button>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ======================= MOBILE TOP BAR ======================= */}
      <nav className="md:hidden fixed top-4 left-4 right-4 h-[60px] bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-neu-light dark:shadow-neu-dark flex items-center justify-between px-4 z-50">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-sm">
            <span className="font-bold">S</span>
          </div>

          <div>
            <h1 className="font-extrabold text-lg text-gray-900 dark:text-white">
              Social
            </h1>
            {user?.streak?.count > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-orange-500">
                <FaFire />
                {user.streak.count}
              </div>
            )}
          </div>
        </div>

        {/* Notification icons */}
        <div className="flex items-center gap-4">
          <Link to="/notifications" className="relative text-gray-600 dark:text-gray-300">
            <IoHeartOutline size={26} />
            {activityCount > 0 && (
              <span className="absolute -top-1 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
            )}
          </Link>

          <Link to="/chat" className="relative text-gray-600 dark:text-gray-300">
            <IoChatbubbleEllipsesOutline size={26} />
            {msgCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 rounded-full border border-white dark:border-black">
                {msgCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* ======================= MOBILE BOTTOM NAV ======================= */}
      <nav className="md:hidden fixed bottom-5 left-4 right-4 h-[70px] bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[24px] shadow-neu-light dark:shadow-neu-dark grid grid-cols-5 items-center px-2 z-50">

        <MobileNavItem
          to="/"
          active={location.pathname === "/"}
          iconActive={<IoHome />}
          iconInactive={<IoHomeOutline />}
        />

        <MobileNavItem
          to="/explore"
          active={location.pathname === "/explore"}
          iconActive={<IoCompass />}
          iconInactive={<IoCompassOutline />}
        />

        {/* Floating Create Button */}
        <div className="flex justify-center -mt-8">
          <button
            onClick={openCreate}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-neon-blue flex items-center justify-center transform active:scale-90 border-4 border-bg-light dark:border-bg-dark"
          >
            <IoAddCircle className="text-3xl" />
          </button>
        </div>

        <MobileNavItem
          to="/reels"
          active={location.pathname === "/reels"}
          iconActive={<IoVideocam />}
          iconInactive={<IoVideocamOutline />}
        />

        <MobileNavItem
          isProfile
          user={user}
          active={showMobileMenu}
          onClick={() => setShowMobileMenu(true)}
        />
      </nav>

      {/* ======================= MOBILE MENU DRAWER ======================= */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-bg-light dark:bg-bg-dark p-6 md:hidden z-[60] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-3 rounded-full bg-bg-light dark:bg-bg-dark shadow-neu-light dark:shadow-neu-dark"
              >
                <IoClose size={28} />
              </button>
            </div>

            {/* Profile Header */}
            <Link
              to={`/profile/${user?._id}`}
              onClick={() => setShowMobileMenu(false)}
              className="neu-card flex items-center gap-4 !p-4 mb-8 rounded-2xl"
            >
              <div className="p-1 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-neon-blue">
                <UserAvatar
                  src={user?.avatar}
                  name={user?.name}
                  className="w-14 h-14 border-2 border-bg-light dark:border-bg-dark"
                />
              </div>

              <div>
                <div className="font-bold text-lg">{user?.name}</div>
                <div className="text-primary text-sm">View Profile</div>
                <div className="mt-2 w-32">
                  <LevelProgress />
                </div>
              </div>
            </Link>

            {/* Quick Items */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link
                to="/settings"
                onClick={() => setShowMobileMenu(false)}
                className="neu-card flex flex-col items-center gap-2 !p-4"
              >
                <IoSettingsOutline className="text-2xl text-blue-500" />
                <span className="font-bold text-sm">Settings</span>
              </Link>

              {user?.role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setShowMobileMenu(false)}
                  className="neu-card flex flex-col items-center gap-2 !p-4"
                >
                  <IoShieldCheckmarkOutline className="text-2xl text-red-500" />
                  <span className="font-bold text-sm text-red-500">Admin</span>
                </Link>
              )}
            </div>

            {/* Install App */}
            {isReady && (
              <button
                onClick={installApp}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg"
              >
                <IoDownloadOutline size={20} className="inline mr-2" />
                Install App
              </button>
            )}

            {/* App Drawer */}
            <div className="mt-8">
              <AppDrawer />
            </div>

            {/* Bottom Actions */}
            <div className="mt-10 border-t border-white/20 dark:border-white/10 pt-4 flex justify-between items-center">
              <button
                onClick={handleLogout}
                className="text-red-500 flex items-center gap-2 font-bold px-4 py-2 hover:bg-red-100/20 dark:hover:bg-red-900/20 rounded-xl"
              >
                <IoLogOutOutline size={20} />
                Logout
              </button>

              <ThemeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}