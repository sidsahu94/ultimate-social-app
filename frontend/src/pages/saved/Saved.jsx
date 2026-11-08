// frontend/src/pages/saved/Saved.jsx
import React, { useEffect, useState, useCallback } from 'react';
import API from '../../services/api';
import PostCard from '../../components/posts/PostCard';
import { useToast } from '../../components/ui/ToastProvider';
import { useSelector } from 'react-redux';
import Spinner from '../../components/common/Spinner';
import useInfiniteScroll from '../../hooks/useInfiniteScroll'; 
import { FaBookmark } from 'react-icons/fa';

export default function SavedPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const { add: addToast } = useToast();
    const myId = useSelector(s => s.auth?.user?._id || localStorage.getItem('meId'));

    const load = useCallback(async (isReset = false) => {
        if (!myId) return;
        if (loadingMore) return;
        
        const pageToLoad = isReset ? 0 : page;
        if (isReset) setLoading(true);
        else setLoadingMore(true);

        try {
            let newPosts = [];
            try {
                const r = await API.get(`/extra/save/${myId}?page=${pageToLoad}&limit=12`);
                const raw = r.data?.data || r.data;
                newPosts = Array.isArray(raw) ? raw : [];
            } catch (_) {
                const r2 = await API.get('/posts/bookmarks/me');
                const raw2 = r2.data?.data || r2.data;
                newPosts = Array.isArray(raw2) ? raw2 : [];
            }

            if (newPosts.length < 12) setHasMore(false);
            
            setPosts(prev => isReset ? newPosts : [...prev, ...newPosts]);
            setPage(p => isReset ? 1 : p + 1);

        } catch (err) {
            addToast('Failed to load saved posts', { type: 'error' });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [myId, page, loadingMore, addToast]);

    useEffect(() => { load(true); }, [myId]);

    const loaderRef = useInfiniteScroll(() => { if(hasMore) load(); });

    if (!myId) return <div className="p-8 text-center text-[#CBD5E1]">Please login to view bookmarks.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
            <div className="mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-1">
                    <FaBookmark /> Curated Collection
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
                    Saved Editorial Artifacts<span className="text-[#00F2FE]">.</span>
                  </h1>
                </div>
            </div>
            
            {loading && <div className="p-12 flex justify-center"><Spinner /></div>}

            {!loading && posts.length === 0 && (
                <div className="p-16 text-center text-[#CBD5E1] bg-[#070B14]/40 border border-dashed border-white/10 rounded-3xl backdrop-blur-xl">
                    <FaBookmark className="mx-auto text-4xl mb-3 text-[#A5A9BB] opacity-30" />
                    <p className="font-semibold text-sm">No saved posts yet.</p>
                    <p className="text-xs text-[#A5A9BB] mt-1">Bookmark posts from your feed to revisit them anytime.</p>
                </div>
            )}

            <div className="space-y-6">
                {posts.map(p => <PostCard key={p._id} post={p} />)}
            </div>

            {hasMore && !loading && (
                <div ref={loaderRef} className="h-20 flex items-center justify-center">
                    <Spinner />
                </div>
            )}
        </div>
    );
}
