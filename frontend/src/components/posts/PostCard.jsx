
// frontend/src/components/posts/PostCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { 
  FaHeart, FaRegHeart, FaComment, FaShare, FaBookmark, FaRegBookmark, 
  FaEllipsisH, FaEye, FaPlay, FaVolumeMute, FaVolumeUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import UserAvatar from '../ui/UserAvatar';
import Lightbox from '../ui/Lightbox';
import LinkPreviewCard from '../ui/LinkPreviewCard';
import PostActionSheet from './PostActionSheet';
import { getImageUrl } from '../../utils/imageUtils';

export default function PostCard({ post }) {
  const { user } = useSelector((state) => state.auth);
  const { add } = useToast();
  const videoRef = useRef(null);

  // --- LOGIC STATE ---
  const [localPost, setLocalPost] = useState(post);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [isSaved, setIsSaved] = useState(user?.saved?.includes(post._id));
  
  // --- UI STATE ---
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const isMine = user?._id === post.user?._id;
  const hasMedia = post.images?.length > 0 || post.videos?.length > 0;

  // Sync props
  useEffect(() => { setLocalPost(post); }, [post]);

  // View Counter
  useEffect(() => {
      if (post._id) API.post(`/posts/${post._id}/view`).catch(() => {});
  }, [post._id]);

  // Auto-pause video on scroll
  useEffect(() => {
    if (!videoRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [hasMedia]);

  // --- HANDLERS ---
  const handleLike = async () => {
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setLikeCount(prev => prevLiked ? prev - 1 : prev + 1);
    if (!prevLiked) setShowHeartOverlay(true);

    try {
      await API.put(`/posts/like/${post._id}`);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikeCount(prev => prevLiked ? prev + 1 : prev - 1);
    }
  };

  const handleDoubleTap = (e) => {
    if (e.detail === 2 && !isLiked) handleLike();
  };

  const handleSave = async () => {
      const prev = isSaved;
      setIsSaved(!prev);
      try {
          await API.post(`/posts/${post._id}/bookmark`);
          add(!prev ? "Saved" : "Unsaved", { type: 'success' });
      } catch (e) { setIsSaved(prev); }
  };

  const handleShare = async () => {
      const shareData = {
          title: `Post by ${post.user.name}`,
          text: post.content,
          url: `${window.location.origin}/post/${post._id}`
      };

      // 🔥 Use Native Web Share API if available (Mobile)
      if (navigator.share) {
          try {
              await navigator.share(shareData);
              add("Shared successfully!", { type: 'success' });
          } catch (err) {
              console.log("Share cancelled");
          }
      } else {
          // Fallback for Desktop
          navigator.clipboard.writeText(shareData.url);
          add("Link copied to clipboard", { type: 'success' });
      }
  };

  const handleVote = async (index) => {
      try {
          const res = await API.post(`/polls/${post._id}/vote/${index}`);
          setLocalPost(res.data);
          add("Vote recorded", { type: 'success' });
      } catch (e) { add("Failed to vote", { type: 'error' }); }
  };

  // Content Parser (Hashtags/Mentions)
  const renderContent = (text) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
      // 🔥 FIX: Link to dedicated Tag Feed
      if (part.startsWith('#')) {
          return <Link key={i} to={`/tags/${part.slice(1)}`} className="text-indigo-500 hover:underline font-bold">{part}</Link>;
      }
      if (part.startsWith('@')) {
          return <Link key={i} to={`/profile/${part.slice(1)}`} className="text-blue-500 hover:underline">{part}</Link>; 
          // Note: Ideally this needs username lookup, but this is a decent fallback if you don't have usernames yet
      }
      return part;
    });
  };

  const totalVotes = localPost.poll?.options?.reduce((a, b) => a + (b.votes?.length || 0), 0) || 0;

  return (
    <>
      {/* 🎨 NEU-CARD CONTAINER 
        Uses the custom CSS class from index.css for the Neumorphic Look
      */}
      <div className="neu-card mb-8 relative group overflow-visible transition-all duration-300 hover:z-10">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-4">
            
            {/* 🎨 Neon Avatar Ring */}
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-primary via-primary-glow to-secondary shadow-neon-blue">
              <div className="rounded-full border-2 border-[#E0E5EC] dark:border-[#1A1B1E] bg-[#E0E5EC] dark:bg-[#1A1B1E]">
                <UserAvatar src={post.user.avatar} name={post.user.name} userId={post.user._id} className="w-10 h-10" />
              </div>
            </div>

            <div>
              <Link to={`/profile/${post.user._id}`} className="font-bold text-base text-slate-800 dark:text-slate-100 hover:text-primary transition flex items-center gap-1">
                {post.user.name} 
                {post.user.isVerified && <span className="text-primary-glow drop-shadow-[0_0_5px_rgba(0,229,255,0.6)]">✓</span>}
              </Link>
              <div className="text-xs font-medium text-slate-400 dark:text-slate-500 tracking-wide">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                {post.editedAt && <span className="ml-1 italic opacity-60">(edited)</span>}
              </div>
            </div>
          </div>

          <button onClick={() => setShowActions(true)} className="p-3 rounded-full text-slate-400 hover:text-primary hover:bg-[#E0E5EC] dark:hover:bg-[#141517] hover:shadow-neu-flat dark:hover:shadow-neu-dark-flat transition">
            <FaEllipsisH />
          </button>
        </div>

        {/* --- TEXT CONTENT --- */}
        <div className="mb-5 px-1">
            <div className="whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300 font-medium">
                {renderContent(post.content)}
            </div>
            <div className="mt-2">
              <LinkPreviewCard text={post.content} />
            </div>
        </div>

        {/* --- MEDIA (Glassmorphic Container) --- */}
        {hasMedia && (
          <div className="relative rounded-[24px] overflow-hidden shadow-lg border border-white/20 dark:border-white/5 bg-black/5 dark:bg-black/40 mb-6 group cursor-pointer" onClick={handleDoubleTap}>
            
            {/* Heart Animation Overlay */}
            <AnimatePresence>
              {showHeartOverlay && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <FaHeart className="text-primary-glow drop-shadow-[0_0_20px_rgba(0,229,255,0.8)]" size={90} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image */}
            {post.images?.[0] && (
                <img 
                    src={getImageUrl(post.images[0], 'feed')} 
                    className="w-full max-h-[600px] object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
                    onClick={() => setLightboxSrc(post.images[0])} 
                    alt="post content"
                />
            )}
            
            {/* Video */}
            {post.videos?.[0] && (
                <div className="relative w-full">
                    <video 
                        ref={videoRef} 
                        src={post.videos[0]} 
                        className="w-full max-h-[600px] object-contain bg-black" 
                        loop 
                        muted={isMuted} 
                        playsInline 
                        onPlay={() => setIsPlaying(true)} 
                        onPause={() => setIsPlaying(false)} 
                    />
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] pointer-events-none">
                            <div className="p-4 rounded-full bg-white/10 border border-white/30 backdrop-blur-md shadow-neon-blue">
                                <FaPlay className="text-white text-3xl ml-1" />
                            </div>
                        </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute bottom-4 right-4 p-2 bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition">
                        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                </div>
            )}
          </div>
        )}

        {/* --- POLLS (Neumorphic Inset) --- */}
        {localPost.poll && localPost.poll.options?.length > 0 && (
            <div className="mb-6 p-5 rounded-[24px] bg-[#E0E5EC] dark:bg-[#141517] shadow-neu-pressed dark:shadow-neu-dark-pressed">
                <h4 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-2">
                   <span className="text-primary">📊</span> {localPost.poll.question}
                </h4>
                <div className="space-y-3">
                    {localPost.poll.options.map((opt, i) => {
                        const votes = opt.votes?.length || 0;
                        const percent = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                        const hasVoted = opt.votes?.includes(user?._id);
                        return (
                            <button key={i} onClick={() => handleVote(i)} disabled={hasVoted} className="relative w-full text-left h-10 rounded-full text-xs font-bold transition overflow-hidden bg-gray-200 dark:bg-gray-800">
                                {/* Progress Bar */}
                                <div className={`absolute top-0 left-0 bottom-0 transition-all duration-700 ease-out ${hasVoted ? 'bg-gradient-to-r from-primary to-secondary shadow-neon-blue' : 'bg-gray-300 dark:bg-gray-700'}`} style={{ width: `${percent}%` }} />
                                {/* Label */}
                                <div className={`relative flex justify-between items-center h-full px-4 z-10 ${hasVoted ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                    <span>{opt.text}</span>
                                    <span>{percent}%</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    {totalVotes} Votes • {new Date(post.poll.expiresAt) < new Date() ? 'Closed' : 'Active'}
                </div>
            </div>
        )}

        {/* --- FLOATING ACTION PILL (The major UI shift) --- */}
        <div className="bg-[#E0E5EC] dark:bg-[#141517] rounded-full p-2 flex justify-between items-center shadow-neu-pressed dark:shadow-neu-dark-pressed relative z-20">
            
            {/* Like */}
            <button 
                onClick={handleLike} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all duration-300 ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/10 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800'}`}
            >
                {isLiked ? <FaHeart className="drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> : <FaRegHeart />}
                <span className="text-xs font-bold">{likeCount > 0 ? likeCount : ''}</span>
            </button>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-700" />

            {/* Comment */}
            <button 
                onClick={() => window.dispatchEvent(new CustomEvent('openComments', { detail: post._id }))} 
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
            >
                <FaComment />
                <span className="text-xs font-bold">{post.comments?.length > 0 ? post.comments.length : ''}</span>
            </button>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-700" />

            {/* Share */}
            <button 
                onClick={handleShare} 
                className="flex-1 flex items-center justify-center py-3 rounded-full text-slate-500 hover:text-green-500 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
            >
                <FaShare />
            </button>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-700" />

            {/* Save */}
            <button 
                onClick={handleSave} 
                className={`flex-1 flex items-center justify-center py-3 rounded-full transition-all duration-300 ${isSaved ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : 'text-slate-500 hover:text-yellow-500'}`}
            >
                {isSaved ? <FaBookmark className="drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" /> : <FaRegBookmark />}
            </button>
        </div>

        {/* View Count Badge (Absolute Positioned) */}
        {isMine && post.views > 0 && (
            <div className="absolute top-[-10px] right-[-5px] bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-neon-blue flex items-center gap-1 z-30">
                <FaEye /> {post.views}
            </div>
        )}

      </div>

      {/* --- OVERLAYS --- */}
      <Lightbox open={!!lightboxSrc} images={post.images} index={0} onClose={() => setLightboxSrc(null)} />
      <AnimatePresence>
        {showActions && <PostActionSheet post={post} isMine={isMine} onClose={() => setShowActions(false)} />}
      </AnimatePresence>
    </>
  );
}