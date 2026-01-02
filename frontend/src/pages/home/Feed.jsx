import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import socket from "../../services/socket";
import PostCard from "../../components/posts/PostCard";
import SkeletonPost from "../../components/ui/SkeletonPost";
import { AnimatePresence, motion } from "framer-motion";
import Stories from "../../components/stories/Stories";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import FAB from "../../components/common/FAB";
import CreatePostModal from "../../components/posts/CreatePostModal";
import { useToast } from "../../components/ui/ToastProvider";
import { FaArrowUp } from "react-icons/fa";

// Utility to remove duplicates based on _id
const uniqueById = (arr) => {
  const seen = new Set();
  const out = [];
  for (const a of arr) {
    if (!a?._id) continue;
    if (!seen.has(a._id)) { 
        seen.add(a._id); 
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
  
  // Scroll to Top Button State
  const [showTopBtn, setShowTopBtn] = useState(false);
  
  // Pull to Refresh State
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const { add: addToast } = useToast();

  // --- DATA LOADING ---
  const load = useCallback(async (reset = false) => {
    if (loading) return;
    const pageToLoad = reset ? 0 : page;
    setLoading(true);
    
    try {
      const res = await API.get(`/posts/feed?page=${pageToLoad}&limit=6`);
      const newPosts = Array.isArray(res?.data) ? res.data : [];

      setPosts(prev => {
        if (reset) return uniqueById(newPosts);
        // Merge and dedupe
        return uniqueById([...prev, ...newPosts]);
      });

      if (newPosts.length < 6) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setPage(p => reset ? 1 : p + 1);
      }

    } catch (err) {
      console.error("Feed load error", err);
      // Don't disable hasMore on error, allows retry
    } finally {
      setLoading(false);
    }
  }, [page, loading]);

  // Initial Load
  useEffect(() => { load(true); }, []);

  // --- REAL-TIME UPDATES ---
  useEffect(() => {
    const onPostCreated = (ev) => {
      // Handles both Socket.io event and CustomEvent from CreatePostModal
      const newPost = ev.detail || ev; 
      
      if (newPost && newPost._id) {
        setPosts(prev => uniqueById([newPost, ...prev])); // Add to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        addToast('New post loaded!', { type: 'info' });
      } else {
        // Fallback: Reload feed if data is partial
        load(true);
      }
    };

    const onPostDeleted = (ev) => {
      const id = ev?.detail;
      if (!id) return;
      setPosts(prev => prev.filter(p => p._id !== id));
    };

    // Scheduled Post Published Event
    const onScheduled = (newPost) => {
        if(newPost) {
            setPosts(prev => uniqueById([newPost, ...prev]));
            addToast(`Scheduled post by ${newPost.user?.name || 'User'} is now live!`, { type: 'info' });
        }
    };

    window.addEventListener('postCreated', onPostCreated);
    window.addEventListener('postDeleted', onPostDeleted);
    socket.on('post:created', onPostCreated);
    socket.on('post:published', onScheduled);

    return () => {
      window.removeEventListener('postCreated', onPostCreated);
      window.removeEventListener('postDeleted', onPostDeleted);
      socket.off('post:created', onPostCreated);
      socket.off('post:published', onScheduled);
    };
  }, [load, addToast]);

  // --- SCROLL TO TOP ---
  useEffect(() => {
    const checkScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // --- PULL TO REFRESH ---
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

  // Infinite Scroll Hook
  const loaderRef = useInfiniteScroll(() => {
      if(hasMore) load();
  });

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto"> 
        
        {/* Pull Refresh Indicator */}
        <div className={`w-full flex justify-center overflow-hidden transition-all duration-300 ${refreshing ? 'h-16 py-4' : 'h-0'}`}>
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>

        {/* Stories */}
        <div className="mb-6">
          <Stories />
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          {posts.length === 0 && !loading && !hasMore && (
            <div className="text-center py-10">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Welcome to SocialApp!</h3>
                <p className="text-gray-500 mt-2">Follow users or create a post to get started.</p>
                <Link to="/explore" className="mt-4 inline-block btn-primary px-6 py-2 rounded-full">Find People</Link>
            </div>
          )}

          <AnimatePresence>
            {posts.map((p) => (
              <motion.div
                key={p._id || p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <PostCard post={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loaders */}
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

        {/* End of Feed Message */}
        {!hasMore && posts.length > 0 && (
            <div className="py-12 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full mb-2"></div>
                You're all caught up! 🎉
            </div>
        )}

        {/* Create Button */}
        <FAB onClick={() => setOpenCreate(true)} />
        
        <CreatePostModal 
            isOpen={openCreate} 
            onClose={() => setOpenCreate(false)} 
            onPosted={(newPost) => {
                if (newPost) {
                    // Handled by event listener above
                }
            }} 
        />

        {/* Scroll To Top */}
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