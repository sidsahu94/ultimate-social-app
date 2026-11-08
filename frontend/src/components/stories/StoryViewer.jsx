// frontend/src/components/stories/StoryViewer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaPause, FaPlay, FaTrash, FaPaperPlane, FaEye } from 'react-icons/fa';
import { getImageUrl } from '../../utils/imageUtils';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { useSelector } from 'react-redux';
import { playSound } from '../../utils/soundEffects';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😂', '😍', '💎', '✨'];

export default function StoryViewer({ stories, initialIndex = 0, onClose, onDelete }) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [flyingReactions, setFlyingReactions] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const viewedStoriesRef = useRef(new Set());
  const videoRef = useRef(null);
  const { add } = useToast();
  const myId = useSelector((s) => s.auth.user?._id);

  const activeStory = stories[current];
  const IMAGE_DURATION = 5000; // 5 seconds per image

  const handleOpenViewers = async () => {
    setPaused(true);
    setShowViewers(true);
    setLoadingViewers(true);
    playSound('cyber');
    try {
      const res = await API.get(`/stories/${activeStory._id}/viewers`);
      setViewersList(res.data?.viewers || []);
    } catch (_) {
      setViewersList([]);
    } finally {
      setLoadingViewers(false);
    }
  };

  // Mark active story viewed in backend
  useEffect(() => {
    if (!activeStory?._id) return;
    if (viewedStoriesRef.current.has(activeStory._id)) return;

    viewedStoriesRef.current.add(activeStory._id);
    API.post(`/stories/${activeStory._id}/view`).catch(() => {});
  }, [activeStory]);

  // Reset progress when current story changes
  useEffect(() => {
    setProgress(0);
    setPaused(false);
  }, [current]);

  const next = useCallback(() => {
    if (current < stories.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      onClose();
    }
  }, [current, stories.length, onClose]);

  const prev = useCallback(() => {
    if (current > 0) {
      setCurrent((c) => c - 1);
    }
  }, [current]);

  // Image Timer Logic
  useEffect(() => {
    if (!activeStory || paused) return;

    const isVideo =
      activeStory.type === 'video' ||
      (activeStory.media && activeStory.media.match(/\.(mp4|webm)$/i));

    if (isVideo) {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    let animationFrame;
    let startTime;

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      if (paused) {
        startTime = timestamp - (progress / 100) * IMAGE_DURATION;
        return requestAnimationFrame(tick);
      }

      const elapsed = timestamp - startTime;
      const pct = Math.min((elapsed / IMAGE_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed < IMAGE_DURATION) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        next();
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [current, paused, activeStory, progress, next]);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setPaused(true);

    if (!window.confirm('Delete this story permanently?')) {
      setPaused(false);
      return;
    }

    try {
      await API.delete(`/stories/${activeStory._id}`);
      add('Story deleted', { type: 'success' });

      if (onDelete) {
        onDelete(activeStory._id);
      }

      if (stories.length <= 1) {
        onClose();
      } else if (current >= stories.length - 1) {
        setCurrent((c) => Math.max(0, c - 1));
      }
    } catch (_) {
      add('Failed to delete story', { type: 'error' });
      setPaused(false);
    }
  };

  const handleQuickReaction = async (emoji) => {
    playSound('pop');

    // Spawn floating emoji animation
    const id = Date.now() + Math.random();
    setFlyingReactions((prev) => [...prev, { id, emoji, left: 30 + Math.random() * 40 }]);
    setTimeout(() => {
      setFlyingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1500);

    try {
      await API.post(`/stories/${activeStory._id}/react`, { emoji });
    } catch (_) {}
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || sendingReply) return;

    setSendingReply(true);
    playSound('cyber');

    try {
      await API.post(`/stories/${activeStory._id}/reply`, { text: replyText.trim() });
      add(`Reply sent to ${activeStory.user?.name || 'creator'}!`, { type: 'success' });
      setReplyText('');
      setPaused(false);
    } catch (err) {
      add(err.response?.data?.message || 'Could not send reply', { type: 'error' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleVideoUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(pct);
    }
  };

  const handleVideoEnded = () => {
    next();
  };

  if (!activeStory) return null;

  const mediaUrl = getImageUrl(activeStory.media, 'story');
  const userAvatar = getImageUrl(activeStory.user?.avatar, 'avatar');
  const isVideo =
    activeStory.type === 'video' ||
    (activeStory.media && activeStory.media.match(/\.(mp4|webm)$/i));
  const isMine = String(activeStory.user?._id || activeStory.user || '') === String(myId || '');

  return (
    <div className="fixed inset-0 z-[100] bg-[#04070D]/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6 animate-fade-in">
      <div className="relative w-full h-full md:max-w-[420px] md:h-[90vh] md:rounded-[32px] overflow-hidden bg-[#070B14] border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col justify-between">
        
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5 pointer-events-none">
          {stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#00F2FE] transition-all ease-linear duration-75"
                style={{
                  width: idx < current ? '100%' : idx === current ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#1D4ED8] to-[#00F2FE]">
              <img
                src={userAvatar}
                className="w-9 h-9 rounded-full object-cover border border-[#04070D]"
                alt="user"
              />
            </div>
            <div>
              <div className="text-white font-bold text-xs drop-shadow-md flex items-center gap-1.5">
                {activeStory.user?.name || 'Creator'}
                {isMine && (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-[#052E24]/50 border border-[#052E24] text-[#F4D49A]">
                    You
                  </span>
                )}
              </div>
              <span className="text-white/60 text-[10px] drop-shadow font-mono">
                {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause / Resume Button */}
            <button
              onClick={() => {
                setPaused(!paused);
                if (videoRef.current) {
                  paused ? videoRef.current.play() : videoRef.current.pause();
                }
              }}
              className="text-white/80 hover:text-white p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition"
              title={paused ? 'Resume' : 'Pause'}
            >
              {paused ? <FaPlay size={12} /> : <FaPause size={12} />}
            </button>

            {/* Delete Button (Owner Only) */}
            {isMine && (
              <button
                onClick={handleDelete}
                className="text-white/80 hover:text-[#F87171] p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition hover:bg-[#052E24]/40"
                title="Delete Story"
              >
                <FaTrash size={12} />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition hover:bg-white/10"
              title="Close"
            >
              <FaTimes size={15} />
            </button>
          </div>
        </div>

        {/* Floating Flying Emoji Particle Layer */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {flyingReactions.map((r) => (
            <div
              key={r.id}
              className="absolute text-4xl animate-fly-up"
              style={{
                left: `${r.left}%`,
                bottom: '120px',
              }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Tap Navigation Zones (Left / Right / Center) */}
        <div
          className="absolute inset-y-0 left-0 w-1/4 z-20 cursor-pointer"
          onClick={prev}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/4 z-20 cursor-pointer"
          onClick={next}
        />
        <div
          className="absolute inset-y-0 left-1/4 w-1/2 z-10 flex items-center justify-center cursor-pointer"
          onClick={() => {
            setPaused(!paused);
            if (videoRef.current) {
              paused ? videoRef.current.play() : videoRef.current.pause();
            }
          }}
        >
          {paused && (
            <div className="p-4 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/90 animate-pulse">
              <FaPause size={28} />
            </div>
          )}
        </div>

        {/* Media Canvas */}
        <div className="w-full h-full flex items-center justify-center bg-black relative">
          {isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              autoPlay
              playsInline
              onTimeUpdate={handleVideoUpdate}
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={mediaUrl} className="w-full h-full object-cover" alt="story" />
          )}

          {/* Caption Overlay */}
          {activeStory.caption && (
            <div className="absolute bottom-28 left-4 right-4 z-30 pointer-events-none text-center">
              <span
                className="inline-block px-4 py-2 rounded-2xl text-white text-xs md:text-sm font-semibold backdrop-blur-xl border border-white/15 shadow-2xl"
                style={{
                  backgroundColor: activeStory.color ? activeStory.color + '90' : 'rgba(14,5,8,0.75)',
                }}
              >
                {activeStory.caption}
              </span>
            </div>
          )}
        </div>

        {/* Footer Interaction Bar (Reactions & DM Reply) */}
        <div className="relative z-30 p-3 pb-4 bg-gradient-to-t from-[#04070D] via-[#04070D]/85 to-transparent">
          {/* Quick Reaction Pills */}
          <div className="flex items-center justify-between mb-2 px-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickReaction(emoji);
                }}
                className="text-lg p-1.5 rounded-full hover:scale-125 transition-transform active:scale-95 hover:bg-white/10"
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Form (Viewer) or Analytics (Author) */}
          {isMine ? (
            <div className="flex items-center justify-between px-2 pt-1 pb-1">
              <button
                type="button"
                onClick={handleOpenViewers}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[#00F2FE] text-xs font-bold transition border border-white/10 shadow-md backdrop-blur-md active:scale-95"
              >
                <FaEye size={12} /> Viewers ({activeStory.viewersCount || activeStory.viewers?.length || 0})
              </button>
              <span className="text-[10px] text-white/60 font-mono tracking-wider uppercase">
                {activeStory.privacy === 'close_friends' ? '★ Close Friends' : 'Public Broadcast'}
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleSendReply}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setPaused(true)}
                onBlur={() => !replyText && setPaused(false)}
                placeholder={`Reply to ${activeStory.user?.name || 'story'}...`}
                className="flex-1 bg-black/60 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#00F2FE] backdrop-blur-md transition"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="p-2.5 rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white disabled:opacity-40 transition hover:scale-105 active:scale-95 shadow-md flex items-center justify-center"
              >
                <FaPaperPlane size={11} />
              </button>
            </form>
          )}
        </div>

        {/* Viewers Drawer for Story Author */}
        <AnimatePresence>
          {showViewers && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-x-0 bottom-0 max-h-[60%] bg-[#070B14]/95 border-t border-white/15 rounded-t-[32px] p-5 z-50 flex flex-col backdrop-blur-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <FaEye className="text-[#00F2FE]" size={14} />
                  <h3 className="font-bold text-xs text-[#F7F7FC] tracking-wide font-display">
                    Story Viewers ({viewersList.length})
                  </h3>
                </div>
                <button 
                  onClick={() => { setShowViewers(false); setPaused(false); }}
                  className="p-1 rounded-full text-[#A5A9BB] hover:text-white transition"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {loadingViewers && (
                  <div className="text-center py-6 text-xs text-[#A5A9BB] animate-pulse">Scanning viewers ledger...</div>
                )}
                {!loadingViewers && viewersList.length === 0 && (
                  <div className="text-center py-8 text-xs text-[#A5A9BB]">No viewers recorded yet.</div>
                )}
                {viewersList.map((viewer) => (
                  <div key={viewer._id} className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5">
                    <img 
                      src={getImageUrl(viewer.avatar, 'avatar')} 
                      className="w-8 h-8 rounded-full object-cover border border-white/10" 
                      alt="" 
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#F7F7FC]">{viewer.name}</span>
                      <span className="text-[10px] text-[#A5A9BB]">@{viewer.username || viewer.name?.toLowerCase().replace(/\s+/g, '')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
