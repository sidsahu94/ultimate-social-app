import React, { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import PostCard from "../../components/posts/PostCard";
import FAB from "../../components/common/FAB";
import CreatePostModal from "../../components/posts/CreatePostModal";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import SkeletonPost from "../../components/ui/SkeletonPost";
import { useToast } from "../../components/ui/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";
import Stories from "../../components/stories/Stories";
import FollowSuggestions from "../discovery/FollowSuggestions";
import Trending from "../explore/Trending";

// Utility to ensure posts are unique before adding to feed (by _id or id)
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

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { add: addToast } = useToast();

  // --- 1. Load Feed Data (safer pagination + duplicate protection)
  const load = useCallback(async (reset = false) => {
    // Allow manual refresh while loading (reset can force a reload)
    if (loading && !reset) return;

    // If resetting, start from page 0. Otherwise use current page.
    const pageToLoad = reset ? 0 : page;

    try {
      setLoading(true);
      const res = await API.get(`/posts/feed?page=${pageToLoad}&limit=6`);
      const newPosts = res.data || [];

      setPosts((prev) => {
        if (reset) {
          // Fresh replace on reset
          return uniqueById(newPosts);
        }

        // Filter out any incoming posts that already exist in state
        const existingIds = new Set(prev.map(p => String(p._id || p.id)));
        const uniqueNewPosts = newPosts.filter(p => {
          const id = String(p._id || p.id || '');
          return id && !existingIds.has(id);
        });

        return uniqueById([...prev, ...uniqueNewPosts]);
      });

      setHasMore(newPosts.length > 0);
      setPage((p) => (reset ? 1 : p + 1));
    } catch (err) {
      console.error('load feed', err);
      addToast(err.userMessage || 'Failed to load feed', { type: 'error' });
      if (reset) setPosts([]); // Clear feed on hard fail when reset
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, loading, addToast]); // removed hasMore to avoid stale closures

  // --- 2. Initial Load
  useEffect(() => { load(true); }, []); // initial mount

  // --- 3. Infinite Scroll Hook
  const loaderRef = useInfiniteScroll(load, [load]);

  // --- 4. Event Listeners for Post CRUD
  useEffect(() => {
    const onPostCreated = (ev) => {
      const p = ev.detail;
      if (p) setPosts(prev => uniqueById([p, ...prev]));
      else load(true); // Hard refresh if payload is missing
    };

    const onPostDeleted = (ev) => {
      const id = ev?.detail;
      if (!id) return;
      setPosts(prev => prev.filter(p => String(p._id || p.id) !== String(id)));
    };

    window.addEventListener('postCreated', onPostCreated);
    window.addEventListener('postDeleted', onPostDeleted);

    return () => {
      window.removeEventListener('postCreated', onPostCreated);
      window.removeEventListener('postDeleted', onPostDeleted);
    };
  }, [load]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content: Stories and Feed */}
        <div className="lg:col-span-2">
          {/* Stories Section (only on small/medium screens for demo) */}
          <div className="lg:hidden mb-4">
            <Stories />
          </div>
          
          <AnimatePresence>
            {posts.map((p) => (
              // Use motion.article to wrap the PostCard to enable exit animation
              <motion.div key={p._id || p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, margin: 0 }} className="mb-4">
                <PostCard post={p} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Skeletons */}
          {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)}
          
          {/* Infinite Scroll Trigger / No More Posts Message */}
          <div ref={loaderRef} className="py-6 text-center">
            {!loading && !hasMore && posts.length > 0 && <div className="text-gray-500">You've reached the end of the feed.</div>}
            {!loading && posts.length === 0 && !hasMore && <div className="card p-6 text-gray-500">Follow more people to see posts here.</div>}
          </div>
        </div>

        {/* Sidebar (Desktop Only) */}
        <aside className="hidden lg:block space-y-6 lg:col-span-1">
          <Stories />
          
          <div className="card p-4">
            <h4 className="font-semibold text-lg mb-3 border-b pb-2">Who to follow</h4>
            <FollowSuggestions isSidebar={true} />
          </div>
          
          <div className="card p-4">
            <h4 className="font-semibold text-lg mb-3 border-b pb-2">Trends</h4>
            <Trending isSidebar={true} />
          </div>
        </aside>

        <FAB onClick={() => setOpenCreate(true)} />
        <CreatePostModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onPosted={() => load(true)} />
      </div>
    </div>
  );
};

export default Feed;
