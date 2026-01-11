// frontend/src/pages/saved/Saved.jsx
import React, { useEffect, useState, useCallback } from 'react';
import API from '../../services/api';
import PostCard from '../../components/posts/PostCard';
import { useToast } from '../../components/ui/ToastProvider';
import { useSelector } from 'react-redux';
import Spinner from '../../components/common/Spinner';
import useInfiniteScroll from '../../hooks/useInfiniteScroll'; 

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
            // 🔥 Updated API call with pagination
            const r = await API.get(`/extra/save/${myId}?page=${pageToLoad}&limit=12`); 
            const newPosts = r.data || [];

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

    if (!myId) return <div className="p-4 text-center">Please login.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 pb-20">
            <h2 className="text-xl font-bold mb-4 border-b dark:border-gray-800 pb-2 flex items-center gap-2">
                💾 Saved Posts
            </h2>
            
            {loading && <div className="p-10 flex justify-center"><Spinner /></div>}

            {!loading && posts.length === 0 && (
                <div className="card p-10 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    No saved posts yet.
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