import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import PostModal from "./components/posts/PostModal";
import CommentsModal from "./components/posts/CommentsModal";
import CreatePostModal from "./components/posts/CreatePostModal";
import "./index.css";

// --- Lazy Load Pages ---
// Core
const Feed = lazy(() => import("./pages/home/Feed"));
const Explore = lazy(() => import("./pages/explore/Explore"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const PostPage = lazy(() => import("./pages/posts/PostPage"));
const ShopPage = lazy(() => import("./pages/shop/Shop"));
const SavedPage = lazy(() => import("./pages/saved/Saved"));

// Auth & Full Screen
const ReelsPage = lazy(() => import("./pages/reels/ReelsPage"));
const LoginPage = lazy(() => import("./pages/auth/Login"));
const RegisterPage = lazy(() => import("./pages/auth/Register"));
const SwipeExplore = lazy(() => import("./pages/discovery/SwipeExplore"));

// New "Apps" Ecosystem
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const WalletPage = lazy(() => import("./pages/wallet/WalletPage"));
const GamesPage = lazy(() => import("./pages/games/GamesPage"));
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));
const Marketplace = lazy(() => import("./pages/shop/Marketplace")); // Replaces simple Shop

// Utilities & Admin
const FeatureHub = lazy(() => import("./pages/misc/FeatureHub"));
const FollowSuggestions = lazy(() => import("./pages/discovery/FollowSuggestions"));
const ScheduledPosts = lazy(() => import("./pages/posts/ScheduledPosts"));
const CreatorPayouts = lazy(() => import("./pages/admin/CreatorPayouts"));
const ModerationDashboard = lazy(() => import("./pages/admin/ModerationDashboard"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const SafetyPage = lazy(() => import("./pages/safety/SafetyPage"));

// Loading UI
function LoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505]">
      <div className="text-indigo-500 font-semibold animate-pulse">Loading Experience...</div>
    </div>
  );
}

export default function App() {
  const [viewPostId, setViewPostId] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);

  // Global Modal Listeners
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

  return (
    // Future flags enabled to silence Router warnings
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      
      {/* Aurora Background Layer */}
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      <Suspense fallback={<LoadingShell />}>
        <Routes>
          {/* --- Main App Layout (Sidebar + Content) --- */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Feed />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/post/:id" element={<PostPage />} />
            
            {/* The "Super App" Features */}
            <Route path="/shop" element={<Marketplace />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/report" element={<SafetyPage />} />
            
            {/* Utilities */}
            <Route path="/feature-hub" element={<FeatureHub />} />
            <Route path="/discovery/follow-suggestions" element={<FollowSuggestions />} />
            <Route path="/scheduled-posts" element={<ScheduledPosts />} />
            
            {/* Admin */}
            <Route path="/admin/payouts" element={<CreatorPayouts />} />
            <Route path="/admin/moderation" element={<ModerationDashboard />} />
          </Route>

          {/* --- Full Screen Pages (No Sidebar) --- */}
          <Route path="/reels" element={<ReelsPage />} />
          <Route path="/discover" element={<SwipeExplore />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 404 Fallback */}
          <Route path="*" element={<div className="h-screen grid place-items-center text-gray-500">404 - Page Not Found</div>} />
        </Routes>
      </Suspense>

      {/* --- Global Modals --- */}
      <CreatePostModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onPosted={() => setOpenCreate(false)} />
      <CommentsModal postId={commentPostId} isOpen={!!commentPostId} onClose={() => setCommentPostId(null)} />
      <PostModal postId={viewPostId} isOpen={!!viewPostId} onClose={() => setViewPostId(null)} />
    </Router>
  );
}