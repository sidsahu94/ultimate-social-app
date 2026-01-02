import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "./redux/slices/authSlice";

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

// Loading Spinner
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

export default function App() {
  const dispatch = useDispatch();
  const [viewPostId, setViewPostId] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);
  
  // Create Modal State
  const [openCreate, setOpenCreate] = useState(false);
  const [createContent, setCreateContent] = useState(null); // For Drafts/Reposts

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 1. Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Global Event Listeners
  useEffect(() => {
    // Logout Handler (from API interceptor)
    const handleLogoutEvent = () => {
        dispatch(logout());
        if (window.location.pathname !== '/login') {
            window.location.href = '/login'; 
        }
    };

    // Modal Handlers
    const onOpenView = (e) => { if (e?.detail) setViewPostId(e.detail); };
    const onOpenComments = (e) => { if (e?.detail) setCommentPostId(e.detail); };
    
    // Open Create (handles new post OR draft/repost)
    const onOpenCreate = (e) => { 
        if (e.detail) setCreateContent(e.detail); 
        else setCreateContent(null);
        setOpenCreate(true); 
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener("openViewPost", onOpenView);
    window.addEventListener("openComments", onOpenComments);
    window.addEventListener("openCreatePost", onOpenCreate);

    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener("openViewPost", onOpenView);
      window.removeEventListener("openComments", onOpenComments);
      window.removeEventListener("openCreatePost", onOpenCreate);
    };
  }, [dispatch]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      
      {/* Offline Banner */}
      {!isOnline && (
         <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-xs font-bold text-center py-1 shadow-md">
           You are offline. Check your internet connection.
         </div>
      )}

      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      <Suspense fallback={<LoadingShell />}>
        <ErrorBoundary>
            <Routes>
            {/* --- Main App Layout --- */}
            <Route element={<MainLayout />}>
                {/* Public Feeds */}
                <Route path="/" element={<Feed />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/reels" element={<ReelsPage />} />
                
                {/* Protected User Routes */}
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
                <Route path="/drafts" element={<ProtectedRoute><DraftsPage /></ProtectedRoute>} />
                
                {/* Dynamic Content */}
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/post/:id" element={<PostPage />} />
                
                {/* Apps & Features */}
                <Route path="/shop" element={<Marketplace />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/report" element={<ProtectedRoute><SafetyPage /></ProtectedRoute>} />
                
                {/* Utilities */}
                <Route path="/feature-hub" element={<FeatureHub />} />
                <Route path="/discovery/follow-suggestions" element={<FollowSuggestions />} />
                <Route path="/scheduled-posts" element={<ProtectedRoute><ScheduledPosts /></ProtectedRoute>} />
                
                {/* Admin Routes (Guarded) */}
                <Route element={<AdminRoute />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/payouts" element={<CreatorPayouts />} />
                    <Route path="/admin/moderation" element={<ModerationDashboard />} />
                </Route>
            </Route>

            {/* --- Full Screen Pages --- */}
            <Route path="/discover" element={<SwipeExplore />} />
            
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Video Call (Protected) */}
            <Route 
                path="/chat/call/:roomId" 
                element={
                    <ProtectedRoute>
                        <CallRoom />
                    </ProtectedRoute>
                } 
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
            </Routes>
        </ErrorBoundary>
      </Suspense>

      {/* --- Global Modals --- */}
      <CreatePostModal 
        isOpen={openCreate} 
        onClose={() => setOpenCreate(false)} 
        initialData={createContent} // Pass Draft/Repost content
        onPosted={() => { setOpenCreate(false); setCreateContent(null); }} 
      />
      <CommentsModal postId={commentPostId} isOpen={!!commentPostId} onClose={() => setCommentPostId(null)} />
      <PostModal postId={viewPostId} isOpen={!!viewPostId} onClose={() => setViewPostId(null)} />
    </Router>
  );
}