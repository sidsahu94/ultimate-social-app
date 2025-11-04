// frontend/src/App.jsx (only the top lazy imports need to match; full file below if you want)
import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/layouts/Navbar";
import Feed from "./pages/home/Feed";
import ProfilePage from "./pages/profile/ProfilePage";
import PostModal from "./components/posts/PostModal";
import CommentsModal from "./components/posts/CommentsModal";
import CreatePostModal from "./components/posts/CreatePostModal";
import "./index.css";

const Explore = lazy(() => import("./pages/explore/Explore"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const LoginPage = lazy(() => import("./pages/auth/Login"));     // <- ensure these paths match file names
const RegisterPage = lazy(() => import("./pages/auth/Register")); // <- ensure these paths match file names

function LoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-gray-500">Loading…</div>
    </div>
  );
}

export default function App() {
  const [viewPostId, setViewPostId] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    const onOpenView = (e) => { const id = e?.detail; if (id) setViewPostId(id); };
    const onOpenComments = (e) => { const id = e?.detail; if (id) setCommentPostId(id); };
    const onOpenCreate = () => setOpenCreate(true);
    window.addEventListener("openViewPost", onOpenView);
    window.addEventListener("openComments", onOpenComments);
    window.addEventListener("openCreatePost", onOpenCreate);
    window.addEventListener("postCreated", () => {}); // noop
    return () => {
      window.removeEventListener("openViewPost", onOpenView);
      window.removeEventListener("openComments", onOpenComments);
      window.removeEventListener("openCreatePost", onOpenCreate);
      window.removeEventListener("postCreated", () => {});
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <main className="py-6">
          <Suspense fallback={<LoadingShell />}>
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<div className="max-w-4xl mx-auto p-8 text-center"> <h2 className="text-2xl font-semibold">404 — Page not found</h2> <p className="mt-2 text-gray-500">We couldn't find that page.</p> </div>} />
            </Routes>
          </Suspense>
        </main>

        {/* Global modals */}
        <CreatePostModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onPosted={() => setOpenCreate(false)} />
        <CommentsModal postId={commentPostId} isOpen={!!commentPostId} onClose={() => setCommentPostId(null)} />
        <PostModal postId={viewPostId} isOpen={!!viewPostId} onClose={() => setViewPostId(null)} />
      </div>
    </Router>
  );
}
