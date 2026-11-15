// frontend/src/components/stories/Stories.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { IoAdd, IoEllipsisHorizontal } from 'react-icons/io5';
import API from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';
import { useTheme } from '../../contexts/ThemeProvider';

const StoryEditor = React.lazy(() => import('./StoryEditor'));
const StoryViewer = React.lazy(() => import('./StoryViewer'));

const DEMO_STORIES = [
  {
    _id: 'story_demo_riya',
    user: {
      _id: 'demo_u_riya',
      name: 'Riya',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
    mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: 'story_demo_aman',
    user: {
      _id: 'demo_u_aman',
      name: 'Aman',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: 'story_demo_neha',
    user: {
      _id: 'demo_u_neha',
      name: 'Neha',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: 'story_demo_karan',
    user: {
      _id: 'demo_u_karan',
      name: 'Karan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    mediaUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: 'story_demo_ishita',
    user: {
      _id: 'demo_u_ishita',
      name: 'Ishita',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
    mediaUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: 'story_demo_vikram',
    user: {
      _id: 'demo_u_vikram',
      name: 'Vikram',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    },
    mediaUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: 'story_demo_sneha',
    user: {
      _id: 'demo_u_sneha',
      name: 'Sneha',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    },
    mediaUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
  },
];

export default function Stories() {
  const [stories, setStories] = useState(DEMO_STORIES);
  const [viewedStoryIds, setViewedStoryIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('socialverse_viewed_stories') || '[]'));
    } catch (_) {
      return new Set();
    }
  });
  const [editorFile, setEditorFile] = useState(null);
  const [viewIndex, setViewIndex] = useState(null);
  const user = useSelector((s) => s.auth?.user);
  const { currentTheme } = useTheme();

  const load = async () => {
    try {
      const res = await API.get('/stories');
      const loaded = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (loaded.length > 0) {
        setStories(loaded);
      }
    } catch (_) {
      // Fallback stays as DEMO_STORIES
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Listen for real-time story viewed events to update visual ring instantly
  useEffect(() => {
    const handleStoryViewed = (e) => {
      const id = e.detail?.id;
      if (id) {
        setViewedStoryIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }
    };
    window.addEventListener('story:viewed', handleStoryViewed);
    return () => window.removeEventListener('story:viewed', handleStoryViewed);
  }, []);

  // Partition stories: Unviewed first (with radiant rotating rings), Viewed after (with subtle muted rings)
  const sortedStories = useMemo(() => {
    const unviewed = [];
    const viewed = [];
    stories.forEach((story) => {
      const isAlreadyViewed = Boolean(story.isViewed || viewedStoryIds.has(story._id));
      if (isAlreadyViewed) {
        viewed.push({ ...story, isViewed: true });
      } else {
        unviewed.push({ ...story, isViewed: false });
      }
    });
    return [...unviewed, ...viewed];
  }, [stories, viewedStoryIds]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditorFile(e.target.files[0]);
    }
  };

  const userAvatar = user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

  return (
    <>
      <div
        className="mb-6 rounded-[26px] border border-[rgba(255,255,255,0.14)] bg-[#070B14]/85 p-3.5 md:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        style={{
          boxShadow: `0 16px 40px rgba(0, 0, 0, 0.65), 0 0 25px ${currentTheme.glow}`,
          borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.14)',
        }}
      >
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
          {/* 1. "Your Story" Bubble with + Badge */}
          <div className="flex flex-col items-center gap-1.5 min-w-[68px] md:min-w-[72px] cursor-pointer group relative">
            <div
              className="relative h-[66px] w-[66px] md:h-[72px] md:w-[72px] rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105"
              style={{
                boxShadow: `0 0 16px ${currentTheme.glow}`,
              }}
            >
              {/* Rotating Border Glow */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, ${currentTheme.color}, ${currentTheme.accent}, #F4D49A, ${currentTheme.color})`,
                }}
              />

              <div className="relative h-full w-full rounded-full bg-[#04070D] p-[2px] overflow-hidden z-10">
                <img
                  src={getImageUrl(userAvatar)}
                  alt="Your story"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>

              {/* Pink / Rose-Gold + Badge on Bottom Right */}
              <div
                className="absolute bottom-0 right-0 z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#04070D] shadow-md transition-transform group-hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
                }}
              >
                <IoAdd className="text-white text-xs font-bold" />
              </div>

              <input
                type="file"
                accept="image/*,video/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-30"
                onChange={handleFileSelect}
                title="Add to Your Story"
              />
            </div>

            <span className="text-[11px] font-semibold text-white tracking-tight truncate w-16 text-center">
              Your Story
            </span>
          </div>

          {/* 2. Friends Stories List (Unviewed Radiant vs Viewed Muted) */}
          {sortedStories.map((story, i) => {
            const avatarUrl = getImageUrl(story.user?.avatar);
            const firstName = story.user?.name ? story.user.name.split(' ')[0] : 'Story';
            const isViewed = story.isViewed;
            const ringGradient =
              i % 3 === 0
                ? `conic-gradient(from 0deg, ${currentTheme.color}, ${currentTheme.accent}, #F4D49A, ${currentTheme.color})`
                : i % 3 === 1
                ? `conic-gradient(from 0deg, #00F2FE, #38BDF8, ${currentTheme.color}, #00F2FE)`
                : `conic-gradient(from 0deg, #F43F5E, #EC4899, #D48C7B, #F43F5E)`;

            return (
              <motion.div
                key={story._id || i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setViewIndex(i)}
                className="flex flex-col items-center gap-1.5 min-w-[68px] md:min-w-[72px] cursor-pointer group relative"
              >
                {!isViewed ? (
                  // --- UNVIEWED: VIBRANT ROTATING GRADIENT RING + GLOW + LIVE PULSE ---
                  <div
                    className="relative h-[66px] w-[66px] md:h-[72px] md:w-[72px] rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105"
                    style={{
                      boxShadow: `0 0 16px ${currentTheme.glow || 'rgba(0,242,254,0.35)'}`,
                    }}
                  >
                    {/* Rotating Gradient Ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 18 + i * 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-full"
                      style={{ background: ringGradient }}
                    />

                    {/* Unviewed Live Story Dot Badge */}
                    <span className="absolute top-0 right-0 z-20 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#00F2FE] shadow-[0_0_8px_#00F2FE] border-2 border-[#04070D]" />

                    <div className="relative h-full w-full rounded-full bg-[#04070D] p-[2px] overflow-hidden z-10">
                      <img
                        src={avatarUrl}
                        alt={firstName}
                        className="h-full w-full rounded-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                  </div>
                ) : (
                  // --- VIEWED: MUTED STATIC BORDER + DIMMED AVATAR (Instagram Style) ---
                  <div className="relative h-[66px] w-[66px] md:h-[72px] md:w-[72px] rounded-full p-[2px] border border-white/20 bg-white/[0.03] transition-all duration-300 group-hover:border-white/40 group-hover:scale-105 shadow-sm">
                    <div className="relative h-full w-full rounded-full bg-[#04070D] p-[1.5px] overflow-hidden">
                      <img
                        src={avatarUrl}
                        alt={firstName}
                        className="h-full w-full rounded-full object-cover opacity-70 group-hover:opacity-95 transition-opacity"
                      />
                    </div>
                  </div>
                )}

                <span
                  className={`text-[11px] truncate w-16 text-center transition-colors ${
                    isViewed
                      ? 'font-normal text-[#94A3B8]/75 group-hover:text-white'
                      : 'font-semibold text-white tracking-tight'
                  }`}
                >
                  {firstName}
                </span>
              </motion.div>
            );
          })}

          {/* 3. "More..." Bubble (Images 1 & 2) */}
          <div
            onClick={() => setViewIndex(0)}
            className="flex flex-col items-center gap-1.5 min-w-[68px] md:min-w-[72px] cursor-pointer group"
          >
            <div className="relative h-[66px] w-[66px] md:h-[72px] md:w-[72px] rounded-full border border-white/20 bg-white/[0.04] p-[2px] flex items-center justify-center transition-all duration-300 group-hover:border-white/40 group-hover:scale-105 shadow-md">
              <IoEllipsisHorizontal className="text-xl text-[#CBD5E1] group-hover:text-white transition-colors" />
            </div>
            <span className="text-[11px] font-medium text-[#CBD5E1]/70 group-hover:text-white transition-colors">
              More
            </span>
          </div>
        </div>
      </div>

      {/* Story Editor Modal */}
      <React.Suspense fallback={null}>
        {editorFile && (
          <StoryEditor
            file={editorFile}
            onClose={() => setEditorFile(null)}
            onPosted={() => {
              setEditorFile(null);
              load();
            }}
          />
        )}

        {/* Fullscreen Story Viewer */}
        <AnimatePresence>
          {viewIndex !== null && (
            <StoryViewer
              stories={sortedStories}
              initialIndex={viewIndex}
              onClose={() => setViewIndex(null)}
            />
          )}
        </AnimatePresence>
      </React.Suspense>
    </>
  );
}
