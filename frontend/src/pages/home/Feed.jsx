// frontend/src/pages/home/Feed.jsx
import React, { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import PostCard from "../../components/posts/PostCard";
import FAB from "../../components/common/FAB";
import CreatePostModal from "../../components/posts/CreatePostModal";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import SkeletonPost from "../../components/ui/SkeletonPost";
import { useToast } from "../../components/ui/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";

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
  const { add } = useToast();

  const load = useCallback(async () => {
    if (loading || !hasMore) return;
    try {
      setLoading(true);
      const res = await API.get(`/posts/feed?page=${page}&limit=6`);
      const data = res.data || [];
      setPosts(prev => uniqueById([...prev, ...data]));
      setHasMore(data.length > 0);
      setPage(p => p + 1);
    } catch (err) {
      console.error('load feed', err);
      add('Failed to load feed', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, add]);

  useEffect(() => { load(); }, []);

  // infinite loader
  const loaderRef = useInfiniteScroll(load, [load]);

  // when a new post is created - prepend immediately
  useEffect(() => {
    const onPostCreated = (ev) => {
      const p = ev.detail;
      if (p) setPosts(prev => uniqueById([p, ...prev]));
      else {
        // if no detail, refresh feed
        setPage(0);
        setPosts([]);
        setHasMore(true);
        // next microtask load
        setTimeout(() => load(), 30);
      }
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-900">
      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnimatePresence>
            {posts.map((p) => (
              <motion.div key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PostCard post={p} />
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)}
          <div ref={loaderRef} className="py-6 text-center">{!hasMore && <div className="text-gray-500">No more posts</div>}</div>
        </div>

        <aside className="hidden lg:block space-y-4">
          <div className="card p-4">
            <h4 className="font-semibold">Who to follow</h4>
            <p className="text-sm text-gray-500">Suggestions curated for you.</p>
          </div>
          <div className="card p-4">
            <h4 className="font-semibold">Trends</h4>
            <p className="text-sm text-gray-500">See trending hashtags and topics.</p>
          </div>
        </aside>

        <FAB onClick={() => setOpenCreate(true)} />
        <CreatePostModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onPosted={() => { setPage(0); setPosts([]); load(); }} />
      </div>
    </div>
  );
};

export default Feed;
