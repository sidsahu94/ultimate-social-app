import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import socket from "../../services/socket"; // 🔥 Standard Import for Socket
import PostCard from "../../components/posts/PostCard";
import SkeletonPost from "../../components/ui/SkeletonPost";
import { AnimatePresence, motion } from "framer-motion";
import Stories from "../../components/stories/Stories";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import FAB from "../../components/common/FAB";
import CreatePostModal from "../../components/posts/CreatePostModal";
import { useToast } from "../../components/ui/ToastProvider";
import { FaArrowUp } from "react-icons/fa";

// Utility to ensure posts are unique based on ID
const uniqueById = (arr) => {
  const seen = new Set();
  const out = [];
  for (const a of arr) {
    const id = a && (a._id || a.id);
    if (!id) { out.push(a); continue; }
    if (!seen.has(String(id))) {
      seen.add(String(id));
      out.push(a);
    }
  }
  return out;
};

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { add: addToast } = useToast();

  // Scroll to Top State
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Refs for consistent state inside callbacks/event listeners
  const pageRef = useRef(page);
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  // Scroll Restoration
  useEffect(() => {
    const savedPos = sessionStorage.getItem('feed_scroll_y');
    if (savedPos) {
        setTimeout(() => window.scrollTo(0, parseInt(savedPos)), 50);
    }
    return () => {
        sessionStorage.setItem('feed_scroll_y', window.scrollY);
    };
  }, []);

  // Scroll Listener for Top Button
  useEffect(() => {
    const checkScroll = () => {
        if (window.scrollY > 400) setShowTopBtn(true);
        else setShowTopBtn(false);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- DATA LOADING ---
  const load = useCallback(async (reset = false) => {
    if (loadingRef.current || (!reset && !hasMoreRef.current)) return;

    const pageToLoad = reset ? 0 : pageRef.current;
    
    try {
      setLoading(true);
      const res = await API.get(`/posts/feed?page=${pageToLoad}&limit=6`);
      const newPosts = Array.isArray(res?.data) ? res.data : [];

      setPosts(prev => {
        if (reset) return uniqueById(newPosts);
        const existing = new Set(prev.map(p => String(p._id || p.id)));
        const filtered = newPosts.filter(p => {
          const id = String(p._id || p.id || "");
          return id && !existing.has(id);
        });
        return uniqueById([...prev, ...filtered]);
      });

      if (newPosts.length < 6) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setPage(prev => (reset ? 1 : prev + 1));
      }

    } catch (err) {
      console.error("Feed load error", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  // --- PULL TO REFRESH LOGIC ---
  const [startY, setStartY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const y = e.touches[0].clientY;
    if (window.scrollY === 0 && y - startY > 70 && !refreshing) {
      setRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(50);
      
      load(true).then(() => {
          setTimeout(() => setRefreshing(false), 800);
      });
    }
  };

  useEffect(() => {
    document.body.addEventListener('touchstart', handleTouchStart);
    document.body.addEventListener('touchmove', handleTouchMove);
    return () => {
      document.body.removeEventListener('touchstart', handleTouchStart);
      document.body.removeEventListener('touchmove', handleTouchMove);
    };
  }, [startY, refreshing, load]);

  // --- INFINITE SCROLL ---
  const loaderRef = useInfiniteScroll(() => {
    if (hasMoreRef.current && !loadingRef.current) {
        load();
    }
  });

  // --- REAL-TIME UPDATES ---
  useEffect(() => {
    const onPostCreated = (ev) => {
      if (ev.detail && ev.detail._id) {
        setPosts(prev => uniqueById([ev.detail, ...prev]));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        load(true);
      }
    };

    const onPostDeleted = (ev) => {
      const id = ev?.detail;
      if (!id) return;
      setPosts(prev => prev.filter(p => String(p._id) !== String(id)));
    };

    // 🔥 NEW: Listen for Scheduled Posts going live
    const onScheduledPublish = (newPost) => {
        if(newPost) {
            setPosts(prev => uniqueById([newPost, ...prev]));
            addToast(`New post from ${newPost.user?.name || 'someone'}`, { type: 'info' });
        }
    };

    window.addEventListener('postCreated', onPostCreated);
    window.addEventListener('postDeleted', onPostDeleted);
    socket.on('post:published', onScheduledPublish);

    return () => {
      window.removeEventListener('postCreated', onPostCreated);
      window.removeEventListener('postDeleted', onPostDeleted);
      socket.off('post:published', onScheduledPublish);
    };
  }, [load, addToast]);

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto"> 
        
        {/* Pull-to-Refresh Spinner */}
        <div className={`w-full flex justify-center overflow-hidden transition-all duration-300 ${refreshing ? 'h-16 py-4' : 'h-0'}`}>
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>

        {/* Stories Section */}
        <div className="mb-6">
          <Stories />
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          
          {/* Empty State Banner */}
          {posts.length === 0 && !loading && !hasMore && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className="w-32 h-32 bg-indigo-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <span className="text-6xl animate-bounce">👋</span>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Welcome to SocialApp!</h2>
              <p className="text-gray-500 max-w-xs mb-8 leading-relaxed">
                Your feed is looking a bit quiet. Follow some creators or post your first thought to get started!
              </p>
              <Link to="/explore" className="btn-primary px-8 py-3 rounded-full text-lg shadow-lg hover:shadow-xl transition-transform hover:-translate-y-1">
                Find People
              </Link>
            </div>
          )}

          <AnimatePresence>
            {posts.map((p) => (
              <motion.div
                key={p._id || p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <PostCard post={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="mt-6 space-y-6">
            <SkeletonPost />
            <SkeletonPost />
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && !loading && (
            <div ref={loaderRef} className="h-24 flex items-center justify-center text-gray-400 text-sm font-medium">
                Loading more...
            </div>
        )}

        {/* End of Feed */}
        {!hasMore && posts.length > 0 && (
            <div className="py-12 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full mb-2"></div>
                You're all caught up! 🎉
            </div>
        )}

        {/* Global Components */}
        <FAB onClick={() => setOpenCreate(true)} />
        
        <CreatePostModal 
            isOpen={openCreate} 
            onClose={() => setOpenCreate(false)} 
            onPosted={(newPost) => {
                if (newPost) {
                    window.dispatchEvent(new CustomEvent('postCreated', { detail: newPost }));
                }
            }} 
        />

        {/* Scroll to Top Button */}
        <AnimatePresence>
            {showTopBtn && (
                <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 bg-gray-800 dark:bg-white text-white dark:text-gray-900 p-3 rounded-full shadow-xl hover:bg-gray-700 dark:hover:bg-gray-200 transition"
                >
                    <FaArrowUp />
                </motion.button>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}