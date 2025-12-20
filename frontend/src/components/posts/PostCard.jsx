// frontend/src/components/posts/PostCard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaRegBookmark,
  FaEllipsisH,
  FaTrash,
  FaExclamationTriangle,
  FaLink,
  FaUserSecret
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import { useSelector } from "react-redux";
import { useToast } from "../ui/ToastProvider";
import UserAvatar from "../ui/UserAvatar";
import ReportModal from "../ui/ReportModal";
import ConfirmModal from "../ui/ConfirmModal";
import LinkPreviewCard from '../ui/LinkPreviewCard'; 
export default function PostCard({ post: initialPost }) {
  const myId = useSelector((s) => s.auth.user?._id);
  const { add: addToast } = useToast();

  const [post, setPost] = useState(initialPost);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [processingLike, setProcessingLike] = useState(false);
  const [closeFriendsIncluded, setCloseFriendsIncluded] = useState(false); // optimistic

  // Keep local post in sync with prop
  useEffect(() => setPost(initialPost), [initialPost]);

  // Initialize any flags (e.g., saved, close friends) if your backend provides them
  useEffect(() => {
    setIsSaved(Boolean(initialPost?.saved));
    setCloseFriendsIncluded(Boolean(initialPost?.closeFriends?.includes(myId)));
  }, [initialPost, myId]);

  const isMine = Boolean(post.user?._id === myId);
  const images = post.images || post.media?.filter(m => m.type === 'image').map(m => m.url) || [];
  const videos = post.videos || post.media?.filter(m => m.type === 'video').map(m => m.url) || [];

 // Find your existing handleShare function and REPLACE it with this advanced version:

// --- ADVANCED SHARE ---
const handleShare = async () => {
  const url = `${window.location.origin}/post/${post._id}`;
  const shareData = {
    title: `Check out ${post.user?.name}'s post`,
    text: post.content?.slice(0, 100) || 'Amazing content on SocialApp',
    url: url
  };

  // 1. Try Native Mobile Share
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return; // Success
    } catch (e) {
      // User cancelled or failed, fall back to clipboard
    }
  }

  // 2. Fallback to Clipboard
  try {
    await navigator.clipboard.writeText(url);
    addToast("Link copied to clipboard", { type: "success" });
  } catch (err) {
    addToast("Couldn't copy link", { type: "error" });
  }
  setShowMenu(false);
};

  // --- DELETE ---
  const handleDelete = async () => {
    try {
      await API.delete(`/posts/${post._id}`);
      addToast("Post deleted", { type: "info" });
      window.dispatchEvent(new CustomEvent('postDeleted', { detail: post._id }));
    } catch (e) {
      addToast("Failed to delete post", { type: "error" });
    } finally {
      setShowDelete(false);
    }
  };

  // --- LIKE (optimistic) ---
  const handleLike = async () => {
    if (!post?._id || processingLike) return;
    setProcessingLike(true);

    const liked = Array.isArray(post.likes) && post.likes.includes(myId);
    setPost(prev => ({
      ...prev,
      likes: liked ? prev.likes.filter(id => id !== myId) : [...(prev.likes || []), myId]
    }));

    try {
      await API.put(`/posts/like/${post._id}`);
    } catch (e) {
      // revert on failure
      setPost(initialPost);
      addToast("Failed to update like", { type: "error" });
    } finally {
      setProcessingLike(false);
    }
  };

  // --- Save / Unsave (local optimistic) ---
  const toggleSave = () => {
    setIsSaved(s => !s);
    addToast(!isSaved ? "Saved" : "Removed from saved", { type: "info" });
    // Optionally persist to API:
    // API.post(`/posts/${post._id}/save`).catch(()=>{/* ignore for now */});
  };

  // --- Manage Close Friends (optimistic) ---
  const toggleCloseFriends = async () => {
    const next = !closeFriendsIncluded;
    setCloseFriendsIncluded(next);
    addToast(next ? "Added to Close Friends" : "Removed from Close Friends", { type: "info" });
    setShowMenu(false);
    try {
      // Replace endpoint with your real one if different
      await API.post(`/posts/${post._id}/close-friends`, { include: next });
      // Optionally update post state with returned data
    } catch (e) {
      setCloseFriendsIncluded(prev => !prev); // revert
      addToast("Failed to update Close Friends", { type: "error" });
    }
  };

  // --- Copy Link quick helper ---
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
      addToast("Copied!", { type: "success" });
    } catch (e) {
      addToast("Could not copy", { type: "error" });
    }
    setShowMenu(false);
  };

  // --- Accessibility & helper: close menu when clicking outside handled by overlay div below ---

  // Poll helpers (from your older implementation)
  const totalVotes = post?.poll?.options?.reduce((acc, o) => acc + (o.votes?.length || 0), 0) || 0;

  const handleVote = async (index) => {
    try {
      const res = await API.post(`/polls/${post._id}/vote/${index}`);
      setPost(res.data);
      addToast("Vote recorded!", { type: "success" });
    } catch (err) {
      addToast(err?.userMessage || "Failed to vote", { type: "error" });
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden relative"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.user?._id}`}>
            <UserAvatar src={post.user?.avatar} name={post.user?.name} />
          </Link>
          <div>
            <Link to={`/profile/${post.user?._id}`} className="font-bold text-sm hover:text-indigo-500">{post.user?.name}</Link>
            <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Three Dots Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(s => !s)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-haspopup="menu"
            aria-expanded={showMenu}
            aria-label="Post options"
          >
            <FaEllipsisH />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                {/* overlay to close menu on outside click */}
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} aria-hidden="true" />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-700 z-20 overflow-hidden"
                  role="menu"
                >
                  <button
                    onClick={handleShare}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 text-sm"
                    role="menuitem"
                  >
                    <FaShare /> Share Post
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 text-sm"
                    role="menuitem"
                  >
                    <FaLink /> Copy Link
                  </button>

                  <button
                    onClick={() => { toggleCloseFriends(); }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 text-sm"
                    role="menuitem"
                  >
                    <FaUserSecret /> {closeFriendsIncluded ? "Remove from Close Friends" : "Add to Close Friends"}
                  </button>

                  {isMine ? (
                    <button
                      onClick={() => { setShowDelete(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-3 text-sm"
                      role="menuitem"
                    >
                      <FaTrash /> Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowReport(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-3 text-sm"
                      role="menuitem"
                    >
                      <FaExclamationTriangle /> Report
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2 text-sm whitespace-pre-wrap dark:text-gray-200">
    {post.content}
    {/* Automatically show preview if link exists in content */}
    <LinkPreviewCard text={post.content} />
</div>
      
      {/* Media */}
      {images.length > 0 && (
        <div className="mt-2">
          {/* show first image for simplicity; expandable gallery can be added */}
          <img
            src={images[0]}
            alt={post.content ? post.content.slice(0, 80) : "Post image"}
            className="w-full max-h-[500px] object-cover cursor-pointer"
            onDoubleClick={handleLike}
          />
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-2">
          <video src={videos[0]} controls className="w-full max-h-[500px] object-cover bg-black" />
        </div>
      )}

      {/* Polls (if present) */}
      {post.poll && post.poll.options && (
        <div className="p-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
            <h4 className="font-bold mb-3 text-sm">{post.poll.question}</h4>
            <div className="space-y-2">
              {post.poll.options.map((opt, idx) => {
                const percent = totalVotes === 0 ? 0 : Math.round(((opt.votes?.length || 0) / totalVotes) * 100);
                const hasVoted = opt.votes?.includes(myId);
                return (
                  <button
                    key={idx}
                    onClick={() => handleVote(idx)}
                    className={`relative w-full text-left p-3 rounded-lg text-sm font-medium transition overflow-hidden border ${hasVoted ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <div className="absolute top-0 left-0 bottom-0 bg-indigo-200 dark:bg-indigo-600/40 transition-all duration-500" style={{ width: `${percent}%` }} />
                    <div className="relative flex justify-between z-10">
                      <span>{opt.text}</span>
                      <span>{percent}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-gray-500 text-right">
              {new Date(post.poll.expiresAt) < new Date() ? "Poll Ended" : "Voting Open"}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex gap-6 text-xl items-center">
          <button onClick={handleLike} className="transition active:scale-90" aria-pressed={post.likes?.includes(myId)}>
            {post.likes?.includes(myId) ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
          </button>

          <button onClick={() => window.dispatchEvent(new CustomEvent("openComments", { detail: post._id }))} aria-label="Open comments">
            <FaComment className="text-gray-600 dark:text-gray-300" />
          </button>

          <button onClick={handleShare} aria-label="Share">
            <FaShare className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <button onClick={toggleSave} aria-pressed={isSaved}>
          {isSaved ? <FaBookmark className="text-indigo-600" /> : <FaRegBookmark />}
        </button>
      </div>

      {/* Modals */}
      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} targetPostId={post._id} />
      <ConfirmModal isOpen={showDelete} onCancel={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Post?" />
    </motion.article>
  );
}
