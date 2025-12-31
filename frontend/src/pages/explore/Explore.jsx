import React, { useEffect, useState, useCallback, useRef } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import LazyImage from "../../components/ui/LazyImage";
import { Link, useSearchParams } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../components/ui/ToastProvider";
import useDebounce from "../../hooks/useDebounce";
import { FaFire } from 'react-icons/fa';

export default function Explore() {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState({ posts: [], users: [], hashtags: [] });
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams.get('t') || 'posts');
    const [history, setHistory] = useState([]);
    const { add: addToast } = useToast();

    // Store the controller ref to cancel previous requests
    const abortControllerRef = useRef(null);

    // 1. Debounce Input
    const debouncedQuery = useDebounce(query, 500);

    // 2. Load History & Trending on Mount
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('search_history') || '[]');
        setHistory(saved);
        
        (async () => {
            try {
                const r = await API.get("/posts/trending");
                setTrending(r.data || []);
            } catch (e) { 
                console.warn('Failed to load trending'); 
            }
        })();
    }, []);

    // 3. Search Execution Logic with AbortController
    const executeSearch = useCallback(async (q) => {
        const finalQuery = q.trim();
        if (!finalQuery) {
            setResults({ posts: [], users: [], hashtags: [] });
            return;
        }

        // 🔥 FIX: Cancel previous pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // Create new controller
        abortControllerRef.current = new AbortController();

        setLoading(true);
        try {
            const r = await API.get(`/search/global?q=${encodeURIComponent(finalQuery)}`, {
                signal: abortControllerRef.current.signal // Pass signal to Axios
            });
            
            setResults({ 
                users: r.data.users || [], 
                posts: r.data.posts || [],
                hashtags: r.data.hashtags || []
            });
            
            // Auto-switch tabs based on result weight if user hasn't manually switched yet
            if (r.data.users?.length > 0 && activeTab !== 'users') setActiveTab('users');
            else if (r.data.posts?.length > 0 && activeTab !== 'posts') setActiveTab('posts');
            
            // Save to History (if new)
            if (finalQuery.length > 2) {
                setHistory(prev => {
                    const newHist = [finalQuery, ...prev.filter(x => x !== finalQuery)].slice(0, 5);
                    localStorage.setItem('search_history', JSON.stringify(newHist));
                    return newHist;
                });
            }

        } catch (e2) {
            // Ignore "canceled" errors, they are intentional
            if (e2.name !== "CanceledError" && e2.code !== "ERR_CANCELED") {
                console.error("Search error", e2);
                setResults({ users: [], posts: [], hashtags: [] });
            }
        } finally {
            // Only stop loading if this was the latest request (not aborted)
            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                setLoading(false);
            }
        }
    }, [activeTab]);
    
    // 4. Effect triggers on debounced query change
    useEffect(() => {
        if (debouncedQuery) executeSearch(debouncedQuery);
        else setResults({ posts: [], users: [], hashtags: [] });
    }, [debouncedQuery, executeSearch]);

    const renderPosts = () => {
        if (loading) return <div className="text-center py-6"><Spinner /></div>;
        if (results.posts.length === 0) return <div className="text-gray-400 text-center py-6">No posts match your search.</div>;
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.posts.map((p) => (
                    <motion.div key={p._id} whileHover={{ scale: 1.01 }} className="card p-3 cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <Link to={`/post/${p._id}`}>
                            <div className="flex items-start gap-3 mb-2">
                                <img src={p.user?.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full object-cover" alt={p.user?.name} />
                                <div className="flex-1">
                                    <div className="font-medium text-indigo-500 hover:text-indigo-600">{p.user?.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="text-sm text-pink-500 flex items-center gap-1">
                                    <span role="img" aria-label="likes">❤️</span> {(p.likes?.length || 0)}
                                </div>
                            </div>
                            <div className="text-sm mb-3 whitespace-pre-wrap dark:text-gray-200">{p.content}</div>
                            {p.images?.[0] && <LazyImage src={p.images[0]} className="h-40 w-full rounded-lg object-cover" />}
                            {p.videos?.[0] && <video src={p.videos[0]} className="h-40 w-full object-cover rounded-lg" controls />}
                        </Link>
                    </motion.div>
                ))}
            </div>
        );
    };

    const renderUsers = () => {
        if (loading) return <div className="text-center py-6"><Spinner /></div>;
        if (results.users.length === 0) return <div className="text-gray-400 text-center py-6">No users found.</div>;
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.users.map(u => (
                    <Link key={u._id} to={`/profile/${u._id}`} className="card p-3 flex items-center gap-3 hover:shadow-lg transition bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <img src={u.avatar || '/default-avatar.png'} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400/50" alt={u.name} />
                        <div className="flex-1">
                            <div className="font-semibold text-lg dark:text-gray-100">{u.name} {u.badges?.includes('verified') ? '✔️' : ''}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">@{u.email.split('@')[0]}</div>
                        </div>
                        <div className="text-sm text-indigo-600 dark:text-indigo-400">{u.followersCount || 0} followers</div>
                    </Link>
                ))}
            </div>
        );
    };
    
    const renderHashtags = () => {
        if (loading) return <div className="text-center py-6"><Spinner /></div>;
        if (results.hashtags.length === 0) return <div className="text-gray-400 text-center py-6">No matching hashtags found.</div>;
        return (
            <div className="flex flex-wrap gap-2">
                {results.hashtags.map(h => (
                    <motion.button 
                        key={h} 
                        onClick={() => { setQuery(`#${h}`); executeSearch(`#${h}`); }} 
                        whileHover={{ scale: 1.05 }}
                        className="px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium text-sm transition"
                    >
                        #{h}
                    </motion.button>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
                <motion.div layout className="card p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <form onSubmit={(e)=>e.preventDefault()} className="flex gap-3">
                        <input 
                            value={query} 
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search posts, users, #hashtags..."
                            className="flex-1 p-3 rounded-full bg-gray-100 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition dark:text-white dark:placeholder-gray-400" 
                        />
                    </form>

                    {/* Search History Chips */}
                    {history.length > 0 && !query && (
                        <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                            <span className="text-xs text-gray-400 self-center mr-2">Recent:</span>
                            {history.map(h => (
                                <button 
                                    key={h} 
                                    onClick={() => { setQuery(h); }}
                                    className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition flex items-center gap-1"
                                >
                                    {h}
                                </button>
                            ))}
                            <button onClick={() => { setHistory([]); localStorage.removeItem('search_history'); }} className="text-xs text-red-400 hover:underline self-center ml-auto">Clear</button>
                        </div>
                    )}
                </motion.div>
                
                {/* Swipe Mode Button */}
                <div className="flex justify-end">
                    <Link to="/discover" className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition">
                        <FaFire /> Swipe Mode
                    </Link>
                </div>

                <div className="flex gap-4 border-b dark:border-gray-700 pb-1 overflow-x-auto">
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'}`}>
                        People ({results.users.length})
                    </button>
                    <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'posts' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'}`}>
                        Posts ({results.posts.length})
                    </button>
                    <button onClick={() => setActiveTab('hashtags')} className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'hashtags' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'}`}>
                        Hashtags ({results.hashtags.length})
                    </button>
                </div>
                
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={activeTab}>
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'posts' && renderPosts()}
                    {activeTab === 'hashtags' && renderHashtags()}
                </motion.div>
            </div>
            
            <aside className="lg:col-span-1 space-y-6">
                <div className="card p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-semibold text-lg mb-3 border-b dark:border-gray-700 pb-2 dark:text-gray-100">🔥 Trending Posts</h4>
                    <div className="mt-3 space-y-3">
                        {trending.length === 0 ? <div className="text-gray-400 text-sm">No trending items yet.</div> :
                            trending.slice(0, 6).map(t => (
                                <Link key={t._id} to={`/post/${t._id}`} className="flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded transition">
                                    <img src={t.user?.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full object-cover" alt="user" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate dark:text-gray-200">{t.user?.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{(t.content || "").slice(0, 50)}...</div>
                                    </div>
                                    <div className="text-sm text-pink-500 flex-shrink-0">{(t.likes?.length || 0)}</div>
                                </Link>
                            ))
                        }
                    </div>
                </div>
            </aside>
        </div>
    );
}