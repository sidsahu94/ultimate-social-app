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
import LinkPreviewCard from '../ui/LinkPreviewCard'; // 🔥 Restored Feature
import PostActionSheet from './PostActionSheet';    // 🔥 Handles the complex menu logic

export default function PostCard({ post }) {
  const { user } = useSelector((state) => state.auth);
  const { add } = useToast();
  const videoRef = useRef(null);

  // --- STATE ---
  const [localPost, setLocalPost] = useState(post);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [isSaved, setIsSaved] = useState(user?.saved?.includes(post._id));
  
  // UI State
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const isMine = user?._id === post.user?._id;
  const hasMedia = post.images?.length > 0 || post.videos?.length > 0;

  // --- EFFECTS ---

  // 1. Sync Props
  useEffect(() => { setLocalPost(post); }, [post]);

  // 2. Creator Insights: Track View
  useEffect(() => {
      if (post._id) API.post(`/posts/${post._id}/view`).catch(() => {});
  }, [post._id]);

  // 3. Auto-Pause Video on Scroll (Advanced Feature)
  useEffect(() => {
    if (!videoRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 } // Pause if 50% not visible
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
      // Rollback
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
      const url = `${window.location.origin}/post/${post._id}`;
      if (navigator.share) try { await navigator.share({ title: 'Check this', url }); } catch(e){}
      else { navigator.clipboard.writeText(url); add("Link copied", { type: 'success' }); }
  };

  const handleVote = async (index) => {
      try {
          const res = await API.post(`/polls/${post._id}/vote/${index}`);
          setLocalPost(res.data);
          add("Vote recorded", { type: 'success' });
      } catch (e) { add("Failed to vote", { type: 'error' }); }
  };

  // Safe Content Rendering (Hashtags/Mentions)
  const renderContent = (text) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#')) return <Link key={i} to={`/explore?q=${encodeURIComponent(part.slice(1))}`} className="text-indigo-500 hover:underline">{part}</Link>;
      if (part.startsWith('@')) return <Link key={i} to={`/explore?q=${encodeURIComponent(part.slice(1))}`} className="text-blue-500 hover:underline">{part}</Link>;
      return part;
    });
  };

  const totalVotes = localPost.poll?.options?.reduce((a, b) => a + (b.votes?.length || 0), 0) || 0;

  // --- RENDER ---
  return (
    <>
      <div className="card bg-white dark:bg-gray-900 mb-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all hover:shadow-md">
        
        {/* HEADER */}
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UserAvatar src={post.user.avatar} name={post.user.name} userId={post.user._id} />
            <div>
              <Link to={`/profile/${post.user._id}`} className="font-bold text-sm hover:underline flex items-center gap-1 dark:text-gray-200">
                {post.user.name} {post.user.isVerified && <span className="text-blue-500 text-[10px]">✓</span>}
              </Link>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                {post.editedAt && <span className="ml-1 italic opacity-70">(edited)</span>}
              </div>
            </div>
          </div>
          <button onClick={() => setShowActions(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <FaEllipsisH />
          </button>
        </div>

        {/* CONTENT & PREVIEW */}
        <div className="px-4 pb-3">
            <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 mb-2">
                {renderContent(post.content)}
            </div>
            {/* 🔥 Restored Link Preview Feature */}
            <LinkPreviewCard text={post.content} />
        </div>

        {/* MEDIA */}
        {hasMedia && (
          <div className="relative bg-black/5 dark:bg-black/50 cursor-pointer group" onClick={handleDoubleTap}>
            {/* Heart Animation */}
            <AnimatePresence>
              {showHeartOverlay && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <FaHeart className="text-white drop-shadow-lg" size={80} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image */}
            {post.images?.[0] && (
                <img 
                    src={post.images[0]} 
                    className="w-full max-h-[600px] object-cover" 
                    onClick={() => setLightboxSrc(post.images[0])} 
                    alt="content"
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
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <FaPlay className="text-white text-4xl opacity-80" />
                        </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white z-10">
                        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                </div>
            )}
          </div>
        )}

        {/* POLLS */}
        {localPost.poll && localPost.poll.options?.length > 0 && (
            <div className="px-4 py-2">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                    <h4 className="font-bold text-sm mb-3 dark:text-white">{localPost.poll.question}</h4>
                    <div className="space-y-2">
                        {localPost.poll.options.map((opt, i) => {
                            const votes = opt.votes?.length || 0;
                            const percent = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                            const hasVoted = opt.votes?.includes(user?._id);
                            return (
                                <button key={i} onClick={() => handleVote(i)} disabled={hasVoted} className={`relative w-full text-left p-3 rounded-lg text-sm font-medium transition overflow-hidden border ${hasVoted ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <div className="absolute top-0 left-0 bottom-0 bg-indigo-100 dark:bg-indigo-900/40 transition-all duration-500" style={{ width: `${percent}%` }} />
                                    <div className="relative flex justify-between z-10 dark:text-gray-200"><span>{opt.text}</span><span>{percent}%</span></div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-right">{totalVotes} votes • {new Date(post.poll.expiresAt) < new Date() ? 'Ended' : 'Active'}</div>
                </div>
            </div>
        )}

        {/* STATS BAR */}
        <div className="px-4 py-2 flex justify-between items-center text-sm text-gray-500 border-b dark:border-gray-800/50">
            <span className="font-semibold">{likeCount > 0 ? `${likeCount} likes` : (isMine ? 'No likes yet' : '')}</span>
            {isMine && <span className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full"><FaEye /> {post.views || 0}</span>}
        </div>

        {/* ACTIONS BAR */}
        <div className="px-2 py-1 flex justify-between items-center">
          <div className="flex items-center">
            <button onClick={handleLike} className="p-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                {isLiked ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-xl dark:text-gray-300" />}
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('openComments', { detail: post._id }))} className="p-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <FaComment className="text-xl dark:text-gray-300" />
            </button>
            <button onClick={handleShare} className="p-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition md:hidden">
                <FaShare className="text-xl dark:text-gray-300" />
            </button>
          </div>
          <div className="flex items-center">
             <button onClick={handleShare} className="hidden md:block p-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <FaShare className="text-xl dark:text-gray-300" />
             </button>
            <button onClick={handleSave} className="p-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                {isSaved ? <FaBookmark className="text-xl text-yellow-500" /> : <FaRegBookmark className="text-xl dark:text-gray-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for full-screen images */}
      <Lightbox open={!!lightboxSrc} images={post.images} index={0} onClose={() => setLightboxSrc(null)} />
      
      {/* Action Sheet (Edit/Delete/Report) - Logic Moved Here for Cleanliness */}
      <AnimatePresence>
        {showActions && <PostActionSheet post={post} isMine={isMine} onClose={() => setShowActions(false)} />}
      </AnimatePresence>
    </>
  );
}