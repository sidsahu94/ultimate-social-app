// frontend/src/App.jsx
import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "./redux/slices/authSlice";

// Contexts & Hooks
import { useSocket } from './contexts/SocketContext';
import { useToast } from './components/ui/ToastProvider';

// Components
import MainLayout from "./components/layouts/MainLayout";
import PostModal from "./components/posts/PostModal";
import CommentsModal from "./components/posts/CommentsModal";
import CreatePostModal from "./components/posts/CreatePostModal";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";
import ErrorBoundary from './components/common/ErrorBoundary';
import NotFound from "./pages/misc/NotFound"; 

// Styles
import "./index.css";

// --- Lazy Load Pages ---
// Core
const Feed = lazy(() => import("./pages/home/Feed"));
const Explore = lazy(() => import("./pages/explore/Explore"));
const SwipeExplore = lazy(() => import("./pages/discovery/SwipeExplore"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const SavedPage = lazy(() => import("./pages/saved/Saved"));
const TagFeed = lazy(() => import("./pages/explore/TagFeed"));
const SearchAdvanced = lazy(() => import("./pages/explore/SearchAdvanced"));

// Content & Profile
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const PostPage = lazy(() => import("./pages/posts/PostPage"));
const ReelsPage = lazy(() => import("./pages/reels/ReelsPage"));
const DraftsPage = lazy(() => import("./pages/posts/DraftsPage")); 

// Chat
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const CallRoom = lazy(() => import("./pages/chat/CallRoom"));

// Auth
const LoginPage = lazy(() => import("./pages/auth/Login"));
const RegisterPage = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyAccount = lazy(() => import("./pages/auth/VerifyAccount"));

// Apps Ecosystem
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const WalletPage = lazy(() => import("./pages/wallet/WalletPage"));
const GamesPage = lazy(() => import("./pages/games/GamesPage"));
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));
const Marketplace = lazy(() => import("./pages/shop/Marketplace"));

// Utilities & Admin
const FeatureHub = lazy(() => import("./pages/misc/FeatureHub"));
const FollowSuggestions = lazy(() => import("./pages/discovery/FollowSuggestions"));
const ScheduledPosts = lazy(() => import("./pages/posts/ScheduledPosts"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const SafetyPage = lazy(() => import("./pages/safety/SafetyPage"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard")); 
const CreatorPayouts = lazy(() => import("./pages/admin/CreatorPayouts"));
const ModerationDashboard = lazy(() => import("./pages/admin/ModerationDashboard"));

// Integration Apps
const NewsPage = lazy(() => import("./pages/apps/NewsPage"));
const MarketPage = lazy(() => import("./pages/apps/MarketPage"));
const Onboarding = lazy(() => import("./pages/intro/Onboarding"));

function LoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505]">
      <div className="text-indigo-500 font-semibold animate-pulse flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        Loading...
      </div>
    </div>
  );
}

// Root Guard
const RootRoute = () => {
  const { user } = useSelector(s => s.auth);
  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

  if (!hasSeenOnboarding) return <Navigate to="/welcome" replace />;
  if (!user) return <Navigate to="/login" replace />;
  return <Feed />;
};

// 🔥 INNER APP COMPONENT (Where hooks like useNavigate work)
function AppContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Now valid because it's inside <Router> context
  
  const [viewPostId, setViewPostId] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [createContent, setCreateContent] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { socket } = useSocket();
  const { add: addToast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // 🔥 SMOOTH LOGOUT
    const handleLogoutEvent = () => {
        dispatch(logout());
        // Use router navigation instead of window.location.href
        navigate('/login', { replace: true });
    };

    const onOpenView = (e) => { if (e?.detail) setViewPostId(e.detail); };
    const onOpenComments = (e) => { if (e?.detail) setCommentPostId(e.detail); };
    const onOpenCreate = (e) => { 
        if (e.detail) setCreateContent(e.detail); 
        else setCreateContent(null);
        setOpenCreate(true); 
    };

    const onApiError = (e) => {
        addToast(e.detail, { type: 'error' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener("openViewPost", onOpenView);
    window.addEventListener("openComments", onOpenComments);
    window.addEventListener("openCreatePost", onOpenCreate);
    window.addEventListener('api:error', onApiError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener("openViewPost", onOpenView);
      window.removeEventListener("openComments", onOpenComments);
      window.removeEventListener("openCreatePost", onOpenCreate);
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
    <>
      {!isOnline && (
         <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-xs font-bold text-center py-1 shadow-md">
           You are offline. Check your internet connection.
         </div>
      )}

      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      <Suspense fallback={<LoadingShell />}>
        <ErrorBoundary>
            <Routes>
            <Route path="/welcome" element={<Onboarding />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-account" element={<VerifyAccount />} />

            <Route element={<MainLayout />}>
                <Route path="/" element={<RootRoute />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/search/advanced" element={<SearchAdvanced />} />
                <Route path="/reels" element={<ReelsPage />} />
                <Route path="/tags/:tag" element={<TagFeed />} /> 
                
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
                <Route path="/drafts" element={<ProtectedRoute><DraftsPage /></ProtectedRoute>} />
                
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/post/:id" element={<PostPage />} />
                
                <Route path="/shop" element={<Marketplace />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/report" element={<ProtectedRoute><SafetyPage /></ProtectedRoute>} />
                
                <Route path="/apps/news" element={<ProtectedRoute><NewsPage /></ProtectedRoute>} />
                <Route path="/apps/markets" element={<ProtectedRoute><MarketPage /></ProtectedRoute>} />

                <Route path="/feature-hub" element={<FeatureHub />} />
                <Route path="/discovery/follow-suggestions" element={<FollowSuggestions />} />
                <Route path="/scheduled-posts" element={<ProtectedRoute><ScheduledPosts /></ProtectedRoute>} />
                
                <Route element={<AdminRoute />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/payouts" element={<CreatorPayouts />} />
                    <Route path="/admin/moderation" element={<ModerationDashboard />} />
                </Route>
            </Route>

            <Route path="/discover" element={<SwipeExplore />} />
            <Route path="/chat/call/:roomId" element={<ProtectedRoute><CallRoom /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
        </ErrorBoundary>
      </Suspense>

      <CreatePostModal 
        isOpen={openCreate} 
        onClose={() => setOpenCreate(false)} 
        initialData={createContent} 
        onPosted={() => { setOpenCreate(false); setCreateContent(null); }} 
      />
      <CommentsModal postId={commentPostId} isOpen={!!commentPostId} onClose={() => setCommentPostId(null)} />
      <PostModal postId={viewPostId} isOpen={!!viewPostId} onClose={() => setViewPostId(null)} />
    </>
  );
}

// MAIN ENTRY POINT
export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
       <AppContent />
    </Router>
  );
}