// frontend/src/App.jsx
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from './redux/slices/authSlice';
import { motion } from 'framer-motion';

import { useSocket } from './contexts/SocketContext';
import { useToast } from './components/ui/ToastProvider';

import Navbar from './components/layouts/Navbar';
import MainLayout from './components/layouts/MainLayout';
import PostModal from './components/posts/PostModal';
import CommentsModal from './components/posts/CommentsModal';
import CreatePostModal from './components/posts/CreatePostModal';
import IncomingCallModal from './components/common/IncomingCallModal';
import CommandPalette from './components/common/CommandPalette';
import InstallAppModal from './components/common/InstallAppModal';
import AdminCyberGateway from './components/common/AdminCyberGateway';
import UpdateNotificationBanner from './components/common/UpdateNotificationBanner';
import CinematicEnvironmentalBackdrop from './components/common/CinematicEnvironmentalBackdrop';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import NotFound from './pages/misc/NotFound';
import { PageTransition } from './components/PageTransition';

import './index.css';

const Feed = lazy(() => import('./pages/home/Feed'));
const Explore = lazy(() => import('./pages/explore/Explore'));
const SwipeExplore = lazy(() => import('./pages/discovery/SwipeExplore'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const SavedPage = lazy(() => import('./pages/saved/Saved'));
const MemoriesPage = lazy(() => import('./pages/memories/Memories'));
const TagFeed = lazy(() => import('./pages/explore/TagFeed'));
const SearchAdvanced = lazy(() => import('./pages/explore/SearchAdvanced'));

const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const PostPage = lazy(() => import('./pages/posts/PostPage'));
const ReelsPage = lazy(() => import('./pages/reels/ReelsPage'));
const DraftsPage = lazy(() => import('./pages/posts/DraftsPage'));

const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const CallRoom = lazy(() => import('./pages/chat/CallRoom'));

const LoginPage = lazy(() => import('./pages/auth/Login'));
const RegisterPage = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyAccount = lazy(() => import('./pages/auth/VerifyAccount'));

const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const WalletPage = lazy(() => import('./pages/wallet/WalletPage'));
const GamesPage = lazy(() => import('./pages/games/GamesPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const Marketplace = lazy(() => import('./pages/shop/Marketplace'));

const FeatureHub = lazy(() => import('./pages/misc/FeatureHub'));
const FollowSuggestions = lazy(() => import('./pages/discovery/FollowSuggestions'));
const ScheduledPosts = lazy(() => import('./pages/posts/ScheduledPosts'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const SafetyPage = lazy(() => import('./pages/safety/SafetyPage'));
const LiveList = lazy(() => import('./pages/live/LiveList'));
const LiveStudio = lazy(() => import('./pages/live/LiveStudio'));
const LiveWatch = lazy(() => import('./pages/live/LiveWatch'));

const StoriesPage = lazy(() => import('./pages/stories/StoriesPage'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CreatorPayouts = lazy(() => import('./pages/admin/CreatorPayouts'));
const ModerationDashboard = lazy(() => import('./pages/admin/ModerationDashboard'));

const NewsPage = lazy(() => import('./pages/apps/NewsPage'));
const MarketPage = lazy(() => import('./pages/apps/MarketPage'));
const Onboarding = lazy(() => import('./pages/intro/Onboarding'));

function LoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#04070D]">
      <div className="relative flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-[#00F2FE]/20 blur-2xl animate-pulse" />
          <motion.div
            animate={{ scale: [0.94, 1.06, 0.94], rotate: [0, 180, 360] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            className="h-16 w-16 rounded-2xl border border-[rgba(0,242,254,0.25)] bg-gradient-to-tr from-[#00F2FE] via-[#10B981] to-[#D4AF37] p-[2px] shadow-2xl shadow-[#00F2FE]/30"
          >
            <div className="h-full w-full rounded-[14px] bg-[#04070D] flex items-center justify-center">
              <span className="h-3 w-3 rounded-full bg-[#00F2FE] animate-ping" />
            </div>
          </motion.div>
        </div>
        <p className="font-display text-xs tracking-widest uppercase bg-gradient-to-r from-[#00F2FE] via-[#10B981] to-[#D4AF37] bg-clip-text text-transparent font-semibold">
          SocialVerse ∞ • Beyond Social
        </p>
      </div>
    </div>
  );
}

const RootRoute = () => {
  const { user, isLoading } = useSelector((s) => s.auth);
  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

  if (!hasSeenOnboarding) return <Navigate to="/welcome" replace />;
  if (isLoading) return <LoadingShell />;
  if (!user) return <Navigate to="/login" replace />;
  return <Feed />;
};

function AppContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewPostId, setViewPostId] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [createContent, setCreateContent] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const { socket } = useSocket();
  const { add: addToast } = useToast();

  const isImmersiveRoute =
    location.pathname.match(/\/chat\/[a-zA-Z0-9]+/) ||
    location.pathname.includes('/reels') ||
    location.pathname.includes('/live/watch');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleLogoutEvent = () => {
      dispatch(logout());
      navigate('/login', { replace: true });
    };

    const onOpenView = (e) => {
      if (e?.detail) setViewPostId(e.detail);
    };

    const onOpenComments = (e) => {
      if (e?.detail) setCommentPostId(e.detail);
    };

    const onOpenCreate = (e) => {
      if (e.detail) setCreateContent(e.detail);
      else setCreateContent(null);
      setOpenCreate(true);
    };

    const onOpenAdmin = () => setShowAdminPortal(true);
    const onOpenInstall = () => setShowInstallModal(true);

    const onApiError = (e) => {
      addToast(e.detail, { type: 'error' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener('openViewPost', onOpenView);
    window.addEventListener('openComments', onOpenComments);
    window.addEventListener('openCreatePost', onOpenCreate);
    window.addEventListener('openAdminGateway', onOpenAdmin);
    window.addEventListener('openInstallApp', onOpenInstall);
    window.addEventListener('api:error', onApiError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('openViewPost', onOpenView);
      window.removeEventListener('openComments', onOpenComments);
      window.removeEventListener('openCreatePost', onOpenCreate);
      window.removeEventListener('openAdminGateway', onOpenAdmin);
      window.removeEventListener('openInstallApp', onOpenInstall);
      window.removeEventListener('api:error', onApiError);
    };
  }, [dispatch, addToast, navigate]);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (data) => {
      if (data.type === 'message') return;
      addToast(data.message, { type: 'info', timeout: 4000 });
    };

    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [socket, addToast]);

  return (
    <div className="app-layout-frame relative flex h-[100dvh] overflow-hidden bg-[#04070D] font-sans text-[#F8FAFC]">
      <CinematicEnvironmentalBackdrop />

      {!isOnline && (
        <div className="absolute left-0 right-0 top-0 z-[9999] bg-[#070F1E] border-b border-[#00F2FE]/40 py-1 text-center text-xs font-bold text-[#00F2FE] shadow-md">
          You are offline. Reconnecting to SocialVerse network...
        </div>
      )}

      <Navbar />

      <div className="pointer-events-none absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-[#00F2FE]/10 blur-[150px]" />
      <div className="pointer-events-none absolute top-[25%] right-[-10%] h-[45%] w-[45%] rounded-full bg-[#10B981]/08 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[20%] h-[50%] w-[50%] rounded-full bg-[#D4AF37]/07 blur-[160px]" />

      <main
        id="main-scroll-container"
        className={`relative z-10 h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth pt-20 md:pt-0 ${
          isImmersiveRoute ? 'pb-0' : 'pb-24'
        } md:pb-0 md:ml-[270px] md:w-[calc(100%-270px)]`}
      >
        <Suspense fallback={<LoadingShell />}>
          <ErrorBoundary>
            <Routes>
              <Route path="/welcome" element={<PageTransition><Onboarding /></PageTransition>} />
                <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
                <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
                <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
                <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
                <Route path="/verify-account" element={<PageTransition><VerifyAccount /></PageTransition>} />

                <Route element={<MainLayout />}>
                  <Route path="/" element={<PageTransition><RootRoute /></PageTransition>} />
                  <Route path="/explore" element={<PageTransition><Explore /></PageTransition>} />
                  <Route path="/search/advanced" element={<PageTransition><SearchAdvanced /></PageTransition>} />
                  <Route path="/reels" element={<PageTransition><ReelsPage /></PageTransition>} />
                  <Route path="/tags/:tag" element={<PageTransition><TagFeed /></PageTransition>} />

                  <Route path="/chat" element={<ProtectedRoute><PageTransition><ChatPage /></PageTransition></ProtectedRoute>} />
                  <Route path="/chat/:id" element={<ProtectedRoute><PageTransition><ChatPage /></PageTransition></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><PageTransition><NotificationsPage /></PageTransition></ProtectedRoute>} />
                  <Route path="/saved" element={<ProtectedRoute><PageTransition><SavedPage /></PageTransition></ProtectedRoute>} />
                  <Route path="/memories" element={<ProtectedRoute><PageTransition><MemoriesPage /></PageTransition></ProtectedRoute>} />
                  <Route path="/groups" element={<PageTransition><FollowSuggestions /></PageTransition>} />
                  <Route path="/drafts" element={<ProtectedRoute><PageTransition><DraftsPage /></PageTransition></ProtectedRoute>} />

                  <Route path="/profile/:id" element={<PageTransition><ProfilePage /></PageTransition>} />
                  <Route path="/post/:id" element={<PageTransition><PostPage /></PageTransition>} />

                  <Route path="/shop" element={<PageTransition><Marketplace /></PageTransition>} />
                  <Route path="/marketplace" element={<Navigate to="/shop" replace />} />
                  <Route path="/events" element={<PageTransition><EventsPage /></PageTransition>} />
                  <Route path="/wallet" element={<ProtectedRoute><PageTransition><WalletPage /></PageTransition></ProtectedRoute>} />
                  <Route path="/games" element={<PageTransition><GamesPage /></PageTransition>} />
                  <Route path="/analytics" element={<ProtectedRoute><PageTransition><AnalyticsPage /></PageTransition></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><PageTransition><SettingsPage /></PageTransition></ProtectedRoute>} />
                  <Route path="/report" element={<ProtectedRoute><PageTransition><SafetyPage /></PageTransition></ProtectedRoute>} />

                  <Route path="/apps/news" element={<ProtectedRoute><PageTransition><NewsPage /></PageTransition></ProtectedRoute>} />
                  <Route path="/apps/markets" element={<ProtectedRoute><PageTransition><MarketPage /></PageTransition></ProtectedRoute>} />

                  <Route path="/live" element={<ProtectedRoute><LiveList /></ProtectedRoute>} />
                  <Route path="/live/list" element={<ProtectedRoute><LiveList /></ProtectedRoute>} />
                  <Route path="/live/studio" element={<ProtectedRoute><LiveStudio /></ProtectedRoute>} />
                  <Route path="/live/watch/:roomId" element={<ProtectedRoute><LiveWatch /></ProtectedRoute>} />

                  <Route path="/stories" element={<ProtectedRoute><StoriesPage /></ProtectedRoute>} />
                  <Route path="/feature-hub" element={<PageTransition><FeatureHub /></PageTransition>} />
                  <Route path="/command-center" element={<PageTransition><FeatureHub /></PageTransition>} />
                  <Route path="/discovery/follow-suggestions" element={<PageTransition><FollowSuggestions /></PageTransition>} />
                  <Route path="/scheduled-posts" element={<ProtectedRoute><PageTransition><ScheduledPosts /></PageTransition></ProtectedRoute>} />

                  <Route element={<AdminRoute />}>
                    <Route path="/admin/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
                    <Route path="/admin/payouts" element={<PageTransition><CreatorPayouts /></PageTransition>} />
                    <Route path="/admin/moderation" element={<PageTransition><ModerationDashboard /></PageTransition>} />
                  </Route>
                </Route>

                <Route path="/discover" element={<PageTransition><SwipeExplore /></PageTransition>} />
                <Route path="/chat/call/:roomId" element={<ProtectedRoute><PageTransition><CallRoom /></PageTransition></ProtectedRoute>} />
                <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </ErrorBoundary>
        </Suspense>

        <CreatePostModal
          isOpen={openCreate}
          onClose={() => setOpenCreate(false)}
          initialData={createContent}
          onPosted={() => {
            setOpenCreate(false);
            setCreateContent(null);
          }}
        />
        <CommentsModal postId={commentPostId} isOpen={!!commentPostId} onClose={() => setCommentPostId(null)} />
        <PostModal postId={viewPostId} isOpen={!!viewPostId} onClose={() => setViewPostId(null)} />
        <IncomingCallModal />
        <UpdateNotificationBanner />
        <CommandPalette onOpenAdminPortal={() => setShowAdminPortal(true)} />
        <AdminCyberGateway isOpen={showAdminPortal} onClose={() => setShowAdminPortal(false)} />
        <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}