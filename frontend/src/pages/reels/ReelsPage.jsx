// frontend/src/pages/reels/ReelsPage.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaVolumeMute,
  FaVolumeUp,
  FaEllipsisV,
  FaTrash,
  FaExclamationTriangle,
  FaPlay,
  FaPause,
  FaCoins,
} from "react-icons/fa";
import {
  IoCameraOutline,
  IoCheckmarkCircle,
  IoMusicalNotes,
  IoAdd,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../../components/ui/UserAvatar";
import { useToast } from "../../components/ui/ToastProvider";
import ReportModal from "../../components/ui/ReportModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import ReelUploadModal from "../../components/reels/ReelUploadModal";
import { getImageUrl } from "../../utils/imageUtils";
import { playSound } from "../../utils/soundEffects";
import { useTheme } from "../../contexts/ThemeProvider";
import TipModal from "../../components/wallet/TipModal";

// Curated Showcase Reels (Matching Screen 3 reference design)
const DEMO_REELS = [
  {
    _id: "demo-reel-1",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/so_0,du_12,w_540,q_auto/dog.mp4",
    posterUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80",
    caption: "Nature heals everything 🌿 Taking in the golden hour silence atop the ridge.",
    audioTrack: "Acoustic Vibes • Original Audio",
    user: {
      _id: "sidhanta-1",
      name: "Sidhanta Sahu",
      username: "sidhanta",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
      isVerified: true,
    },
    likesCount: "24.8K",
    commentsCount: "427",
    sharesCount: "1.6K",
    likes: ["u1", "u2"],
    comments: [1, 2, 3],
  },
  {
    _id: "demo-reel-2",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/so_0,du_10,w_540,q_auto/sea_turtle.mp4",
    posterUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    caption: "Azure currents & deep tranquility 🌊🐢 Ocean drifting in crystal waters.",
    audioTrack: "Ocean Drift • Ambient Sound",
    user: {
      _id: "maya-2",
      name: "Maya Patel",
      username: "mayapatel",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
      isVerified: true,
    },
    likesCount: "18.2K",
    commentsCount: "310",
    sharesCount: "980",
    likes: ["u1"],
    comments: [1],
  },
  {
    _id: "demo-reel-3",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/elephants.mp4",
    posterUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80",
    caption: "Serengeti sovereigns under dusk 🦁🌅 Majestic earth in golden light.",
    audioTrack: "Serengeti Sunrise • Earth Sounds",
    user: {
      _id: "arjun-3",
      name: "Arjun Verma",
      username: "arjunv",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      isVerified: false,
    },
    likesCount: "42.1K",
    commentsCount: "890",
    sharesCount: "4.3K",
    likes: ["u1", "u2", "u3"],
    comments: [1, 2],
  },
];

// --- Sub-Component: Action Button ---
const ActionBtn = ({ icon, label, onClick, active, color = "text-white" }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1 group cursor-pointer transition-transform active:scale-90"
  >
    <div
      className={`p-3 rounded-full transition-all duration-300 ${
        active
          ? "bg-white/20 border border-white/40 shadow-lg backdrop-blur-xl"
          : "bg-black/40 border border-white/15 backdrop-blur-xl group-hover:bg-black/60 group-hover:border-white/30"
      }`}
    >
      {React.cloneElement(icon, {
        size: 22,
        className: `drop-shadow-lg transition-transform group-active:scale-75 ${
          active ? color : "text-white"
        }`,
      })}
    </div>
    <span className="text-white text-[11px] font-semibold drop-shadow-md tracking-wide">
      {label}
    </span>
  </button>
);

// --- Sub-Component: Single Reel Item ---
const ReelItem = ({ reel, isActive, toggleLike, onDelete }) => {
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
  const [showTipModal, setShowTipModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const navigate = useNavigate();
  const myId = useSelector((s) => s.auth.user?._id);
  const { add: addToast } = useToast();
  const { currentTheme } = useTheme();

  // Autoplay when slide is active
  useEffect(() => {
    let viewTimer = null;
    if (isActive && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      if (reel._id && !String(reel._id).startsWith("demo")) {
        viewTimer = setTimeout(() => {
          API.post(`/reels/view/${reel._id}`).catch(() => {});
        }, 3000);
      }
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
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

  useEffect(() => {
    setIsLiked(Array.isArray(reel?.likes) && reel.likes.includes(myId));
  }, [reel, myId]);

  const onToggleLike = async () => {
    const newVal = !isLiked;
    setIsLiked(newVal);
    if (newVal) playSound("pop");
    try {
      if (toggleLike) await toggleLike(reel._id);
    } catch (e) {
      setIsLiked(!newVal);
    }
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (!isLiked) onToggleLike();
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
    setIsMuted((m) => !m);
    playSound("cyber");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/reels`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "SocialVerse Reel", url });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(url);
      addToast("Reel link copied to clipboard!", { type: "success" });
    }
  };

  const videoSrc = getImageUrl(reel.videoUrl || reel.videos?.[0]);
  const posterSrc =
    reel.posterUrl ||
    reel.thumbnail ||
    (reel.videoUrl ? reel.videoUrl.replace(/\.mp4($|\?)/, ".jpg$1") : undefined);

  const creatorName = reel.user?.name || "Sidhanta Sahu";
  const isVerified = reel.user?.isVerified !== false;
  const audioTitle = reel.audioTrack || "Acoustic Vibes • Original Audio";
  const displayLikes = isLiked
    ? "24.9K"
    : reel.likesCount || `${reel.likes?.length || 1}K`;
  const displayComments = reel.commentsCount || `${reel.comments?.length || 427}`;
  const displayShares = reel.sharesCount || "1.6K";



  return (
    <div className="relative w-full h-[100dvh] snap-start shrink-0 flex items-center justify-center bg-black overflow-hidden select-none">
      {/* Container 9:16 aspect ratio or fullscreen on mobile */}
      <div
        className="relative w-full max-w-[480px] h-full flex items-center justify-center cursor-pointer"
        onClick={togglePlayPause}
        onDoubleClick={handleDoubleTap}
      >
        {/* Background Video Player */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
          preload="metadata"
        />

        {/* Fallback image poster if video fails */}
        {posterSrc && (
          <img
            src={posterSrc}
            alt="Poster"
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700 ${
              isPlaying ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        {/* Dark Vignette Gradients (top and bottom for readable text) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* Center Double-Tap Animated Heart Overlay */}
        <AnimatePresence>
          {showHeartOverlay && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute z-30 pointer-events-none"
            >
              <FaHeart size={90} className="text-[#FF6B8A] drop-shadow-[0_0_30px_rgba(255,107,138,0.8)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause Pulse Indicator */}
        <AnimatePresence>
          {showPlayIcon && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 0.8 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute z-20 p-5 rounded-full bg-black/60 backdrop-blur-md text-white pointer-events-none"
            >
              {isPlaying ? <FaPlay size={36} /> : <FaPause size={36} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playback Speed Controller (Top Left) */}
        <div className="absolute top-16 left-4 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const speeds = [1, 1.5, 2, 0.5];
              const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
              const nextSpeed = speeds[nextIdx];
              setPlaybackRate(nextSpeed);
              if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
              addToast(`Speed: ${nextSpeed}x`, { type: 'info' });
            }}
            className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90 text-xs font-bold font-mono hover:text-white hover:scale-105 transition shadow-lg cursor-pointer"
            title="Change Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Mute / Unmute Button (Top Right of Reel Container) */}
        <button
          type="button"
          onClick={handleToggleMute}
          className="absolute top-16 right-4 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90 hover:text-white hover:scale-105 transition shadow-lg cursor-pointer"
        >
          {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
        </button>

        {/* ===================================================================
            RIGHT INTERACTION RAIL (Matching Screen 3)
            =================================================================== */}
        <div className="absolute right-3.5 bottom-28 z-20 flex flex-col items-center gap-4 pointer-events-auto">
          {/* Creator Avatar with Pink + Follow Badge */}
          <div className="relative mb-2">
            <div
              className="w-12 h-12 rounded-full p-[2px] transition-transform hover:scale-105 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (reel.user?._id) navigate(`/profile/${reel.user._id}`);
              }}
            >
              <UserAvatar
                src={reel.user?.avatar}
                name={creatorName}
                className="w-full h-full rounded-full border border-black"
                showStatus={false}
              />
            </div>

            {/* Pink Follow Plus Badge */}
            {!isFollowing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFollowing(true);
                  playSound("pop");
                  addToast(`Following ${creatorName}`, { type: "success" });
                }}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FF6B8A] text-white flex items-center justify-center border-2 border-black hover:scale-110 active:scale-95 transition shadow-md cursor-pointer"
              >
                <IoAdd size={14} />
              </button>
            )}
          </div>

          {/* 1. Like Button */}
          <ActionBtn
            icon={isLiked ? <FaHeart /> : <FaRegHeart />}
            label={displayLikes}
            active={isLiked}
            color="text-[#FF6B8A]"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
          />

          {/* 2. Comment Button */}
          <ActionBtn
            icon={<FaComment />}
            label={displayComments}
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('openComments', { detail: reel._id }));
            }}
          />

          {/* 3. Share Button */}
          <ActionBtn
            icon={<FaShare />}
            label={displayShares}
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
          />

          {/* 4. Tip Coins Button */}
          <ActionBtn
            icon={<FaCoins />}
            label="Tip"
            color="text-[#F4D49A]"
            onClick={(e) => {
              e.stopPropagation();
              setShowTipModal(true);
            }}
          />

          {/* 4. More Options */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((m) => !m);
            }}
            className="p-2.5 rounded-full bg-black/40 border border-white/15 backdrop-blur-md text-white/90 hover:text-white transition cursor-pointer"
          >
            <FaEllipsisV size={16} />
          </button>
        </div>

        {/* ===================================================================
            BOTTOM OVERLAY (Matching Screen 3)
            =================================================================== */}
        <div className="absolute left-4 right-20 bottom-28 z-20 pointer-events-auto text-left">
          {/* Creator Name + Verified Badge + Follow Button */}
          <div className="flex items-center gap-2 mb-2">
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (reel.user?._id) navigate(`/profile/${reel.user._id}`);
              }}
              className="font-bold text-white text-sm md:text-base drop-shadow-md hover:underline cursor-pointer"
            >
              {creatorName}
            </span>
            {isVerified && (
              <IoCheckmarkCircle className="text-[#38BDF8] text-base shrink-0 drop-shadow" />
            )}

            {/* Frosted Glass Follow Button (Screen 3) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFollowing((f) => !f);
                playSound("pop");
              }}
              className={`px-3 py-0.5 rounded-full text-xs font-bold transition-all border shadow-sm cursor-pointer ${
                isFollowing
                  ? "bg-white/15 border-white/30 text-white/80"
                  : "bg-white/20 border-white/40 text-white hover:bg-white/30"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          {/* Caption with Expand / Collapse */}
          <div className="text-white/95 text-xs md:text-sm drop-shadow-md mb-3 pr-2 leading-relaxed">
            <span className={expandedCaption ? "" : "line-clamp-2"}>
              {reel.caption}
            </span>
            {reel.caption && reel.caption.length > 50 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCaption((ex) => !ex);
                }}
                className="text-white/70 font-semibold ml-1.5 hover:text-white"
              >
                {expandedCaption ? "less" : "...more"}
              </button>
            )}
          </div>

          {/* Animated Glowing Audio Pill (Screen 3: 🎵 Acoustic Vibes • Original Audio) */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-xl shadow-lg cursor-pointer hover:bg-black/75 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              addToast(`Playing track: ${audioTitle}`, { type: "info" });
            }}
          >
            <IoMusicalNotes className="text-[#00F2FE] text-xs shrink-0" />
            <span className="text-[11px] font-medium text-white/90 truncate max-w-[170px] sm:max-w-[220px]">
              {audioTitle}
            </span>

            {/* 4 Animated Soundwave Equalizer Bars */}
            <div className="flex items-end gap-[2px] h-3 ml-1 shrink-0">
              <span
                className={`w-[2.5px] rounded-full bg-[#00F2FE] transition-all duration-300 ${
                  isPlaying ? "h-3 animate-pulse" : "h-1"
                }`}
              />
              <span
                className={`w-[2.5px] rounded-full bg-[#FF6B8A] transition-all duration-200 ${
                  isPlaying ? "h-2.5 animate-pulse delay-75" : "h-1.5"
                }`}
              />
              <span
                className={`w-[2.5px] rounded-full bg-[#D4AF37] transition-all duration-300 ${
                  isPlaying ? "h-3.5 animate-pulse delay-150" : "h-1"
                }`}
              />
              <span
                className={`w-[2.5px] rounded-full bg-[#38BDF8] transition-all duration-200 ${
                  isPlaying ? "h-2 animate-pulse" : "h-1"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Interactive Video Progress Scrubber Bar */}
        <div
          className="absolute bottom-0 left-0 right-0 z-30 h-1.5 bg-white/20 hover:h-2.5 transition-all cursor-pointer pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (videoRef.current && videoRef.current.duration) {
              videoRef.current.currentTime = pos * videoRef.current.duration;
              setProgress(pos * 100);
            }
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-[#00F2FE] via-[#10B981] to-[#D4AF37] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <TipModal
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        recipientId={reel.user?._id}
        recipientName={creatorName}
      />
    </div>
  );
};

// --- MAIN REELS PAGE ---
export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("forYou"); // 'forYou' | 'following' | 'trending'

  // Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const containerRef = useRef(null);
  const { add: addToast } = useToast();
  const { currentTheme } = useTheme();

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const res = await API.get("/reels/feed");
      const payload = res?.data?.data || res?.data;
      const list = Array.isArray(payload) ? payload : [];
      setReels(list.length > 0 ? list : DEMO_REELS);
    } catch (e) {
      setReels(DEMO_REELS);
    }
  };

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      addToast("File too large! Max 50MB.", { type: "error" });
      return;
    }
    setSelectedFile(file);
  };

  const performUpload = async (caption) => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append("video", selectedFile);
    fd.append("caption", caption);

    try {
      await API.post("/reels/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });
      addToast("Reel uploaded successfully!", { type: "success" });
      setSelectedFile(null);
      await loadReels();
    } catch (err) {
      addToast("Upload failed.", { type: "error" });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const index = Math.round(
      containerRef.current.scrollTop / containerRef.current.clientHeight
    );
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
        containerRef.current.scrollTo({
          top: (activeIndex + 1) * h,
          behavior: "smooth",
        });
      } else if (deltaY < 0 && activeIndex > 0) {
        containerRef.current.scrollTo({
          top: (activeIndex - 1) * h,
          behavior: "smooth",
        });
      }
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.addEventListener("scroll", handleScroll, { passive: true });
  

  return () => el && el.removeEventListener("scroll", handleScroll);
  }, [activeIndex, reels.length]);



  const handleToggleLikeReel = async (reelId) => {
    try {
      if (reelId && !String(reelId).startsWith("demo")) {
        await API.put(`/posts/like/${reelId}`);
      }
    } catch (_) {}
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center bg-black overflow-hidden select-none">
      {/* =====================================================================
          TOP HEADER BAR (Matching Screen 3: For You | Following | Trending + Camera)
          ===================================================================== */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5 pt-3 pb-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Title for desktop / left branding */}
        <div className="hidden md:flex items-center gap-2">
          <span className="font-display font-black text-white text-lg tracking-tight">
            SocialVerse <span style={{ color: currentTheme.color }}>Reels</span>
          </span>
        </div>

        {/* Center Sub-Tabs (Screen 3: For You | Following | Trending) */}
        <div className="flex items-center gap-6 mx-auto">
          {[
            { id: "forYou", label: "For You" },
            { id: "following", label: "Following" },
            { id: "trending", label: "Trending" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-1 font-bold text-sm tracking-wide transition-colors cursor-pointer ${
                activeTab === tab.id ? "text-white" : "text-white/60 hover:text-white/90"
              }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="reels-active-tab-line"
                  className="absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${currentTheme.color}, ${currentTheme.accent})`,
                    boxShadow: `0 0 10px ${currentTheme.glow}`,
                  }}
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Top Right Camera Icon (Screen 3) */}
        <label
          className="p-2 -mr-1 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Create Reel"
        >
          <IoCameraOutline size={26} />
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={onFileSelect}
            disabled={uploading}
          />
        </label>
      </div>

      {/* =====================================================================
          SNAP SCROLL CONTAINER
          ===================================================================== */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth"
      >
        {reels.map((reel, i) => (
          <ReelItem
            key={reel._id}
            reel={reel}
            isActive={i === activeIndex}
            toggleLike={handleToggleLikeReel}
            onDelete={() => {}}
          />
        ))}
      </div>

      {/* Upload Modal */}
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
