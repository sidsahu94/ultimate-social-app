import React, { useEffect, useState, useRef } from 'react';
import API from '../../services/api';
import { FaHeart, FaComment, FaShare, FaArrowLeft, FaMusic, FaVideo, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../../components/ui/UserAvatar';
import { useToast } from '../../components/ui/ToastProvider';

// Reliable Test Videos (Google Storage)
const DEMO_REELS = [
  {
    _id: 'demo1',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    caption: 'Adventure time! 🏔️ #travel #nature',
    user: { name: 'Travel Vlogger', avatar: null },
    likes: [], comments: []
  },
  {
    _id: 'demo2',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: 'Cinematic vibes 🎥 #movies',
    user: { name: 'Cinema Club', avatar: null },
    likes: [], comments: []
  },
  {
    _id: 'demo3',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    caption: 'Just relaxing 🧘‍♂️ #chill',
    user: { name: 'Zen Master', avatar: null },
    likes: [], comments: []
  }
];

const ReelItem = ({ reel, isActive, toggleLike }) => {
  const videoRef = useRef(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Autoplay requires mute initially

  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        // Attempt play
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Autoplay prevented:", error);
          });
        }
      }
    } else {
      videoRef.current?.pause();
    }
  }, [isActive]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    toggleLike && toggleLike(reel._id);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black snap-center flex justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={reel.videoUrl || reel.videos?.[0]}
        className="h-full w-full object-cover md:max-w-[450px]"
        loop
        muted={isMuted} // Critical for autoplay
        playsInline
        onClick={() => videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()}
        onError={(e) => console.error("Video Error:", e.target.error)}
      />

      {/* Mute Toggle Icon (Top Right) */}
      <button 
        onClick={toggleMute}
        className="absolute top-20 right-4 z-30 p-2 bg-black/40 rounded-full text-white backdrop-blur-md"
      >
        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
      </button>

      {/* Overlay Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 md:pb-4 bg-gradient-to-t from-black/90 via-black/30 to-transparent pt-32 w-full md:max-w-[450px] mx-auto pointer-events-none">
        <div className="flex items-center gap-3 mb-3 pointer-events-auto">
          <UserAvatar src={reel.user?.avatar} name={reel.user?.name} className="w-10 h-10 border-2 border-white" />
          <div>
            <div className="text-white font-bold text-shadow-sm flex items-center gap-2">
              {reel.user?.name}
              <button className="text-xs bg-white/20 hover:bg-white/40 border border-white/50 text-white px-2 py-0.5 rounded transition">Follow</button>
            </div>
            <div className="text-white/80 text-xs flex items-center gap-1">
              <FaMusic size={10} /> Original Audio
            </div>
          </div>
        </div>
        <p className="text-white text-sm mb-4 line-clamp-2">{reel.caption}</p>
      </div>

      {/* Right Actions */}
      <div className="absolute bottom-24 right-2 md:right-[calc(50%-220px)] flex flex-col gap-6 items-center z-20 pointer-events-auto">
        <ActionBtn icon={<FaHeart size={28} className={isLiked ? "text-red-500" : "text-white"} />} label={reel.likes?.length || (isLiked ? 1 : 0)} onClick={handleLike} />
        <ActionBtn icon={<FaComment size={28} className="text-white" />} label={reel.comments?.length || 0} />
        <ActionBtn icon={<FaShare size={28} className="text-white" />} label="Share" />
        
        {/* Spinning Vinyl Record Effect */}
        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden animate-[spin_4s_linear_infinite]">
           <img src={reel.user?.avatar || '/default-avatar.png'} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
};

const ActionBtn = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group">
    <div className="p-2 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-90 transition hover:bg-black/40">
      {icon}
    </div>
    <span className="text-white text-xs font-semibold drop-shadow-md">{label}</span>
  </button>
);

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const containerRef = useRef(null);
  const nav = useNavigate();
  const { add: addToast } = useToast();

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const res = await API.get('/reels/feed');
      // If no reels from backend, keep state empty to show the Demo UI
      setReels(res.data || []);
    } catch (e) { console.error(e); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const caption = prompt("Enter a caption for your reel:");
    if (caption === null) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('video', file);
    fd.append('caption', caption);

    try {
      await API.post('/reels/upload', fd, { headers: {'Content-Type': 'multipart/form-data'} });
      addToast('Reel uploaded! Processing...', { type: 'info' });
      loadReels();
    } catch (err) {
      addToast('Upload failed. Max size 50MB.', { type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Scroll Snap Logic
  const handleScroll = (e) => {
    const containerHeight = e.target.clientHeight;
    const scrollPosition = e.target.scrollTop;
    const index = Math.round(scrollPosition / containerHeight);
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex justify-center">
      {/* Back Button */}
      <button onClick={() => nav(-1)} className="absolute top-6 left-4 z-50 text-white p-2 bg-black/30 rounded-full backdrop-blur-md hover:bg-black/50 transition">
        <FaArrowLeft size={20} />
      </button>

      {/* Upload Button */}
      <label className="absolute top-6 right-4 z-50 cursor-pointer">
        <div className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition">
          {uploading ? 'Uploading...' : <><FaVideo /> Create</>}
        </div>
        <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {/* Container */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y-mandatory no-scrollbar"
        onScroll={handleScroll}
      >
        {reels.length === 0 && !uploading && (
          <div className="h-full flex items-center justify-center text-white flex-col gap-6 bg-gray-900 px-4 text-center">
            <div className="text-6xl animate-bounce">🎬</div>
            <h2 className="text-2xl font-bold">No Reels Yet</h2>
            <p className="text-gray-400 max-w-xs">Be the first to upload or load samples to test the player.</p>
            
            <button 
              onClick={() => setReels(DEMO_REELS)} // INJECT ROBUST DEMO DATA
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition shadow-xl transform hover:scale-105"
            >
              Load Demo Reels
            </button>
          </div>
        )}

        {reels.map((reel, i) => (
          <ReelItem 
            key={reel._id} 
            reel={reel} 
            isActive={i === activeIndex} 
            toggleLike={async (id) => {
               if(!id.startsWith('demo')) await API.put(`/posts/like/${id}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}