// frontend/src/pages/reels/ReelsPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import API from '../../services/api';
import {
  FaHeart, FaRegHeart, FaComment, FaShare,
  FaVolumeMute, FaVolumeUp,
  FaEllipsisV, FaTrash, FaExclamationTriangle, FaVideo, FaMusic, FaPlay, FaPause, FaCoins
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../../components/ui/UserAvatar';
import { useToast } from '../../components/ui/ToastProvider';
import ReportModal from '../../components/ui/ReportModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useSelector, useDispatch } from 'react-redux';
import { updateAuthUser } from '../../redux/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import ReelUploadModal from '../../components/reels/ReelUploadModal';
import { getImageUrl } from '../../utils/imageUtils';
import { playSound } from '../../utils/soundEffects';

// Ultra-fast CDN Demo Reels with matching instant poster frames
const DEMO_REELS = [
  { 
    _id: 'demo1', 
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/dog.mp4',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/dog.jpg',
    caption: 'Kinetic energy in full bloom! 🐕✨ #Joy #Momentum #SocialoCinema', 
    user: { name: 'Elena Vance', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }, 
    likes: ['user1', 'user2', 'user3'], 
    comments: [1, 2] 
  },
  { 
    _id: 'demo2', 
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/sea_turtle.mp4',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/sea_turtle.jpg',
    caption: 'Azure currents & deep tranquility 🌊🐢 #OceanDrift #NatureArt', 
    user: { name: 'Kai Sterling', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' }, 
    likes: ['user1'], 
    comments: [] 
  },
  { 
    _id: 'demo3', 
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/elephants.mp4',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/elephants.jpg',
    caption: 'Serengeti sovereigns under dusk 🐘🌅 #Wildlife #MajesticEarth', 
    user: { name: 'Aria Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' }, 
    likes: ['user1', 'user2'], 
    comments: [1] 
  },
  { 
    _id: 'demo4', 
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/samples/cld-sample-video.mp4',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/samples/cld-sample-video.jpg',
    caption: 'Precision cadence & fluid motion ⚡🏎️ #SpeedCraft #NoirVision', 
    user: { name: 'Marcus Thorne', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' }, 
    likes: ['user1', 'user2', 'user3', 'user4'], 
    comments: [1, 2, 3] 
  }
];

// --- Sub-Component: Action Button ---
const ActionBtn = ({ icon, label, onClick, active, color = "text-[#F7F7FC]" }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group cursor-pointer transition-transform active:scale-95">
    <div className={`p-3 rounded-full transition-all duration-300 ${
      active 
        ? 'bg-[#052E24]/30 border border-[#10B981]/40 shadow-[0_0_15px_rgba(185,28,28,0.4)] backdrop-blur-xl' 
        : 'bg-[#070B14]/60 border border-white/10 backdrop-blur-xl group-hover:bg-[#0A111E]/80 group-hover:border-white/20'
    }`}>
      {React.cloneElement(icon, { 
        size: 24, 
        className: `drop-shadow-lg transition-transform group-active:scale-75 ${active ? color : 'text-[#F7F7FC]'}` 
      })}
    </div>
    <span className="text-[#CBD5E1] text-[11px] font-semibold drop-shadow-md tracking-wide">{label}</span>
  </button>
);

// --- Sub-Component: Single Reel Item ---
const ReelItem = ({ reel, isActive, isNext, toggleLike, onDelete }) => {
  const videoRef = useRef(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const myId = useSelector(s => s.auth.user?._id);
  const { add: addToast } = useToast();

  const [tipping, setTipping] = useState(false);
  const [showCoinBurst, setShowCoinBurst] = useState(false);

  const handleTipCreator = async (e) => {
    e?.stopPropagation();
    if (!myId) {
      addToast('Please log in to tip creators', { type: 'error' });
      return;
    }
    if (isMine) {
      addToast('Cannot tip your own reel', { type: 'info' });
      return;
    }
    if (tipping) return;

    setTipping(true);
    try {
      const res = await API.post(`/reels/${reel._id}/tip`, { amount: 10 });
      playSound('success');
      setShowCoinBurst(true);
      setTimeout(() => setShowCoinBurst(false), 1400);

      if (typeof res.data?.balance === 'number') {
        dispatch(updateAuthUser({ wallet: { balance: res.data.balance } }));
      }
      addToast(`Tipped 10 Treasury coins to ${reel.user?.name || 'creator'}! 💎`, { type: 'success' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not send tip', { type: 'error' });
    } finally {
      setTipping(false);
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!reel.user?._id || isMine) return;
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    try {
      await API.post(`/users/${reel.user._id}/follow`);
      addToast(nextState ? `Following ${reel.user.name}` : `Unfollowed ${reel.user.name}`, { type: 'success' });
    } catch (_) {
      setIsFollowing(!nextState);
    }
  };

  // Auto-play active reel, pause inactive ones
  useEffect(() => {
    let viewTimer;

    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }

      // Count view after 3 seconds of active watching
      if (!String(reel._id).startsWith('demo')) {
        viewTimer = setTimeout(() => {
          API.post(`/reels/${reel._id}/view`).catch(() => {});
        }, 3000);
      }
    } else {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          setIsPlaying(false);
        } catch (_) {}
      }
    }

    return () => {
      clearTimeout(viewTimer);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          setIsPlaying(false);
        } catch (_) {}
      }
    };
  }, [isActive, reel._id]);

  // Sync Like State
  useEffect(() => {
    setIsLiked(Array.isArray(reel?.likes) && reel.likes.includes(myId));
  }, [reel, myId]);

  const isMine = Boolean(reel.user?._id && myId && String(reel.user._id) === String(myId));

  const onToggleLike = async () => {
    const newVal = !isLiked;
    setIsLiked(newVal);
    if (newVal) playSound('pop');
    try {
      if (toggleLike) await toggleLike(reel._id);
    } catch (e) {
      setIsLiked(!newVal);
    }
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (!isLiked) onToggleLike();
    else playSound('pop');
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 700);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(m => !m);
    playSound('cyber');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/reels`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Socialo Reel', url }); } catch(e){}
    } else {
      navigator.clipboard.writeText(url);
      addToast('Link copied to clipboard!', { type: 'success' });
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDelete(false);
    if (onDelete) onDelete(reel._id);
    setShowMenu(false);
  };

  const videoSrc = getImageUrl(reel.videoUrl || reel.videos?.[0]);
  const posterSrc = reel.posterUrl || reel.thumbnail || (reel.videoUrl ? reel.videoUrl.replace(/\.mp4($|\?)/, '.jpg$1') : undefined);

  return (
    <div className="relative w-full h-full snap-start shrink-0 flex justify-center bg-[#04070D] overflow-hidden border-b border-white/5 select-none">
      
      {/* --- VIDEO PLAYER --- */}
      <div 
        className="relative w-full h-full md:max-w-[500px] cursor-pointer flex items-center justify-center bg-black" 
        onDoubleClick={handleDoubleTap}
        onClick={togglePlayPause}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          preload={isActive || isNext ? "auto" : "metadata"}
          className="h-full w-full object-cover"
          loop
          muted={isMuted}
          playsInline
          autoPlay={isActive}
        />

        {/* Play / Pause Feedback Pulse */}
        <AnimatePresence>
          {showPlayIcon && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute pointer-events-none p-5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-3xl"
            >
              {isPlaying ? <FaPlay /> : <FaPause />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double Tap Heart Laser Pop */}
        <AnimatePresence>
          {showHeartOverlay && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: [0, 1.3, 1.1], opacity: 1 }} 
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <FaHeart className="text-[#10B981] drop-shadow-[0_0_40px_rgba(185,28,28,0.9)] text-9xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Coin Burst Overlay */}
        <AnimatePresence>
          {showCoinBurst && (
            <motion.div 
              initial={{ scale: 0.5, y: 30, opacity: 0 }} 
              animate={{ scale: 1.1, y: -40, opacity: 1 }} 
              exit={{ scale: 1.3, y: -90, opacity: 0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <div className="px-5 py-2.5 rounded-full bg-[#070B14]/95 border border-[#F4D49A] text-[#F4D49A] font-bold text-sm shadow-[0_0_35px_rgba(244,212,154,0.5)] flex items-center gap-2 backdrop-blur-xl">
                <FaCoins className="text-xl animate-spin" /> +10 Coins Tipped!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- OVERLAYS --- */}

      {/* 1. Mute Button */}
      <button
        onClick={handleToggleMute}
        className="absolute top-6 left-6 z-30 p-2.5 bg-[#070B14]/70 border border-white/10 rounded-full text-[#F7F7FC] backdrop-blur-xl hover:bg-[#0A111E]/90 transition shadow-lg cursor-pointer"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
      </button>

      {/* 2. Menu Button */}
      <div className="absolute top-6 right-6 z-40">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMenu(s => !s); }} 
          className="p-2.5 bg-[#070B14]/70 border border-white/10 rounded-full text-[#F7F7FC] backdrop-blur-xl hover:bg-[#0A111E]/90 transition shadow-lg cursor-pointer"
        >
          <FaEllipsisV size={16} />
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-44 bg-[#070B14]/95 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
            {isMine ? (
              <button onClick={(e) => { e.stopPropagation(); setShowDelete(true); }} className="w-full text-left px-4 py-3 text-[#F87171] hover:bg-white/5 flex items-center gap-2 text-xs font-bold transition">
                <FaTrash /> Delete Reel
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setShowReport(true); }} className="w-full text-left px-4 py-3 text-[#F87171] hover:bg-white/5 flex items-center gap-2 text-xs font-bold transition">
                <FaExclamationTriangle /> Report Content
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Right Sidebar Actions */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-5 items-center z-30 pointer-events-auto">
        <ActionBtn 
          icon={isLiked ? <FaHeart /> : <FaRegHeart />} 
          label={reel.likes?.length || (isLiked ? 1 : 0)} 
          onClick={onToggleLike} 
          active={isLiked} 
          color="text-[#10B981]" 
        />
        <ActionBtn 
          icon={<FaComment />} 
          label={reel.comments?.length || 0} 
          onClick={() => window.dispatchEvent(new CustomEvent('openComments', { detail: reel._id }))} 
        />
        <ActionBtn 
          icon={<FaCoins />} 
          label={tipping ? "..." : "Tip 10"} 
          onClick={handleTipCreator} 
          color="text-[#F4D49A]" 
        />
        <ActionBtn 
          icon={<FaShare />} 
          label="Share" 
          onClick={handleShare} 
        />
        
        {/* Disc Animation */}
        <div className="mt-2 w-9 h-9 rounded-full border-2 border-white/20 bg-[#070B14] overflow-hidden animate-[spin_4s_linear_infinite] shadow-[0_0_15px_rgba(100,223,223,0.25)]">
           <UserAvatar src={reel.user?.avatar} name={reel.user?.name} className="w-full h-full opacity-80 object-cover" />
        </div>
      </div>

      {/* 4. Bottom Info (User & Caption) */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-20 md:pb-6 bg-gradient-to-t from-[#04070D]/95 via-[#04070D]/50 to-transparent pt-32 w-full md:max-w-[500px] mx-auto pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
          
          {/* User */}
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition">
            <div onClick={() => reel.user?._id && navigate(`/profile/${reel.user._id}`)}>
              <UserAvatar src={reel.user?.avatar} name={reel.user?.name} userId={reel.user?._id} className="w-10 h-10 border border-white/20 rounded-full shadow-md" />
            </div>
            <div className="flex flex-col">
                <span className="text-[#F7F7FC] font-bold text-sm md:text-base drop-shadow-md flex items-center gap-2">
                <span onClick={() => reel.user?._id && navigate(`/profile/${reel.user._id}`)} className="hover:underline">{reel.user?.name}</span>
                {!isMine && reel.user?._id && (
                  <button 
                    onClick={handleFollow}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition shadow-sm cursor-pointer ${
                      isFollowing 
                        ? 'bg-white/10 text-[#F7F7FC] border border-white/20' 
                        : 'bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white hover:opacity-90'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                </span>
            </div>
          </div>

          {/* Caption */}
          <div className="text-[#CBD5E1] text-xs md:text-sm leading-relaxed drop-shadow-md max-w-[85%]">
            <span className={expandedCaption ? "" : "line-clamp-2"}>
              {reel.caption}
            </span>
            {reel.caption && reel.caption.length > 60 && (
                <button 
                    onClick={() => setExpandedCaption(!expandedCaption)}
                    className="text-[#00F2FE] text-xs font-semibold ml-1 hover:underline cursor-pointer"
                >
                    {expandedCaption ? "less" : "more"}
                </button>
            )}
          </div>

          {/* Music Tag */}
          <div className="flex items-center gap-2 text-[#CBD5E1] text-xs mt-1 bg-[#070B14]/80 border border-white/10 px-3 py-1 rounded-full w-max backdrop-blur-md">
            <FaMusic size={10} className="text-[#00F2FE]" />
            <span className="font-medium text-[10px] md:text-[11px]">Original Audio • {reel.user?.name || 'Socialo Cinema'}</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportModal isOpen={showReport} onClose={() => { setShowReport(false); setShowMenu(false); }} targetPostId={reel._id} />
      <ConfirmModal isOpen={showDelete} onCancel={() => setShowDelete(false)} onConfirm={handleDeleteConfirm} title="Delete Reel?" />
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  
  const containerRef = useRef(null);
  const { add: addToast } = useToast();

  useEffect(() => { loadReels(); }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (!containerRef.current) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            containerRef.current.scrollBy({ top: containerRef.current.clientHeight, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            containerRef.current.scrollBy({ top: -containerRef.current.clientHeight, behavior: 'smooth' });
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadReels = async () => {
    try {
      const res = await API.get('/reels/feed');
      const payload = res?.data?.data || res?.data;
      const list = Array.isArray(payload) ? payload : [];
      setReels(list.length > 0 ? list : DEMO_REELS);
    } catch (e) {
      console.warn('Failed to load reels, falling back to instant CDN reels', e);
      setReels(DEMO_REELS); 
    }
  };

  const deleteReel = async (id) => {
    try {
      await API.delete(`/reels/${id}`);
      setReels(prev => prev.filter(r => r._id !== id));
      addToast('Reel deleted', { type: 'info' });
    } catch (e) {
      if (String(id).startsWith('demo')) {
        setReels(prev => prev.filter(r => r._id !== id));
        addToast('Demo reel removed', { type: 'info' });
      } else {
        addToast('Failed to delete reel', { type: 'error' });
      }
    }
  };

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
        addToast("File too large! Max 50MB.", { type: 'error' });
        return;
    }
    
    setSelectedFile(file);
  };

  const performUpload = async (caption) => {
    if (!selectedFile) return;
    
    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append('video', selectedFile);
    fd.append('caption', caption);
    
    try {
      await API.post('/reels/upload', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
        }
      });
      addToast('Reel uploaded successfully!', { type: 'success' });
      setSelectedFile(null);
      await loadReels();
    } catch (err) {
      addToast('Upload failed.', { type: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleLikeApi = async (id) => {
    try {
      if (!id || String(id).startsWith('demo')) return;
      await API.put(`/reels/like/${id}`);
    } catch (e) { throw e; }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (index !== activeIndex && index >= 0 && index < reels.length) {
      setActiveIndex(index);
    }
  };

  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    if (e.touches?.[0]) touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches?.[0] || !containerRef.current) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - endY;
    if (Math.abs(deltaY) > 45) {
      const h = containerRef.current.clientHeight;
      if (deltaY > 0 && activeIndex < reels.length - 1) {
        containerRef.current.scrollTo({ top: (activeIndex + 1) * h, behavior: 'smooth' });
      } else if (deltaY < 0 && activeIndex > 0) {
        containerRef.current.scrollTo({ top: (activeIndex - 1) * h, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el && el.removeEventListener('scroll', handleScroll);
  }, [activeIndex, reels.length]);

  return (
    <div className="relative h-[calc(100vh-20px)] w-full flex flex-col items-center bg-[#04070D] md:rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      
      {/* Header / Upload */}
      <div className="absolute top-4 left-4 z-50 flex justify-between w-[calc(100%-32px)] items-center pointer-events-none">
        <h2 className="text-xl font-bold text-[#F7F7FC] drop-shadow-md flex items-center gap-2">
            <FaVideo className="text-[#FF6B8A]" /> Reels
        </h2>
        
        <label className="pointer-events-auto cursor-pointer bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] hover:opacity-95 backdrop-blur-xl px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-2 transition border border-white/20 shadow-[0_4px_20px_rgba(29,78,216,0.35)]">
           <FaVideo /> Create Reel
           <input type="file" accept="video/*" className="hidden" onChange={onFileSelect} disabled={uploading} />
        </label>
      </div>

      {/* SCROLL CONTAINER */}
      <div 
        ref={containerRef} 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth"
      >
        {reels.length === 0 && !uploading && (
          <div className="h-full flex items-center justify-center text-[#A5A9BB] flex-col gap-6 text-center px-4">
            <div className="text-7xl animate-bounce">🎬</div>
            <div>
                <h2 className="text-2xl font-bold text-[#F7F7FC] mb-2 font-display">No Reels Yet</h2>
                <p className="text-[#CBD5E1] max-w-xs mx-auto text-sm">Start the movement! Upload the first cinematic reel or explore samples.</p>
            </div>
            <button onClick={() => setReels(DEMO_REELS)} className="px-8 py-3 bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white font-bold rounded-full hover:scale-105 transition shadow-[0_4px_20px_rgba(29,78,216,0.4)] text-sm cursor-pointer">
                Load Demo Reels
            </button>
          </div>
        )}

        {reels.map((reel, i) => (
          <ReelItem
            key={reel._id}
            reel={reel}
            isActive={i === activeIndex}
            isNext={i === activeIndex + 1}
            toggleLike={toggleLikeApi}
            onDelete={deleteReel}
          />
        ))}
      </div>

      {/* Render Upload Modal */}
      <ReelUploadModal 
        file={selectedFile} 
        onClose={() => setSelectedFile(null)} 
        onConfirm={performUpload}
        uploading={uploading}
        progress={uploadProgress}
      />
    </div>
  );
}
