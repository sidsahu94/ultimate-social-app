import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "./redux/slices/authSlice";

// Components
import MainLayout from "./components/layouts/MainLayout";
import PostModal from "./components/posts/PostModal";
import CommentsModal from "./components/posts/CommentsModal";
import CreatePostModal from "./components/posts/CreatePostModal";
import NotFound from "./pages/misc/NotFound"; 
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from "./components/common/ProtectedRoute"; // For standard protected pages
import AdminRoute from "./components/common/AdminRoute";         // For admin-only pages

// Styles
import "./index.css";

// --- Lazy Load Pages ---

// Core Features
const Feed = lazy(() => import("./pages/home/Feed"));
const Explore = lazy(() => import("./pages/explore/Explore"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const PostPage = lazy(() => import("./pages/posts/PostPage"));
const SavedPage = lazy(() => import("./pages/saved/Saved"));

// Auth & Full Screen Pages
const ReelsPage = lazy(() => import("./pages/reels/ReelsPage"));
const LoginPage = lazy(() => import("./pages/auth/Login"));
const RegisterPage = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const SwipeExplore = lazy(() => import("./pages/discovery/SwipeExplore"));

// The "Apps" Ecosystem
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const WalletPage = lazy(() => import("./pages/wallet/WalletPage"));
const GamesPage = lazy(() => import("./pages/games/GamesPage"));
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));
const Marketplace = lazy(() => import("./pages/shop/Marketplace"));

// Utilities & Admin
const FeatureHub = lazy(() => import("./pages/misc/FeatureHub"));
const FollowSuggestions = lazy(() => import("./pages/discovery/FollowSuggestions"));
const ScheduledPosts = lazy(() => import("./pages/posts/ScheduledPosts"));
const CreatorPayouts = lazy(() => import("./pages/admin/CreatorPayouts"));
const ModerationDashboard = lazy(() => import("./pages/admin/ModerationDashboard"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const SafetyPage = lazy(() => import("./pages/safety/SafetyPage"));

// Call Room (WebRTC)
const CallRoom = lazy(() => import("./pages/chat/CallRoom"));

// Loading UI
function LoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505]">
      <div className="text-indigo-500 font-semibold animate-pulse">Loading Experience...</div>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const [viewPostId, setViewPostId] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
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

  // 2. Global Modal Listeners (triggered via CustomEvents)
  useEffect(() => {
    const onOpenView = (e) => { const id = e?.detail; if (id) setViewPostId(id); };
    const onOpenComments = (e) => { const id = e?.detail; if (id) setCommentPostId(id); };
    const onOpenCreate = () => setOpenCreate(true);

    window.addEventListener("openViewPost", onOpenView);
    window.addEventListener("openComments", onOpenComments);
    window.addEventListener("openCreatePost", onOpenCreate);

    return () => {
      window.removeEventListener("openViewPost", onOpenView);
      window.removeEventListener("openComments", onOpenComments);
      window.removeEventListener("openCreatePost", onOpenCreate);
    };
  }, []);

  // 3. Global Session Expiry Handler (triggered by api.js interceptor)
  useEffect(() => {
    const handleLogoutEvent = () => {
        dispatch(logout()); // Clear Redux state
        // Use window location for hard redirect to ensure clean state
        if (window.location.pathname !== '/login') {
            window.location.href = '/login'; 
        }
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [dispatch]);

  return (
    // Future flags enabled to silence Router warnings in React 18/Vite
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      
      {/* Offline Banner */}
      {!isOnline && (
         <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-xs font-bold text-center py-1 shadow-md">
           You are offline. Check your connection.
         </div>
      )}

      {/* Aurora Background Layer */}
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      <Suspense fallback={<LoadingShell />}>
        <ErrorBoundary>
            <Routes>
            {/* --- Main App Layout (Sidebar + Content) --- */}
            <Route element={<MainLayout />}>
                {/* Public / Semi-Public Feeds */}
                <Route path="/" element={<Feed />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/reels" element={<ReelsPage />} />
                
                {/* Protected Features */}
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
                
                {/* Dynamic Content */}
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/post/:id" element={<PostPage />} />
                
                {/* The "Super App" Apps */}
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
                    <Route path="/admin/payouts" element={<CreatorPayouts />} />
                    <Route path="/admin/moderation" element={<ModerationDashboard />} />
                </Route>
            </Route>

            {/* --- Full Screen Pages (No Sidebar) --- */}
            <Route path="/discover" element={<SwipeExplore />} />
            
            {/* Auth Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Video Call Room (Must be protected) */}
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
      <CreatePostModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onPosted={() => setOpenCreate(false)} />
      <CommentsModal postId={commentPostId} isOpen={!!commentPostId} onClose={() => setCommentPostId(null)} />
      <PostModal postId={viewPostId} isOpen={!!viewPostId} onClose={() => setViewPostId(null)} />
    </Router>
  );
}