import React, { useState, useEffect, useRef } from "react";
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
  FaUserSecret,
  FaPen,
  FaVolumeMute,
  FaVolumeUp,
  FaPaperPlane
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import socket from "../../services/socket"; // 🔥 Import Socket
import { useSelector, useDispatch } from "react-redux"; // 🔥 Import useDispatch
import { updateAuthUser } from "../../redux/slices/authSlice"; // 🔥 Import Action
import { useToast } from "../ui/ToastProvider";
import UserAvatar from "../ui/UserAvatar";
import ReportModal from "../ui/ReportModal";
import ConfirmModal from "../ui/ConfirmModal";
import EditPostModal from "./EditPostModal";
import ShareModal from "./ShareModal";
import LikesModal from "./LikesModal";
import LinkPreviewCard from "../ui/LinkPreviewCard";
import Lightbox from "../ui/Lightbox";
import { timeAgo } from "../../utils/dateUtils";
import useVideoSettings from "../../hooks/useVideoSettings";

const PostCard = ({ post: initialPost }) => {
  const dispatch = useDispatch(); // 🔥 Dispatch for Redux updates
  const myId = useSelector((s) => s.auth.user?._id);
  const currentUser = useSelector((s) => s.auth.user);
  const { add: addToast } = useToast();

  const [post, setPost] = useState(initialPost);
  
  // 🔥 FIX: Initialize saved state based on Redux User State, not just post data
  const [isSaved, setIsSaved] = useState(
    currentUser?.saved?.includes(initialPost._id) || false
  );

  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  const [processingLike, setProcessingLike] = useState(false);
  const [closeFriendsIncluded, setCloseFriendsIncluded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [clickTimeout, setClickTimeout] = useState(null);

  const { isMuted, toggleMute } = useVideoSettings();
  const videoRef = useRef(null);

  const displayUser = (post.user?._id === currentUser?._id) 
      ? { ...post.user, ...currentUser } 
      : post.user;

  // Sync prop updates
  useEffect(() => setPost(initialPost), [initialPost]);

  // Sync local state logic
  useEffect(() => {
    // We already handle isSaved via Redux initial state above, but syncing close friends is good
    setCloseFriendsIncluded(Boolean(initialPost?.closeFriends?.includes(myId)));
  }, [initialPost, myId]);

  // 🔥 NEW: Listen for real-time like updates from Socket
  useEffect(() => {
    const handleUpdate = (updatedData) => {
        if (updatedData._id === post._id) {
            setPost(prev => ({
                ...prev,
                likes: updatedData.likes, // Update likes array
                // commentsCount: updatedData.commentsCount // Optional if backend sends it
            }));
        }
    };

    socket.on('post:updated', handleUpdate);
    return () => socket.off('post:updated', handleUpdate);
  }, [post._id]);

  // Video Intersection Observer
  useEffect(() => {
    if (!videoRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [post.videos]);

  const isMine = Boolean(post.user?._id === myId);
  const images = post.images || post.media?.filter(m => m.type === 'image').map(m => m.url) || [];
  const videos = post.videos || post.media?.filter(m => m.type === 'video').map(m => m.url) || [];

  // 🔥 FIX: Safe Hashtag Parsing
  const renderContent = (text) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#') && part.length > 1) {
        const tag = part.slice(1);
        return (
          <Link 
            key={i} 
            // Encode hash to prevent URL breakage
            to={`/explore?q=${encodeURIComponent('#' + tag)}&t=hashtags`} 
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            onClick={(e) => e.stopPropagation()} 
          >
            {part}
          </Link>
        );
      }
      
      if (part.startsWith('@') && part.length > 1) {
        const handle = part.slice(1);
        return (
          <Link 
            key={i} 
            to={`/explore?q=${handle}&t=users`} 
            className="text-blue-500 hover:underline font-bold"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }

      return part;
    });
  };

  // 🔥 FIX: Robust Share Logic
  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    const shareData = {
      title: `Check out ${displayUser?.name}'s post`,
      text: post.content?.slice(0, 100) || 'Amazing content on SocialApp',
      url: url
    };

    // 1. Try Mobile Native Share
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) { /* User cancelled */ }
    }

    // 2. Try Clipboard (Works on HTTPS or Localhost)
    try {
      if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
          addToast("Link copied to clipboard", { type: "success" });
      } else {
          throw new Error("Clipboard blocked");
      }
    } catch (err) {
      // 3. Fallback: Prompt (Works everywhere)
      prompt("Copy this link:", url);
    }
    
    setShowMenu(false);
  };

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

  const handleLike = async () => {
    if (!post?._id || processingLike) return;
    setProcessingLike(true);

    const liked = Array.isArray(post.likes) && post.likes.includes(myId);
    
    // Optimistic Update
    setPost(prev => ({
      ...prev,
      likes: liked ? prev.likes.filter(id => id !== myId) : [...(prev.likes || []), myId]
    }));

    try {
      await API.put(`/posts/like/${post._id}`);
      // Socket event 'post:updated' will confirm this state shortly
    } catch (e) {
      setPost(initialPost); // Revert on failure
      addToast("Failed to update like", { type: "error" });
    } finally {
      setProcessingLike(false);
    }
  };

  const handleImageClick = () => {
    if (clickTimeout) {
        clearTimeout(clickTimeout);
        setClickTimeout(null);
        handleLike(); 
    } else {
        const timeout = setTimeout(() => {
            setLightboxOpen(true); 
            setClickTimeout(null);
        }, 250);
        setClickTimeout(timeout);
    }
  };

  // 🔥 FIX: Update Redux state immediately so it persists across navigation
  const toggleSave = async () => {
    const newVal = !isSaved;
    setIsSaved(newVal); // Instant UI Feedback
    addToast(newVal ? "Saved" : "Removed from saved", { type: "info" });

    try {
      await API.post(`/extra/save/${post._id}`);
      
      // Sync Redux Store
      let newSavedList = [...(currentUser.saved || [])];
      if (newVal) {
        newSavedList.push(post._id);
      } else {
        newSavedList = newSavedList.filter(id => id !== post._id);
      }
      
      dispatch(updateAuthUser({ saved: newSavedList }));

    } catch (e) {
      setIsSaved(!newVal); // Revert on error
      addToast("Failed to save", { type: "error" });
    }
  };

  const toggleCloseFriends = async () => {
    const next = !closeFriendsIncluded;
    setCloseFriendsIncluded(next);
    addToast(next ? "Added to Close Friends" : "Removed from Close Friends", { type: "info" });
    setShowMenu(false);
    try {
      await API.post(`/posts/${post._id}/close-friends`, { include: next });
    } catch (e) {
      setCloseFriendsIncluded(prev => !prev);
      addToast("Failed to update Close Friends", { type: "error" });
    }
  };

  const handleCopyLink = async () => {
    await handleShare(); // Reuse robust share logic
  };

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
          <Link to={`/profile/${displayUser?._id}`}>
            <UserAvatar src={displayUser?.avatar} name={displayUser?.name} userId={displayUser?._id} />
          </Link>
          <div>
            <Link to={`/profile/${displayUser?._id}`} className="font-bold text-sm hover:text-indigo-500">{displayUser?.name}</Link>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Link to={`/post/${post._id}`} className="hover:underline hover:text-gray-700 dark:hover:text-gray-300">
                    {timeAgo(post.createdAt)}
                </Link>
                {/* 🔥 FIX: Show Edited Status */}
                {post.createdAt !== post.updatedAt && (
                    <span className="text-gray-400 italic" title={new Date(post.updatedAt).toLocaleString()}>
                        (edited)
                    </span>
                )}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(s => !s)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FaEllipsisH />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} aria-hidden="true" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-700 z-20 overflow-hidden"
                >
                  <button 
                    onClick={() => { setShowForward(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 text-sm"
                  >
                    <FaPaperPlane /> Send to Chat
                  </button>

                  <button onClick={handleCopyLink} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 text-sm">
                    <FaLink /> Copy Link
                  </button>

                  <button onClick={toggleCloseFriends} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 text-sm">
                    <FaUserSecret /> {closeFriendsIncluded ? "Remove from Close Friends" : "Add to Close Friends"}
                  </button>

                  {isMine ? (
                    <>
                      <button 
                        onClick={() => { setShowEdit(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center gap-3 text-sm"
                      >
                        <FaPen /> Edit
                      </button>

                      <button onClick={() => { setShowDelete(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-3 text-sm">
                        <FaTrash /> Delete
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setShowReport(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-3 text-sm">
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
        {renderContent(post.content)}
        <LinkPreviewCard text={post.content} />
      </div>
      
      {/* Media */}
      {images.length > 0 && (
        <div className="mt-2 relative bg-gray-100 dark:bg-black rounded-lg overflow-hidden">
          <img
            src={images[0]}
            alt="Post content"
            className="max-h-[600px] w-auto mx-auto object-contain cursor-zoom-in min-w-[50%]"
            onClick={handleImageClick}
          />
          <div 
              className="absolute inset-0 -z-10 blur-2xl opacity-50 bg-center bg-cover"
              style={{ backgroundImage: `url(${images[0]})` }}
          />
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-2 relative group">
          <video 
            ref={videoRef}
            src={videos[0]} 
            muted={isMuted}
            loop
            playsInline
            controls
            className="w-full max-h-[600px] object-cover bg-black" 
          />
          <button 
            onClick={(e) => {
                e.preventDefault();
                toggleMute();
            }}
            className="absolute bottom-16 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-opacity z-10"
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
        </div>
      )}

      {/* Polls */}
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

      {/* Actions Bar */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex gap-6 text-xl items-center">
          
          {/* Like Button with Animation */}
          <motion.button 
            onClick={handleLike} 
            whileTap={{ scale: 0.8 }}
            className="transition focus:outline-none"
          >
            {post.likes?.includes(myId) ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 500 }}>
                    <FaHeart className="text-red-500" />
                </motion.div>
            ) : <FaRegHeart className="text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors" />}
          </motion.button>

          <button onClick={() => window.dispatchEvent(new CustomEvent("openComments", { detail: post._id }))}>
            <FaComment className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 transition-colors" />
          </button>

          <button onClick={handleShare}>
            <FaShare className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors" />
          </button>
        </div>

        <button onClick={toggleSave}>
          {isSaved ? <FaBookmark className="text-indigo-600" /> : <FaRegBookmark className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 transition-colors" />}
        </button>
      </div>

      {/* Likes Count Button */}
      {post.likes?.length > 0 && (
        <div className="px-4 pb-2">
            <button 
                onClick={() => setShowLikes(true)} 
                className="text-sm font-bold hover:underline cursor-pointer text-gray-800 dark:text-gray-200"
            >
                {post.likes.length} like{post.likes.length !== 1 ? 's' : ''}
            </button>
        </div>
      )}

      {/* Modals */}
      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} targetPostId={post._id} />
      <ConfirmModal isOpen={showDelete} onCancel={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Post?" />
      
      <EditPostModal 
        isOpen={showEdit} 
        onClose={() => setShowEdit(false)} 
        post={post} 
        onUpdated={(updatedPost) => setPost(updatedPost)} 
      />

      <Lightbox 
        open={lightboxOpen} 
        index={0} 
        images={images} 
        onClose={() => setLightboxOpen(false)} 
      />

      <ShareModal isOpen={showForward} onClose={() => setShowForward(false)} post={post} />
      
      <LikesModal isOpen={showLikes} onClose={() => setShowLikes(false)} postId={post._id} />
    </motion.article>
  );
};

// Optimized re-render logic using React.memo
export default React.memo(PostCard, (prev, next) => {
    return (
        prev.post._id === next.post._id &&
        prev.post.updatedAt === next.post.updatedAt &&
        prev.post.likes?.length === next.post.likes?.length &&
        prev.post.comments?.length === next.post.comments?.length
    );
});