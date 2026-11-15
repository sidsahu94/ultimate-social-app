// frontend/src/pages/home/Feed.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import API from "../../services/api";
import socket from "../../services/socket";
import PostCard from "../../components/posts/PostCard";
import SkeletonPost from "../../components/ui/SkeletonPost";
import { AnimatePresence, motion } from "framer-motion";
import Stories from "../../components/stories/Stories";
import HeroGreetingCard from "../../components/home/HeroGreetingCard";
import CreatePostInline from "../../components/posts/CreatePostInline";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import CreatePostModal from "../../components/posts/CreatePostModal";
import { useToast } from "../../components/ui/ToastProvider";
import { FaArrowUp } from "react-icons/fa";
import { IoRefreshOutline, IoSparkles } from "react-icons/io5";
import useScrollRestoration from "../../hooks/useScrollRestoration"; 
import { getScrollContainer, getScrollPosition, scrollToTop as smoothScrollToTop } from "../../utils/scrollUtils"; 

// Curated Showcase Feed Posts to ensure the feed is rich & never blank (Matching Images 1, 2, 3)
const SHOWCASE_POSTS = [
  {
    _id: "showcase_post_mumbai",
    user: {
      _id: "demo_u_sidhanta",
      name: "Sidhanta Manoj Sahu",
      username: "sidhanta",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
      isVerified: true
    },
    content: "City lights, calm mind, and endless possibilities ✨\n#Mumbai #NightVibes #Cityscape #Photography",
    mediaUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
    likes: ["demo1", "demo2", "demo3", "demo4"],
    comments: [
      { _id: "c1", text: "Incredible shot of the Sea Link!", user: { name: "Riya" } },
      { _id: "c2", text: "The dusk colors are mesmerizing.", user: { name: "Aman" } }
    ],
    sharesCount: 76,
    views: 2400,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    _id: "showcase_post_mountains",
    user: {
      _id: "demo_u_aman",
      name: "Aman Verma",
      username: "aman",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      isVerified: true
    },
    content: "Nature heals everything 🌿 Sunrise expedition in the high ranges.\n#Wanderlust #Mountains #Explore #Adventure",
    mediaUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    likes: ["demo1", "demo2"],
    comments: [],
    sharesCount: 32,
    views: 1820,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    _id: "showcase_post_thought_1",
    user: {
      _id: "demo_u_elena",
      name: "Elena Vance",
      username: "elenavance",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      isVerified: true
    },
    content: "The architecture of stillness 🏛️✨\n\nTrue focus isn't about ignoring distractions—it's about giving yourself completely to what creates lasting meaning. We design better when we protect our cognitive quiet.\n\n#DeepWork #Architecture #DesignPhilosophy #SocialVerse",
    mediaUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    likes: ["demo1", "demo2", "demo3"],
    comments: [
      { _id: "c3", text: "This resonates deeply with our studio practice.", user: { name: "Marcus" } }
    ],
    sharesCount: 54,
    views: 3100,
    createdAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
  },
  {
    _id: "showcase_post_poll_1",
    user: {
      _id: "demo_u_aria",
      name: "Aria Chen",
      username: "ariachen",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
      isVerified: true
    },
    content: "Quick pulse check for product designers and creators 👇 What visual paradigm defines the next 5 years of user experience?",
    poll: {
      question: "Which UI paradigm leads the next generation?",
      options: [
        { text: "Specular Glassmorphism & Depth", votes: ["u1", "u2", "u3", "u4", "u5"] },
        { text: "Ultra-High Contrast Cyber Noir", votes: ["u6", "u7", "u8"] },
        { text: "Spatial Web3 & Spatial Audio", votes: ["u9", "u10"] },
        { text: "Dynamic AI Fluid Interfaces", votes: ["u11", "u12", "u13", "u14", "u15", "u16"] },
      ]
    },
    likes: ["demo1", "demo2", "demo3", "demo4", "demo5"],
    comments: [
      { _id: "c4", text: "Fluid AI interfaces with contextual lighting are the future without question.", user: { name: "Elena" } }
    ],
    sharesCount: 88,
    views: 4500,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },
  {
    _id: "showcase_post_macro",
    user: {
      _id: "demo_u_ishita",
      name: "Ishita Roy",
      username: "ishitaroy",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      isVerified: true
    },
    content: "Macro morning dew drops catching early sunlight 🍃💧 Nature is the greatest graphic designer in the universe.\n\n#MacroPhotography #NatureArt #Emerald #MorningVibes",
    mediaUrl: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80",
    likes: ["demo1", "demo2", "demo3"],
    comments: [],
    sharesCount: 41,
    views: 2950,
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
  {
    _id: "showcase_post_tech",
    user: {
      _id: "demo_u_marcus",
      name: "Marcus Sterling",
      username: "marcus",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
      isVerified: true
    },
    content: "Midnight in Tokyo. Neon reflections and cyber kinetics after a long architecture sprint 🌃⚡ Building the next generation of social connectivity.\n\n#TokyoNights #CyberAesthetic #Developer #BuildInPublic",
    mediaUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
    likes: ["demo1", "demo2", "demo3", "demo4"],
    comments: [
      { _id: "c5", text: "That contrast is pure perfection.", user: { name: "Sidhanta" } }
    ],
    sharesCount: 92,
    views: 5200,
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
  {
    _id: "showcase_post_cove",
    user: {
      _id: "demo_u_kai",
      name: "Kai Sterling",
      username: "kaisterling",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80",
      isVerified: false
    },
    content: "Turquoise lagoon secret cove surrounded by lush alpine pines 🌲🌊 Disconnecting to reconnect with the physical world.\n\n#Coastlines #Alpine #TravelMoments #Serenity",
    mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    likes: ["demo1", "demo2"],
    comments: [],
    sharesCount: 29,
    views: 2100,
    createdAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
  },
  {
    _id: "showcase_post_founder_thought",
    user: {
      _id: "demo_u_julian",
      name: "Julian Hayes",
      username: "julianhayes",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      isVerified: true
    },
    content: "Building in public teaches you humility faster than any business school ever could 🚀\n\n1. Launch before you feel 100% ready.\n2. Treat customer feedback as gold ore.\n3. Consistent small improvements compound exponentially.\n\nWhat are you shipping this week?\n\n#FounderJourney #Startups #BuildInPublic #Creators",
    likes: ["demo1", "demo2", "demo3", "demo4", "demo5", "demo6"],
    comments: [
      { _id: "c6", text: "Shipping our spatial audio engine!", user: { name: "Aria" } },
      { _id: "c7", text: "Consistency > perfection every time.", user: { name: "Aman" } }
    ],
    sharesCount: 114,
    views: 6800,
    createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
  }
];

export default function Feed() {
  useScrollRestoration('feed_scroll_pos');
  
  const { user: currentUser } = useSelector((state) => state.auth);

  const [posts, setPosts] = useState(SHOWCASE_POSTS);
  const [feedType, setFeedType] = useState('forYou');
  const [cursorDate, setCursorDate] = useState(null); 
  const [cursorId, setCursorId] = useState(null);     
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [createInitialTab, setCreateInitialTab] = useState('post');
  const [hasMore, setHasMore] = useState(true);
  
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newUpdatesCount, setNewUpdatesCount] = useState(0);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(() => new Date());
  const infiniteCycleRef = useRef(1);
  const startYRef = useRef(0);

  const { add: addToast } = useToast();
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isLoadingRef.current = initialLoading || isFetchingMore;
  }, [initialLoading, isFetchingMore]);

    // --- DATA LOADING WITH TRUE INFINITE SCROLL ---
  const load = useCallback(async (reset = false, customFeedType = null) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    if (reset) {
      setInitialLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    
    try {
      let queryCursor = '';
      if (!reset) {
        if (cursorDate) queryCursor += `&cursorDate=${encodeURIComponent(cursorDate)}`;
        if (cursorId) queryCursor += `&cursorId=${encodeURIComponent(cursorId)}`;
      }

      const activeType = customFeedType !== null ? customFeedType : feedType;
      const followingParam = activeType === 'following' ? '&following=true' : '';
      const res = await API.get(`/posts/feed?limit=10${followingParam}${queryCursor}`);
      
      const raw = res.data;
      const backendPosts = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : (raw?.posts || []));
      
      if (reset) {
        const seen = new Set();
        const combined = [];
        for (const p of [...backendPosts, ...SHOWCASE_POSTS]) {
          if (!seen.has(p._id)) {
            seen.add(p._id);
            combined.push(p);
          }
        }
        setPosts(combined);
        setHasMore(true);
        setLastUpdatedTime(new Date());
        if (backendPosts.length > 0) {
          const last = backendPosts[backendPosts.length - 1];
          setCursorDate(last?.createdAt);
          setCursorId(last?._id);
        }
      } else {
        if (backendPosts.length > 0) {
          setPosts((prev) => {
            const seen = new Set(prev.map(p => p._id));
            const fresh = backendPosts.filter(p => !seen.has(p._id));
            return [...prev, ...fresh];
          });
          const last = backendPosts[backendPosts.length - 1];
          setCursorDate(last?.createdAt);
          setCursorId(last?._id);
          setHasMore(true);
        } else {
          // --- TRUE INFINITE SCROLL DISCOVERY STREAM ---
          // Seamlessly cycle community & showcase discovery stream with unique keys so the stream never stops
          setPosts((prev) => {
            const cycle = (infiniteCycleRef.current = (infiniteCycleRef.current || 1) + 1);
            const pool = prev.length > 0 ? prev.slice(0, 8) : SHOWCASE_POSTS;
            const freshBatch = pool.map((p, idx) => ({
              ...p,
              _id: `discovery_${p._id}_${cycle}_${idx}`,
              isDiscovery: true,
              views: (p.views || 250) + cycle * 42,
            }));
            return [...prev, ...freshBatch];
          });
          setHasMore(true);
        }
      }
    } catch (_) {
      if (reset) {
        setPosts(SHOWCASE_POSTS);
      }
      setHasMore(true);
    } finally {
      setInitialLoading(false);
      setIsFetchingMore(false);
      isLoadingRef.current = false;
    }
  }, [cursorDate, cursorId, feedType]);

  useEffect(() => {
    load(true);
  }, []);

  // --- REAL-TIME POST SOCKET LISTENER & NEW UPDATES BADGE ---
  useEffect(() => {
    if (!socket) return;
    const handleNewPost = (post) => {
      if (getScrollPosition() < 120) {
        setPosts((prev) => [post, ...prev.filter((p) => p._id !== post._id)]);
        setLastUpdatedTime(new Date());
      } else {
        setNewUpdatesCount((prev) => prev + 1);
      }
    };
    socket.on('post:created', handleNewPost);
    return () => socket.off('post:created', handleNewPost);
  }, []);

  // --- PERIODIC BACKGROUND CHECK FOR FRESH UPDATES ---
  useEffect(() => {
    const checkUpdates = async () => {
      if (document.visibilityState !== 'visible' || !posts[0]?.createdAt) return;
      try {
        const res = await API.get('/posts/feed?limit=3');
        const latest = Array.isArray(res.data?.data) ? res.data.data : [];
        if (latest.length > 0 && posts[0]?.createdAt) {
          const latestServerTime = new Date(latest[0].createdAt).getTime();
          const currentFirstTime = new Date(posts[0].createdAt).getTime();
          if (latestServerTime > currentFirstTime) {
            setNewUpdatesCount((prev) => Math.max(prev, latest.length));
          }
        }
      } catch (_) {}
    };

    const interval = setInterval(checkUpdates, 45000);
    return () => clearInterval(interval);
  }, [posts]);

  // --- SCROLL TO TOP LISTENER (Throttled via requestAnimationFrame) ---
  useEffect(() => {
    const container = getScrollContainer();
    let ticking = false;

    const checkScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const isScrolled = getScrollPosition() > 400;
          setShowTopBtn((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('scroll', checkScroll);
    };
  }, []);

  const handleScrollToTop = () => smoothScrollToTop(true);

  // --- PULL TO REFRESH (Hardware Accelerated & Zero Redundant Re-renders) ---
  const loadRef = useRef(load);
  const refreshingRef = useRef(refreshing);
  useEffect(() => {
    loadRef.current = load;
    refreshingRef.current = refreshing;
  }, [load, refreshing]);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (getScrollPosition() <= 0) startYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      const y = e.touches[0].clientY;
      if (getScrollPosition() <= 0 && y - startYRef.current > 70 && !refreshingRef.current) {
        setRefreshing(true);
        if (navigator.vibrate) navigator.vibrate(50);
        if (loadRef.current) {
          loadRef.current(true).finally(() => {
            setTimeout(() => setRefreshing(false), 600);
          });
        }
      }
    };

    document.body.addEventListener('touchstart', onTouchStart, { passive: true });
    document.body.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      document.body.removeEventListener('touchstart', onTouchStart);
      document.body.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const loaderRef = useInfiniteScroll(() => {
    if (hasMore && !isLoadingRef.current) load(false);
  });

  const handleFeedTypeChange = (type) => {
    setFeedType(type);
    setCursorDate(null);
    setCursorId(null);
    load(true, type);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      <div className="w-full"> 
        {/* Pull to Refresh Dynamic 3D Infinity Indicator */}
        <div className={`w-full flex justify-center items-center overflow-hidden transition-all duration-300 ${refreshing ? 'h-20 py-3' : 'h-0'}`}>
          <div className="relative flex items-center justify-center">
            <div className="absolute h-10 w-10 rounded-full bg-[#00F2FE]/30 blur-xl animate-pulse" />
            <motion.div
              animate={{ rotate: 360, scale: [0.92, 1.08, 0.92] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
              className="relative flex items-center justify-center p-2.5 rounded-2xl border border-[#00F2FE]/40 bg-[#070B14]/90 shadow-lg shadow-[#00F2FE]/25"
            >
              <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
                <path
                  d="M30 50 C15 35, 15 65, 30 50 C45 35, 55 65, 70 50 C85 35, 85 65, 70 50 C55 35, 45 65, 30 50 Z"
                  stroke="url(#pullGlow)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="pullGlow" x1="0" y1="0" x2="100" y2="100">
                    <stop offset="0%" stopColor="#00F2FE" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </div>
        </div>

        {/* 1. Panoramic Mountain Greeting Banner (Matching Images 1, 2, 3) */}
        <HeroGreetingCard />

        {/* 2. Stories Bar with Glowing Theme Rings (Matching Images 1, 2, 3) */}
        <Stories />

        {/* 3. Inline Create Post Glass Card (Matching Images 1, 2, 3) */}
        <CreatePostInline 
          onOpenModal={() => setOpenCreate(true)} 
          onSelectTab={(tab) => setCreateInitialTab(tab)}
        />

        {/* Feed Scope Selector: For You vs Following */}
        <div className="flex items-center justify-between gap-3 mb-4 mt-2 px-1">
          <div className="flex items-center gap-1.5 p-1 bg-[#070B14]/80 border border-white/10 rounded-2xl backdrop-blur-xl shadow-lg">
            <button
              type="button"
              onClick={() => handleFeedTypeChange('forYou')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                feedType === 'forYou'
                  ? 'bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white shadow-md'
                  : 'text-[#CBD5E1]/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>✨ For You</span>
            </button>
            <button
              type="button"
              onClick={() => handleFeedTypeChange('following')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                feedType === 'following'
                  ? 'bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white shadow-md'
                  : 'text-[#CBD5E1]/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>👥 Following</span>
            </button>
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#00F2FE] uppercase hidden sm:inline-block bg-[#00F2FE]/10 px-2.5 py-1 rounded-full border border-[#00F2FE]/20">
            {feedType === 'following' ? 'Network Stream' : 'Neural Stream'}
          </span>
        </div>

        {/* Floating "New Updates Available" Interactive Banner */}
        <AnimatePresence>
          {newUpdatesCount > 0 && (
            <motion.button
              initial={{ opacity: 0, y: -25, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              onClick={() => {
                smoothScrollToTop(true);
                setNewUpdatesCount(0);
                load(true);
              }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#00F2FE]/95 via-[#0A84FF]/95 to-[#7928CA]/95 text-white text-xs font-bold shadow-[0_8px_30px_rgba(0,242,254,0.45)] backdrop-blur-xl border border-white/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <span>{newUpdatesCount} new {newUpdatesCount === 1 ? 'post' : 'posts'} available • Tap to view ↑</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Always-Visible Live Stream & Update Status Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 mb-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F2FE] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00F2FE]" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                Live Infinite Stream
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 font-medium">LIVE</span>
              </span>
              <span className="text-[10px] text-white/50">
                Updated {lastUpdatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Infinite scroll active
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setNewUpdatesCount(0);
              load(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-[#00F2FE]/20 text-[#00F2FE] text-xs font-semibold border border-white/10 hover:border-[#00F2FE]/40 transition-all cursor-pointer group shadow-sm active:scale-95"
            title="Refresh feed with latest updates"
          >
            <IoRefreshOutline className={`text-sm transition-transform duration-500 ${initialLoading || refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            <span>Update Now</span>
          </button>
        </div>

        {/* 4. Feed Stream */}
        <div className="space-y-6">
          {posts.map((p) => (
            <div key={p._id || p.id}>
              <PostCard post={p} />
            </div>
          ))}
        </div>

        {initialLoading && posts.length === 0 && (
          <div className="mt-6 space-y-6">
            <SkeletonPost />
            <SkeletonPost />
          </div>
        )}

        {/* Infinite Scroll Continuous Sentinel */}
        <div 
          ref={loaderRef} 
          className="py-8 flex flex-col items-center justify-center gap-2 text-center select-none"
        >
          {isFetchingMore ? (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#070B14]/90 border border-[#00F2FE]/40 text-xs font-mono text-[#00F2FE] shadow-[0_0_20px_rgba(0,242,254,0.25)]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-3.5 h-3.5 border-2 border-[#00F2FE] border-t-transparent rounded-full"
              />
              <span>Loading infinite moments...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-white/35 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FE]/60 animate-ping" />
              <span>Infinite Stream Active</span>
            </div>
          )}
        </div>

        {/* Create Post Modal */}
        <CreatePostModal 
          isOpen={openCreate} 
          onClose={() => setOpenCreate(false)} 
          initialTab={createInitialTab}
          onPosted={() => {
            setOpenCreate(false);
            load(true);
          }} 
        />

        {/* Scroll To Top Floating Pill */}
        <AnimatePresence>
          {showTopBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={handleScrollToTop}
              className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 bg-[#070B14]/90 border border-white/20 text-[#00F2FE] p-3.5 rounded-full shadow-2xl backdrop-blur-xl hover:bg-[#0A111E] hover:border-[#00F2FE]/40 transition cursor-pointer"
            >
              <FaArrowUp />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
