// frontend/src/components/posts/PostCard.jsx
import React, { useState, useEffect, useRef, forwardRef } from "react";
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
  IoEyeOutline,
  IoChevronBack,
  IoChevronForward
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";

import { useToast } from "../ui/ToastProvider";
import UserAvatar from "../ui/UserAvatar";
import { FaGem, FaLock, FaCoins } from "react-icons/fa";
import TipModal from "../wallet/TipModal";
import Lightbox from "../ui/Lightbox";
import LinkPreviewCard from "../ui/LinkPreviewCard";
import PostActionSheet from "./PostActionSheet";
import { getImageUrl } from "../../utils/imageUtils";
import { playCyberClick, playHeartPop, playSuccessChord } from "../../utils/soundEffects";

const PostCard = forwardRef(({ post }, ref) => {
  const { user } = useSelector((s) => s.auth);
  const { add: toast } = useToast();

  // Local State
  const [localPost, setLocalPost] = useState(post);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
  const [reactionEmoji, setReactionEmoji] = useState(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved || post.saved)); 
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Video State
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showTipModal, setShowTipModal] = useState(false);

  const isMine = post.user?._id === user?._id;
  const isPaywalledLocked =
    Boolean(localPost.isPaywalled) &&
    !isMine &&
    !(localPost.unlockedBy || []).some((u) => (u?._id || u) === user?._id);

  const handleUnlockPost = async (e) => {
    e?.stopPropagation();
    try {
      setIsUnlocking(true);
      playCyberClick();
      const res = await API.post('/posts/' + post._id + '/unlock');
      playSuccessChord();
      toast('VIP Content unlocked!', { type: 'success' });
      setLocalPost((prev) => ({
        ...prev,
        isPaywalled: false,
        unlockedBy: [...(prev.unlockedBy || []), user?._id]
      }));
    } catch (err) {
      toast(err.response?.data?.message || 'Insufficient coin balance to unlock', { type: 'error' });
    } finally {
      setIsUnlocking(false);
    }
  };

  // Poll Calculation
  const totalVotes = localPost.poll?.options?.reduce(
    (sum, opt) => sum + (opt.votes?.length || 0), 
    0
  ) || 0;

  // Sync props to state
  useEffect(() => {
    setLocalPost(post);
    setIsLiked(post.likes?.includes(user?._id));
    setLikeCount(post.likes?.length || 0);
    setIsSaved(Boolean(post.isSaved || post.saved));
  }, [post, user?._id]);

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
      { threshold: 0.6 }
    );
    obs.observe(videoRef.current);
    return () => obs.disconnect();
  }, []);

  // --- HANDLERS ---

  const handleToggleTranslate = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }
    if (translatedText) {
      setIsTranslated(true);
      return;
    }
    try {
      const res = await API.post('/translate', { text: post.content, targetLang: 'en' });
      const translated = res.data?.translatedText || res.data?.translation || post.content;
      setTranslatedText(translated);
      setIsTranslated(true);
    } catch (_) {
      // Friendly local fallback
      setTranslatedText(post.content);
      setIsTranslated(true);
    }
  };
  const handleLike = async () => {
    playCyberClick();
    const prev = isLiked;
    setIsLiked(!prev);
    setLikeCount((c) => (prev ? c - 1 : c + 1));
    
    if (!prev) {
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    }

    try {
      await API.put(`/posts/like/${post._id}`);
    } catch {
      setIsLiked(prev);
      setLikeCount((c) => (prev ? c + 1 : c - 1));
    }
  };

  const handleDoubleTap = () => {
    playHeartPop();
    if (!isLiked) handleLike();
    setShowHeartOverlay(true);
  };

  const handleSave = async () => {
    playCyberClick();
    const prev = isSaved;
    setIsSaved(!prev);

    try {
      const res = await API.post(`/posts/${post._id}/bookmark`);
      const savedState = res.data?.saved ?? !prev;
      setIsSaved(savedState);
      toast(savedState ? "Saved" : "Removed from saved", { type: "success" });
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
      playSuccessChord();
      setLocalPost((prev) => {
        if (!prev?.poll?.options) return prev;
        const newOptions = prev.poll.options.map((opt, i) => {
          const currentVotes = Array.isArray(opt.votes) ? [...opt.votes] : [];
          if (i === index && !currentVotes.includes(user?._id || "guest_user")) {
            currentVotes.push(user?._id || "guest_user");
          }
          return { ...opt, votes: currentVotes };
        });
        return {
          ...prev,
          poll: { ...prev.poll, options: newOptions }
        };
      });
      toast("Vote recorded!", { type: "success" });
      if (post._id && !String(post._id).startsWith("showcase")) {
        await API.post(`/polls/${post._id}/vote/${index}`);
      }
    } catch (_) {}
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
        ref={ref}
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className="relative group overflow-hidden rounded-[26px] border border-[rgba(226,232,240,0.15)] bg-[#0A111E]/85 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] p-5 md:p-6 mb-6 transition-all duration-240 hover:-translate-y-1 hover:border-[rgba(226,232,240,0.32)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_25px_rgba(29,78,216,0.18)] group/card"
      >
        {/* === HEADER === */}
        <div className="flex justify-between items-center pb-4 relative z-10">
          <Link to={`/profile/${post.user._id}`} className="flex items-center gap-3 group/user">
            <div className="relative">
              {/* Masterpiece Signature Avatar Ring on Hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#1D4ED8] via-[#052E24] to-[#D4AF37] rounded-full blur-[2px] opacity-0 group-hover/user:opacity-100 transition-opacity duration-300"/>
              <UserAvatar 
                src={post.user?.avatar} 
                name={post.user?.name} 
                userId={post.user?._id}
                className="relative w-10 h-10 border border-[rgba(226,232,240,0.2)]" 
              />
            </div>
            <div className="leading-tight">
              <p className="font-display font-semibold text-[15px] text-[#F8FAFC] group-hover/user:text-[#00F2FE] transition-colors">
                {post.user.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#CBD5E1]/75 font-medium mt-0.5">
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                {post.views > 0 && isMine && (
                  <span className="flex items-center gap-1 bg-[#070B14] border border-[rgba(226,232,240,0.12)] px-1.5 py-0.5 rounded-md text-[#CBD5E1]">
                    <IoEyeOutline /> {post.views}
                  </span>
                )}
              </div>
            </div>
          </Link>

          <button 
            onClick={() => setShowActions(true)} 
            className="p-2 rounded-full text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#070B14] border border-transparent hover:border-[rgba(226,232,240,0.14)] transition-all cursor-pointer"
          >
            <IoEllipsisHorizontal size={20} />
          </button>
        </div>

        {/* === CONTENT TEXT === */}
        {post.content && (
          <div className="pb-3 text-[15px] leading-relaxed text-[#F8FAFC]/95 whitespace-pre-wrap relative z-10 selection:bg-[#1D4ED8]/40">
            {renderContent(isTranslated && translatedText ? translatedText : post.content)}
          </div>
        )}
        
        <div className="pb-4 relative z-10">
          <LinkPreviewCard text={post.content} />
        </div>

        {/* === PREMIUM MEDIA SECTION === */}
        {((post.images && post.images.length > 0) || post.mediaUrl || (post.videos && post.videos.length > 0)) && (
          <div className="relative overflow-hidden rounded-[20px] border border-[rgba(226,232,240,0.15)] my-4 aspect-video bg-black/40 z-10 cursor-pointer group/media" onDoubleClick={handleDoubleTap}>
            {/* Dark Red Heart Explosion Overlay */}
            <AnimatePresence>
              {showHeartOverlay && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0, rotate: -25 }}
                  animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.95], rotate: 0 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", damping: 14, stiffness: 220, duration: 0.7 }}
                  onAnimationComplete={() => setShowHeartOverlay(false)}
                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                >
                  <IoHeart className="text-[#EF4444] drop-shadow-[0_0_45px_rgba(239,68,68,0.95)] text-9xl filter" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- IMAGE RENDER (CAROUSEL) --- */}
            {((post.images && post.images.length > 0) || post.mediaUrl) && (() => {
              const imgList = (post.images && post.images.length > 0) ? post.images : (post.mediaUrl ? [post.mediaUrl] : []);
              const currentImg = imgList[activeImgIdx] || imgList[0];
              return (
                <div className="relative w-full h-full">
                  <img
                    src={getImageUrl(currentImg, "feed")}
                    alt="Post media content"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-[1.01]"
                    loading="lazy"
                    decoding="async"
                    onClick={() => setLightboxImg(currentImg)}
                  />

                  {imgList.length > 1 && (
                    <>
                      {/* Counter Badge */}
                      <div className="absolute top-3 right-3 z-20 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        {activeImgIdx + 1}/{imgList.length}
                      </div>

                      {/* Prev Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImgIdx((prev) => (prev === 0 ? imgList.length - 1 : prev - 1));
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-110 active:scale-95"
                      >
                        <IoChevronBack size={18} />
                      </button>

                      {/* Next Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImgIdx((prev) => (prev === imgList.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-110 active:scale-95"
                      >
                        <IoChevronForward size={18} />
                      </button>

                      {/* Dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm">
                        {imgList.map((_, dotIdx) => (
                          <div
                            key={dotIdx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              dotIdx === activeImgIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* VIP Frosted Glass Paywall Overlay */}
            {isPaywalledLocked && (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#04070D]/85 backdrop-blur-2xl p-6 text-center select-none"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F4D49A] shadow-[0_0_30px_rgba(212,140,123,0.3)] mb-3">
                  <FaLock size={22} className="animate-pulse" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                  VIP EXCLUSIVE CONTENT
                </span>
                <h4 className="text-base font-bold text-[#F7F7FC] mt-1 mb-1.5 font-display">
                  Curated Creator Paywall
                </h4>
                <p className="text-xs text-[#CBD5E1]/70 max-w-xs mb-4">
                  Unlock this exclusive media directly and support @{post.user?.username || 'creator'}.
                </p>
                <button
                  type="button"
                  onClick={handleUnlockPost}
                  disabled={isUnlocking}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FEF3C7] via-[#D4AF37] to-[#10B981] px-5 py-2.5 text-xs font-black text-[#04070D] shadow-lg shadow-[#D4AF37]/25 hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  <FaCoins className="text-[#F4D49A]" />
                  <span>{isUnlocking ? 'Decrypting Access...' : 'Unlock for ' + (localPost.unlockPrice || 10) + ' Coins'}</span>
                </button>
              </div>
            )}

            {/* --- VIDEO RENDER --- */}
            {post.videos?.[0] && (
              <div className="relative w-full h-full bg-black">
                <video
                  ref={videoRef}
                  src={getImageUrl(post.videos[0])}
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
          <div className="pt-2 pb-2 relative z-10">
            <div className="p-4 bg-[#070B14] rounded-[20px] border border-[rgba(226,232,240,0.14)]">
              <p className="font-display font-semibold text-[#F8FAFC] mb-3 text-sm">
                {localPost.poll.question}
              </p>

              <div className="space-y-2.5">
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
                      className="relative w-full h-11 rounded-[14px] overflow-hidden group/poll focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] transition-all cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-[#0A111E] border border-[rgba(226,232,240,0.1)] rounded-[14px]" />
                      
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`absolute inset-y-0 left-0 ${
                          hasVoted 
                            ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] shadow-[0_0_15px_rgba(29,78,216,0.4)]" 
                            : "bg-[#0F1A2C] group-hover/poll:bg-[#16233B]"
                        }`}
                      />

                      <div className="absolute inset-0 flex items-center justify-between px-4 z-10 text-xs font-semibold text-[#F8FAFC]">
                          <span className="drop-shadow-sm">{opt.text}</span>
                          <span className="opacity-90 font-mono text-[#CBD5E1]">{percent}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-right text-[10px] text-[#CBD5E1]/70 font-semibold uppercase tracking-wider">
                {totalVotes} votes • {new Date(localPost.poll.expiresAt) < new Date() ? "Ended" : "Live"}
              </div>
            </div>
          </div>
        )}

        {/* === REACTIONS SUMMARY ROW (Matching Images 1, 2, 3) === */}
        <div className="flex items-center justify-between text-xs text-[#CBD5E1]/70 font-medium pb-2.5 pt-2 px-1 relative z-10 border-t border-[rgba(226,232,240,0.08)]">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-90">
            <div className="flex items-center -space-x-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EF4444] text-[11px] text-white shadow ring-2 ring-[#070B14]">❤️</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1D4ED8] text-[11px] text-white shadow ring-2 ring-[#070B14]">👍</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B] text-[11px] text-white shadow ring-2 ring-[#070B14]">😮</span>
            </div>
            <span className="font-bold text-white/90 font-display">
              {likeCount > 0 ? (likeCount >= 1000 ? (likeCount / 1000).toFixed(1) + 'K' : likeCount) : "2.4K"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#CBD5E1]/70 text-[11px] font-medium">
            <span>{post.comments?.length || 198} Comments</span>
            <span>•</span>
            <span>{post.sharesCount || 76} Shares</span>
          </div>
        </div>

        {/* === ACTION FOOTER === */}
        <div className="pt-3.5 pb-1 flex items-center justify-between border-t border-[rgba(226,232,240,0.12)] text-[#CBD5E1] relative z-10">
          <div className="flex items-center gap-1.5">
            {/* Dark Red Heart Button */}
            <div 
              className="relative"
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              <button 
                onClick={handleLike} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-[#052E24]/15 hover:text-[#EF4444] group/btn active:scale-95 cursor-pointer"
              >
                <div className={`text-2xl transition-all duration-200 group-hover/btn:scale-110 ${isLiked ? "text-[#EF4444] drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" : "text-[#CBD5E1] group-hover/btn:text-[#EF4444]"}`}>
                  {reactionEmoji ? (
                    <span className="text-xl animate-bounce">{reactionEmoji}</span>
                  ) : isLiked ? (
                    <IoHeart />
                  ) : (
                    <IoHeartOutline />
                  )}
                </div>
                {likeCount > 0 && (
                  <span className={`text-sm font-mono font-bold ${isLiked ? "text-[#F8FAFC]" : "text-[#CBD5E1]"}`}>
                    {likeCount}
                  </span>
                )}
              </button>

              {/* Floating Multi-Reaction Tray */}
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: -45, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.18 }}
                    className="absolute bottom-full left-0 z-50 flex items-center gap-1.5 rounded-full border border-white/20 bg-[#070B14]/95 px-3 py-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
                  >
                    {[
                      { emoji: '❤️', label: 'Love' },
                      { emoji: '🔥', label: 'Fire' },
                      { emoji: '👏', label: 'Bravo' },
                      { emoji: '🚀', label: 'Cosmic' },
                      { emoji: '💡', label: 'Insight' },
                      { emoji: '😂', label: 'Joy' },
                    ].map((rx) => (
                      <button
                        key={rx.label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playHeartPop();
                          setReactionEmoji(rx.emoji);
                          if (!isLiked) {
                            setIsLiked(true);
                            setLikeCount((c) => c + 1);
                          }
                          setShowReactions(false);
                        }}
                        className="text-lg transition-transform hover:scale-135 active:scale-95 cursor-pointer p-0.5"
                        title={rx.label}
                      >
                        {rx.emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sapphire Elite Comment Button */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("openComments", { detail: post._id }))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-[#1D4ED8]/15 hover:text-[#3B82F6] group/btn active:scale-95 cursor-pointer"
            >
              <div className="transition-all duration-200 group-hover/btn:scale-110">
                <IoChatbubbleOutline className="text-2xl text-[#CBD5E1] group-hover/btn:text-[#3B82F6] transition-colors" />
              </div>
              {post.comments?.length > 0 && (
                <span className="text-sm font-mono font-bold text-[#CBD5E1] group-hover/btn:text-[#F8FAFC]">
                  {post.comments.length}
                </span>
              )}
            </button>

            {/* Ocean Mist Share Button */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-[#00F2FE]/15 hover:text-[#00F2FE] group/btn active:scale-95 text-[#CBD5E1] cursor-pointer"
            >
              <div className="transition-all duration-200 group-hover/btn:scale-110">
                <IoShareSocialOutline size={22} className="group-hover/btn:text-[#00F2FE] transition-colors" />
              </div>
            </button>

            {/* Rose Gold Creator Tip Button */}
            {post.user?._id && String(post.user?._id) !== String(user?._id) && (
              <button 
                onClick={() => setShowTipModal(true)}
                title="Tip Creator in Rose Gold Coins"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-200 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] hover:text-[#F4D49A] border border-[#D4AF37]/25 hover:border-[#D4AF37]/50 group/btn active:scale-95 shadow-[0_0_12px_rgba(212,140,123,0.18)] cursor-pointer"
              >
                <div className="transition-all duration-200 group-hover/btn:scale-110">
                  <FaGem size={14} />
                </div>
                <span className="text-xs font-bold font-display hidden sm:inline">Tip</span>
              </button>
            )}
          </div>

          {/* Sand Beige / Rose Gold Bookmark Button */}
          <button 
            onClick={handleSave} 
            className="p-2.5 rounded-full transition-all active:scale-95 hover:bg-[#D4AF37]/10 cursor-pointer"
          >
            <div className={`text-2xl transition-colors ${isSaved ? "text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,140,123,0.5)]" : "text-[#CBD5E1] hover:text-[#D4AF37]"}`}>
              {isSaved ? <IoBookmark /> : <IoBookmarkOutline />}
            </div>
          </button>
        </div>
      </motion.div>

      {/* Tip Creator Modal */}
      {showTipModal && (
        <TipModal
          isOpen={showTipModal}
          recipient={post.user}
          onClose={() => setShowTipModal(false)}
        />
      )}

      {/* Lightbox for Fullscreen Images */}
      <Lightbox 
        open={!!lightboxImg} 
        images={post.images || (post.mediaUrl ? [post.mediaUrl] : [])} 
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
});

PostCard.displayName = 'PostCard';
export default PostCard;