// frontend/src/pages/home/Feed.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import API from "../../services/api";
import PostCard from "../../components/posts/PostCard";
import SkeletonPost from "../../components/ui/SkeletonPost";
import { AnimatePresence, motion } from "framer-motion";
import Stories from "../../components/stories/Stories";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import FAB from "../../components/common/FAB";
import CreatePostModal from "../../components/posts/CreatePostModal";
import { useToast } from "../../components/ui/ToastProvider";

// Utility to ensure posts are unique
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

  const pageRef = useRef(page);
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  const load = useCallback(async (reset = false) => {
    // If already loading or no more posts, stop.
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

      // ✅ FIX: Strict check to stop flickering
      // If we got fewer posts than asked for, we are at the end.
      if (newPosts.length < 6) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setPage(prev => (reset ? 1 : prev + 1));
      }

    } catch (err) {
      console.error("Feed load error", err);
      setHasMore(false); // Stop trying on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => { load(true); }, [load]);
// Add this logic inside your Feed component (before return)

// --- PULL TO REFRESH LOGIC ---
const [startY, setStartY] = useState(0);
const [refreshing, setRefreshing] = useState(false);

const handleTouchStart = (e) => {
  if (window.scrollY === 0) setStartY(e.touches[0].clientY);
};

const handleTouchMove = (e) => {
  const y = e.touches[0].clientY;
  if (window.scrollY === 0 && y - startY > 50 && !refreshing) {
    setRefreshing(true);
    load(true).then(() => {
        setTimeout(() => setRefreshing(false), 1000);
    });
  }
};

useEffect(() => {
  window.addEventListener('touchstart', handleTouchStart);
  window.addEventListener('touchmove', handleTouchMove);
  return () => {
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
  };
}, [startY, refreshing, load]);

// Add this visually at the top of your JSX inside the main div
{refreshing && (
  <div className="w-full flex justify-center py-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
  </div>
)}
  // Infinite Scroll Hook
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
      } else {
        load(true);
      }
    };

    const onPostDeleted = (ev) => {
      const id = ev?.detail;
      if (!id) return;
      setPosts(prev => prev.filter(p => String(p._id) !== String(id)));
    };

    window.addEventListener('postCreated', onPostCreated);
    window.addEventListener('postDeleted', onPostDeleted);
    return () => {
      window.removeEventListener('postCreated', onPostCreated);
      window.removeEventListener('postDeleted', onPostDeleted);
    };
  }, [load]);

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto"> 
        
        {/* Stories */}
        <div className="mb-6">
          <Stories />
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {posts.length === 0 && !loading && !hasMore && (
            <div className="card p-6 text-gray-500 text-center">
                Follow people to see their posts here!
            </div>
          )}

          <AnimatePresence>
            {posts.map((p) => (
              <motion.div
                key={p._id || p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <PostCard post={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loader */}
        {loading && (
          <div className="mt-6 space-y-6">
            <SkeletonPost />
            <SkeletonPost />
          </div>
        )}

        {/* Trigger for Infinite Scroll */}
        {/* Only render if we have more, to prevent "bouncing" against the bottom */}
        {hasMore && !loading && (
            <div ref={loaderRef} className="h-20 flex items-center justify-center text-gray-400 text-sm">
                Loading more...
            </div>
        )}

        {!hasMore && posts.length > 0 && (
            <div className="py-8 text-center text-gray-400 text-sm">
                You're all caught up! 🎉
            </div>
        )}

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
      </div>
    </div>
  );
}