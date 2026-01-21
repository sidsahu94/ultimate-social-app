// frontend/src/components/posts/PostCard.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import { 
  IoHeart, 
  IoHeartOutline, 
  IoChatbubbleOutline, 
  IoShareSocialOutline, 
  IoBookmarkOutline, 
  IoBookmark, 
  IoEllipsisHorizontal, 
  IoPlay, 
  IoVolumeMute, 
  IoVolumeHigh,
  IoEyeOutline
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";

import { useToast } from "../ui/ToastProvider";
import UserAvatar from "../ui/UserAvatar";
import Lightbox from "../ui/Lightbox";
import LinkPreviewCard from "../ui/LinkPreviewCard";
import PostActionSheet from "./PostActionSheet";
import { getImageUrl } from "../../utils/imageUtils";

export default function PostCard({ post }) {
  const { user } = useSelector((s) => s.auth);
  const { add: toast } = useToast();

  // Local State
  const [localPost, setLocalPost] = useState(post);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [isSaved, setIsSaved] = useState(false); // Ideally sync this with backend if available
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Video State
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const isMine = post.user?._id === user?._id;

  // Poll Calculation
  const totalVotes = localPost.poll?.options?.reduce(
    (sum, opt) => sum + (opt.votes?.length || 0), 
    0
  ) || 0;

  // Sync props to state
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  // View Counter Effect
  useEffect(() => {
    API.post(`/posts/${post._id}/view`).catch(() => {});
  }, [post._id]);

  // Auto-pause video when scrolling away
  useEffect(() => {
    if (!videoRef.current) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 } // Pause when 40% of video is out of view
    );
    obs.observe(videoRef.current);
    return () => obs.disconnect();
  }, []);

  // --- HANDLERS ---

  const handleLike = async () => {
    const prev = isLiked;
    setIsLiked(!prev);
    setLikeCount((c) => (prev ? c - 1 : c + 1));
    
    // Only show overlay if liking (not unliking) via double tap or button
    if (!prev) {
      // Optional: slight haptic feedback if available
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    }

    try {
      await API.put(`/posts/like/${post._id}`);
    } catch {
      // Revert on error
      setIsLiked(prev);
      setLikeCount((c) => (prev ? c + 1 : c - 1));
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeartOverlay(true);
  };

  const handleSave = async () => {
    const prev = isSaved;
    setIsSaved(!prev);

    try {
      await API.post(`/posts/${post._id}/bookmark`);
      toast(prev ? "Removed from saved" : "Saved", { type: "success" });
    } catch {
      setIsSaved(prev);
    }
  };

  const handleShare = async () => {
    const data = {
      title: `Post by ${post.user.name}`,
      text: post.content,
      url: `${window.location.origin}/post/${post._id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(data);
        toast("Shared successfully", { type: "success" });
      } catch {}
    } else {
      navigator.clipboard.writeText(data.url);
      toast("Link copied to clipboard", { type: "success" });
    }
  };

  const handleVote = async (index) => {
    try {
      const res = await API.post(`/polls/${post._id}/vote/${index}`);
      setLocalPost(res.data);
      toast("Vote recorded!", { type: "success" });
    } catch (err) {
      toast(err.response?.data?.message || "Failed to vote", { type: "error" });
    }
  };

  // Helper to render hashtags and mentions
  const renderContent = (txt) => {
    if (!txt) return null;
    return txt.split(/(\s+)/).map((p, i) => {
      if (p.startsWith("#")) {
        return (
          <Link 
            key={i} 
            to={`/tags/${p.slice(1)}`} 
            className="text-primary font-bold hover:underline decoration-primary/50"
          >
            {p}
          </Link>
        );
      }
      if (p.startsWith("@")) {
        return (
          <Link 
            key={i} 
            to={`/profile/${p.slice(1)}`} 
            className="text-secondary font-bold hover:underline decoration-secondary/50"
          >
            {p}
          </Link>
        );
      }
      return p;
    });
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="cyber-card cyber-card-hover mb-8 group/card"
      >
        {/* === HEADER === */}
        <div className="flex justify-between items-center p-4">
          <Link to={`/profile/${post.user._id}`} className="flex items-center gap-3 group/user">
            <div className="relative">
              {/* Glowing Avatar Ring on Hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-full blur-[2px] opacity-0 group-hover/user:opacity-100 transition-opacity duration-300"/>
              <UserAvatar 
                src={post.user.avatar} 
                name={post.user.name} 
                className="relative w-10 h-10 border-2 border-white/50 dark:border-white/10" 
              />
            </div>
            <div className="leading-tight">
              <p className="font-heading font-bold text-[15px] text-slate-900 dark:text-white group-hover/user:text-primary transition-colors">
                {post.user.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                {post.views > 0 && isMine && (
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                    <IoEyeOutline /> {post.views}
                  </span>
                )}
              </div>
            </div>
          </Link>

          <button 
            onClick={() => setShowActions(true)} 
            className="icon-btn hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <IoEllipsisHorizontal size={20} />
          </button>
        </div>

        {/* === CONTENT TEXT === */}
        {post.content && (
          <div className="px-4 pb-3 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {renderContent(post.content)}
          </div>
        )}
        
        <div className="px-4 pb-4">
          <LinkPreviewCard text={post.content} />
        </div>

        {/* === MEDIA SECTION (Edge-to-Edge) === */}
        {(post.images?.length > 0 || post.videos?.length > 0) && (
          <div 
            className="relative w-full bg-black cursor-pointer overflow-hidden group/media" 
            onDoubleClick={handleDoubleTap}
          >
             {/* Heart Explosion Overlay */}
            <AnimatePresence>
              {showHeartOverlay && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200 }}
                  onAnimationComplete={() => setShowHeartOverlay(false)}
                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                >
                  <IoHeart className="text-white drop-shadow-[0_0_35px_rgba(236,72,153,0.9)] text-9xl filter" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- IMAGE RENDER --- */}
            {post.images?.[0] && (
              <img
                src={getImageUrl(post.images[0], "feed")}
                alt="Post content"
                className="w-full object-cover max-h-[600px] min-h-[300px] transition-transform duration-700 group-hover/media:scale-[1.01]"
                onClick={() => setLightboxImg(post.images[0])}
              />
            )}

            {/* --- VIDEO RENDER --- */}
            {post.videos?.[0] && (
              <div className="relative w-full aspect-[4/5] bg-black">
                <video
                  ref={videoRef}
                  src={post.videos[0]}
                  className="w-full h-full object-cover"
                  loop 
                  muted={muted} 
                  playsInline
                  onClick={() => {
                     if(videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); } 
                     else { videoRef.current.pause(); setIsPlaying(false); }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Play Button Overlay (Only when paused) */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] pointer-events-none transition-opacity duration-300">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-glow-lg group-hover/media:scale-110 transition-transform">
                      <IoPlay className="text-white ml-1 text-3xl" />
                    </div>
                  </div>
                )}

                {/* Mute Toggle */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                  className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors z-20"
                >
                  {muted ? <IoVolumeMute size={20} /> : <IoVolumeHigh size={20} />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* === POLL SECTION === */}
        {localPost.poll && (
          <div className="px-4 pt-4 pb-2">
            <div className="p-5 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-white/40 dark:border-white/5">
              <p className="font-heading font-bold text-slate-800 dark:text-white mb-4">
                {localPost.poll.question}
              </p>

              <div className="space-y-3">
                {localPost.poll.options.map((opt, i) => {
                  const votes = opt.votes?.length || 0;
                  const percent = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                  const hasVoted = opt.votes?.includes(user?._id);
                  const isClosed = new Date(localPost.poll.expiresAt) < new Date();

                  return (
                    <button
                      key={i}
                      disabled={hasVoted || isClosed}
                      onClick={() => handleVote(i)}
                      className="relative w-full h-11 rounded-xl overflow-hidden group/poll focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      {/* Background Track */}
                      <div className="absolute inset-0 bg-slate-200 dark:bg-black/40" />
                      
                      {/* Progress Bar */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`absolute inset-y-0 left-0 ${
                          hasVoted 
                            ? "bg-gradient-to-r from-primary to-secondary shadow-glow-sm" 
                            : "bg-slate-300 dark:bg-slate-700 group-hover/poll:bg-slate-400 dark:group-hover/poll:bg-slate-600"
                        }`}
                      />

                      {/* Text Label */}
                      <div className="absolute inset-0 flex items-center justify-between px-4 z-10 text-xs font-bold text-slate-700 dark:text-slate-200 mix-blend-difference-none">
                          <span className="drop-shadow-md">{opt.text}</span>
                          <span className="opacity-80">{percent}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-right text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {totalVotes} votes • {new Date(localPost.poll.expiresAt) < new Date() ? "Ended" : "Live"}
              </div>
            </div>
          </div>
        )}

        {/* === ACTION FOOTER === */}
        <div className="px-2 py-2 flex items-center justify-between">
          <div className="flex items-center">
            {/* Like Button */}
            <button 
              onClick={handleLike} 
              className="group p-3 flex items-center gap-1.5 rounded-full transition-all active:scale-95 hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              <div className={`text-2xl transition-colors duration-300 ${isLiked ? "text-red-500 drop-shadow-sm" : "text-slate-500 dark:text-slate-400 group-hover:text-red-500"}`}>
                {isLiked ? <IoHeart /> : <IoHeartOutline />}
              </div>
              {likeCount > 0 && (
                <span className={`text-sm font-bold ${isLiked ? "text-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                  {likeCount}
                </span>
              )}
            </button>

            {/* Comment Button */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("openComments", { detail: post._id }))}
              className="group p-3 flex items-center gap-1.5 rounded-full transition-all active:scale-95 hover:bg-blue-50 dark:hover:bg-blue-900/10"
            >
              <IoChatbubbleOutline className="text-2xl text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
              {post.comments?.length > 0 && (
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white">
                  {post.comments.length}
                </span>
              )}
            </button>

            {/* Share Button */}
            <button 
              onClick={handleShare}
              className="p-3 rounded-full text-slate-500 dark:text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all active:scale-95"
            >
              <IoShareSocialOutline size={24} />
            </button>
          </div>

          {/* Bookmark Button */}
          <button 
            onClick={handleSave} 
            className="p-3 rounded-full transition-all active:scale-95 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
          >
            <div className={`text-2xl transition-colors ${isSaved ? "text-yellow-500" : "text-slate-500 dark:text-slate-400 hover:text-yellow-500"}`}>
              {isSaved ? <IoBookmark /> : <IoBookmarkOutline />}
            </div>
          </button>
        </div>
      </motion.div>

      {/* Lightbox for Fullscreen Images */}
      <Lightbox 
        open={!!lightboxImg} 
        images={post.images} 
        index={0} 
        onClose={() => setLightboxImg(null)} 
      />
      
      {/* Bottom Action Sheet (Edit/Delete/Report) */}
      <AnimatePresence>
        {showActions && (
          <PostActionSheet 
            post={post} 
            isMine={isMine} 
            onClose={() => setShowActions(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}