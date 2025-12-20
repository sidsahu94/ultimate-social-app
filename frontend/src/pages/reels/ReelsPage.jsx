import React, { useEffect, useState, useRef, useCallback } from 'react';
import API from '../../services/api';
import {
  FaHeart, FaRegHeart, FaComment, FaShare,
  FaVolumeMute, FaVolumeUp,
  FaEllipsisV, FaTrash, FaExclamationTriangle, FaVideo, FaMusic, FaArrowLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../../components/ui/UserAvatar';
import { useToast } from '../../components/ui/ToastProvider';
import ReportModal from '../../components/ui/ReportModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

// Reliable Demo Data
const DEMO_REELS = [
  { _id: 'demo1', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', caption: 'Adventure time! 🏔️ #travel #nature', user: { name: 'Travel Vlogger', avatar: null }, likes: [], comments: [] },
  { _id: 'demo2', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', caption: 'Cinematic vibes 🎥 #movies', user: { name: 'Cinema Club', avatar: null }, likes: [], comments: [] },
  { _id: 'demo3', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', caption: 'Just relaxing 🧘‍♂️ #chill', user: { name: 'Zen Master', avatar: null }, likes: [], comments: [] }
];

// --- Sub-Component: Action Button ---
const ActionBtn = ({ icon, label, onClick, active, color = "text-white" }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group cursor-pointer">
    <div className={`p-3 rounded-full transition-all duration-200 ${active ? 'bg-white/20' : 'bg-black/20 backdrop-blur-md group-hover:bg-black/40'}`}>
      {React.cloneElement(icon, { 
        size: 28, 
        className: `drop-shadow-lg transition-transform group-active:scale-75 ${active ? color : 'text-white'}` 
      })}
    </div>
    <span className="text-white text-xs font-bold drop-shadow-md">{label}</span>
  </button>
);

// --- Sub-Component: Single Reel Item ---
const ReelItem = ({ reel, isActive, toggleLike, onDelete }) => {
  const videoRef = useRef(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);
  
  const myId = useSelector(s => s.auth.user?._id);
  const { add: addToast } = useToast();

  // Handle Auto-Play / Pause
  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        const p = videoRef.current.play();
        if (p && p.catch) p.catch(() => {});
      }
    } else {
      if (videoRef.current) videoRef.current.pause();
    }
  }, [isActive]);

  // Sync Like State
  useEffect(() => {
    setIsLiked(Array.isArray(reel?.likes) && reel.likes.includes(myId));
  }, [reel, myId]);

  const isMine = Boolean(reel.user?._id && myId && String(reel.user._id) === String(myId));

  const onToggleLike = async () => {
    const newVal = !isLiked;
    setIsLiked(newVal); // Optimistic Update
    try {
      if (toggleLike) await toggleLike(reel._id);
    } catch (e) {
      setIsLiked(!newVal); // Revert on error
    }
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (!isLiked) onToggleLike();
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 800);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${reel._id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Check this reel', url }); } catch(e){}
    } else {
      navigator.clipboard.writeText(url);
      addToast('Link copied!', { type: 'success' });
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDelete(false);
    if (onDelete) onDelete(reel._id);
    setShowMenu(false);
  };

  return (
    <div className="relative w-full h-full snap-start shrink-0 flex justify-center bg-black overflow-hidden border-b border-gray-800">
      
      {/* --- VIDEO PLAYER --- */}
      <div className="relative w-full h-full md:max-w-[500px] cursor-pointer" onDoubleClick={handleDoubleTap}>
        <video
          ref={videoRef}
          src={reel.videoUrl || reel.videos?.[0]}
          className="h-full w-full object-cover"
          loop
          muted={isMuted}
          playsInline
          onClick={() => {
             if (videoRef.current) videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
          }}
        />

        {/* Double Tap Heart Animation */}
        <AnimatePresence>
          {showHeartOverlay && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1.2, opacity: 1 }} 
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <FaHeart className="text-white drop-shadow-2xl text-9xl opacity-90" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- OVERLAYS --- */}

      {/* 1. Mute Button */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsMuted(m => !m); }}
        className="absolute top-20 right-4 z-30 p-2 bg-black/30 rounded-full text-white backdrop-blur-md hover:bg-black/50"
      >
        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
      </button>

      {/* 2. Menu Button */}
      <div className="absolute top-6 right-4 z-40">
        <button onClick={(e) => { e.stopPropagation(); setShowMenu(s => !s); }} className="p-2 text-white drop-shadow-md">
          <FaEllipsisV size={22} />
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in border dark:border-gray-700">
            {isMine ? (
              <button onClick={(e) => { e.stopPropagation(); setShowDelete(true); }} className="w-full text-left px-4 py-3 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-bold">
                <FaTrash /> Delete
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setShowReport(true); }} className="w-full text-left px-4 py-3 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-bold">
                <FaExclamationTriangle /> Report
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Right Sidebar Actions */}
      <div className="absolute bottom-20 right-3 flex flex-col gap-6 items-center z-30 pointer-events-auto">
        <ActionBtn 
          icon={isLiked ? <FaHeart /> : <FaRegHeart />} 
          label={reel.likes?.length || (isLiked ? 1 : 0)} 
          onClick={onToggleLike} 
          active={isLiked} 
          color="text-red-500" 
        />
        <ActionBtn 
          icon={<FaComment />} 
          label={reel.comments?.length || 0} 
          onClick={() => window.dispatchEvent(new CustomEvent('openComments', { detail: reel._id }))} 
        />
        <ActionBtn 
          icon={<FaShare />} 
          label="Share" 
          onClick={handleShare} 
        />
        
        {/* Music Disc Animation */}
        <div className="mt-4 w-10 h-10 rounded-full border-4 border-gray-800 bg-gray-900 overflow-hidden animate-[spin_4s_linear_infinite] shadow-lg">
           <UserAvatar src={reel.user?.avatar} name={reel.user?.name} className="w-full h-full opacity-80 object-cover" />
        </div>
      </div>

      {/* 4. Bottom Info (User & Caption) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 md:pb-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-32 w-full md:max-w-[500px] mx-auto pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
          
          {/* User */}
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition">
            <UserAvatar src={reel.user?.avatar} name={reel.user?.name} className="w-10 h-10 border-2 border-white rounded-full shadow-md" />
            <div className="flex flex-col">
                <span className="text-white font-bold text-sm md:text-base drop-shadow-md flex items-center gap-2">
                {reel.user?.name}
                <button className="bg-transparent border border-white/60 px-2 py-0.5 rounded text-[10px] font-bold text-white hover:bg-white hover:text-black transition">Follow</button>
                </span>
            </div>
          </div>

          {/* Caption */}
          <div className="text-white text-sm leading-relaxed drop-shadow-md max-w-[80%]">
            <span className={expandedCaption ? "" : "line-clamp-2"}>
              {reel.caption}
            </span>
            {reel.caption && reel.caption.length > 60 && (
                <button 
                    onClick={() => setExpandedCaption(!expandedCaption)}
                    className="text-gray-300 text-xs font-semibold ml-1 hover:underline"
                >
                    {expandedCaption ? "less" : "more"}
                </button>
            )}
          </div>

          {/* Music Tag */}
          <div className="flex items-center gap-2 text-white/90 text-xs mt-1 bg-white/10 px-3 py-1 rounded-full w-max backdrop-blur-sm">
            <FaMusic size={10} />
            <span className="font-medium">Original Audio • {reel.user?.name}</span>
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
  const [uploading, setUploading] = useState(false);
  const containerRef = useRef(null);
  const nav = useNavigate();
  const { add: addToast } = useToast();

  useEffect(() => { loadReels(); }, []);

  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            containerRef.current.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            containerRef.current.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadReels = async () => {
    try {
      const res = await API.get('/reels/feed');
      setReels(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load reels', e);
      setReels([]); 
    }
  };

  const deleteReel = async (id) => {
    try {
      await API.delete(`/posts/${id}`);
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

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const caption = prompt('Enter a caption for your reel:');
    if (caption === null) return;
    
    setUploading(true);
    const fd = new FormData();
    fd.append('video', file);
    fd.append('caption', caption);
    
    try {
      await API.post('/reels/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      addToast('Reel uploaded! Processing...', { type: 'success' });
      await loadReels();
    } catch (err) {
      addToast('Upload failed.', { type: 'error' });
    } finally {
      setUploading(false);
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
    if (index !== activeIndex) setActiveIndex(index);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el && el.removeEventListener('scroll', handleScroll);
  }, [activeIndex]);

  return (
    // Fits inside MainLayout grid, snaps perfectly
    <div className="relative h-[calc(100vh-20px)] w-full flex flex-col items-center bg-black md:rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Header / Upload */}
      <div className="absolute top-4 left-4 z-50 flex justify-between w-[calc(100%-32px)] items-center pointer-events-none">
        <h2 className="text-xl font-bold text-white drop-shadow-md flex items-center gap-2">
            <FaVideo className="text-pink-500" /> Reels
        </h2>
        
        <label className="pointer-events-auto cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold flex items-center gap-2 transition border border-white/10 shadow-lg">
          {uploading ? <span className="animate-pulse">Uploading...</span> : <><FaVideo /> Create</>}
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* SCROLL CONTAINER */}
      <div 
        ref={containerRef} 
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth"
      >
        {reels.length === 0 && !uploading && (
          <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-6 text-center">
            <div className="text-7xl animate-bounce">🎬</div>
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">No Reels Yet</h2>
                <p className="text-gray-400 max-w-xs mx-auto">Start the trend! Upload the first reel or load samples.</p>
            </div>
            <button onClick={() => setReels(DEMO_REELS)} className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-full hover:scale-105 transition shadow-lg">
                Load Demo Reels
            </button>
          </div>
        )}

        {reels.map((reel, i) => (
          <ReelItem
            key={reel._id}
            reel={reel}
            isActive={i === activeIndex}
            toggleLike={toggleLikeApi}
            onDelete={deleteReel}
          />
        ))}
      </div>
    </div>
  );
}