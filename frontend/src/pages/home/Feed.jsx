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
import LiveSpacesBar from "../../components/spaces/LiveSpacesBar";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import CreatePostModal from "../../components/posts/CreatePostModal";
import { useToast } from "../../components/ui/ToastProvider";
import { FaArrowUp } from "react-icons/fa";
import useScrollRestoration from "../../hooks/useScrollRestoration"; 
import { getScrollContainer, getScrollPosition, scrollToTop as smoothScrollToTop } from "../../utils/scrollUtils"; 

const uniqueById = (arr) => {
  const seen = new Set();
  const out = [];
  for (const a of arr) {
    if (!a?._id) continue;
    if (!seen.has(a._id)) { seen.add(a._id); out.push(a); }
  }
  return out;
};

export default function Feed() {
  useScrollRestoration('feed_scroll_pos');
  
  const { user: currentUser } = useSelector((state) => state.auth);

  const [posts, setPosts] = useState([]);
  const [cursorDate, setCursorDate] = useState(null); 
  const [cursorId, setCursorId] = useState(null);     
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const { add: addToast } = useToast();
  const isFirstLoad = useRef(true);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isLoadingRef.current = loading;
  }, [loading]);

  // --- DATA LOADING ---
  const load = useCallback(async (reset = false) => {
    if (isLoadingRef.current) return;
    setLoading(true);
    
    try {
      let queryCursor = '';
      if (!reset) {
        if (cursorDate) queryCursor += `&cursorDate=${encodeURIComponent(cursorDate)}`;
        if (cursorId) queryCursor += `&cursorId=${encodeURIComponent(cursorId)}`;
      }

      const res = await API.get(`/posts/feed?limit=10${queryCursor}`);
      
      const raw = res.data;
      const newPosts = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : (raw?.posts || []));
      
      const nextCursorDate = raw?.nextCursorDate || (newPosts.length >= 10 ? newPosts[newPosts.length - 1]?.createdAt : null);
      const nextCursorId = raw?.nextCursorId || (newPosts.length >= 10 ? newPosts[newPosts.length - 1]?._id : null);

      setPosts(prev => {
        if (reset) return uniqueById(newPosts);
        return uniqueById([...prev, ...newPosts]);
      });

      setCursorDate(nextCursorDate);
      setCursorId(nextCursorId);
      setHasMore(Boolean((nextCursorDate || nextCursorId) && newPosts.length >= 10));

    } catch (err) {
      console.error("Feed load error", err);
    } finally {
      setLoading(false);
    }
  }, [cursorDate, cursorId]);

  useEffect(() => { 
      if(isFirstLoad.current) {
          isFirstLoad.current = false;
          if(posts.length === 0) load(true); 
      }
  }, [load, posts.length]);

  // --- REAL-TIME UPDATES ---
  useEffect(() => {
    const onPostCreated = (ev) => {
      const newPost = ev.detail || ev; 
      if (newPost && newPost._id) {
        setPosts(prev => uniqueById([newPost, ...prev])); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const postAuthorId = newPost.user?._id || newPost.user;
        if (currentUser && postAuthorId !== currentUser._id) {
           addToast('New post loaded!', { type: 'info' });
        }
      } else {
        load(true);
      }
    };

    const onPostDeleted = (ev) => {
      const id = ev?.detail;
      if (!id) return;
      setPosts(prev => prev.filter(p => p._id !== id));
    };

    const onScheduled = (newPost) => {
        if(newPost) {
            setPosts(prev => uniqueById([newPost, ...prev]));
            addToast(`Scheduled post is live!`, { type: 'info' });
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
  }, [load, addToast, currentUser]);

  // --- SCROLL TO TOP ---
  useEffect(() => {
    const container = getScrollContainer();
    const checkScroll = () => setShowTopBtn(getScrollPosition() > 400);
    container.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('scroll', checkScroll);
    };
  }, []);

  const handleScrollToTop = () => smoothScrollToTop(true);

  // --- PULL TO REFRESH ---
  const handleTouchStart = (e) => {
    if (getScrollPosition() <= 0) setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const y = e.touches[0].clientY;
    if (getScrollPosition() <= 0 && y - startY > 70 && !refreshing) {
      setRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(50);
      
      load(true).then(() => {
          setTimeout(() => setRefreshing(false), 800);
      });
    }
  };

  useEffect(() => {
    document.body.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.body.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      document.body.removeEventListener('touchstart', handleTouchStart);
      document.body.removeEventListener('touchmove', handleTouchMove);
    };
  }, [startY, refreshing, load]);

  const loaderRef = useInfiniteScroll(() => {
      if(hasMore && !isLoadingRef.current) load(false);
  });

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <div className="max-w-3xl mx-auto"> 
        
        <div className={`w-full flex justify-center overflow-hidden transition-all duration-300 ${refreshing ? 'h-16 py-4' : 'h-0'}`}>
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00F2FE]"></div>
        </div>

        <div className="mb-4">
          <Stories />
        </div>

        <LiveSpacesBar />

        <div className="space-y-6">
          {posts.length === 0 && !loading && !hasMore && (
            <div className="text-center py-12 rounded-[28px] border border-white/10 bg-[#070B14]/90 backdrop-blur-xl p-8 shadow-2xl">
                <h3 className="font-display font-bold text-xl text-[#F7F7FC]">Welcome to Socialo</h3>
                <p className="text-[#CBD5E1] mt-2 text-sm max-w-sm mx-auto">Follow active creators or share your first moment with the community.</p>
                <Link to="/explore" className="mt-5 inline-block px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white text-xs font-bold shadow-md hover:opacity-95 transition">Find People</Link>
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

        {loading && (
          <div className="mt-6 space-y-6">
            <SkeletonPost />
            <SkeletonPost />
          </div>
        )}

        {hasMore && !loading && (
            <div ref={loaderRef} className="h-24 flex items-center justify-center text-gray-400 text-sm font-medium">
                Loading more...
            </div>
        )}

        {!hasMore && posts.length > 0 && (
            <div className="py-12 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full mb-2"></div>
                You're all caught up! 🎉
            </div>
        )}

        <CreatePostModal 
            isOpen={openCreate} 
            onClose={() => setOpenCreate(false)} 
            onPosted={() => {
                setOpenCreate(false);
                load(true);
            }} 
        />

        <AnimatePresence>
            {showTopBtn && (
                <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    onClick={handleScrollToTop}
                    className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 bg-[#070B14]/90 border border-white/20 text-[#00F2FE] p-3.5 rounded-full shadow-2xl backdrop-blur-xl hover:bg-[#0A111E] hover:border-[#00F2FE]/40 transition"
                >
                    <FaArrowUp />
                </motion.button>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}
