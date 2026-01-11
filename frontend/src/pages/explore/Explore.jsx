// frontend/src/pages/explore/Explore.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import { FaHashtag, FaUserPlus, FaSearch, FaFire, FaHistory, FaTimes } from 'react-icons/fa'; // 🔥 Added Icons
import UserAvatar from "../../components/ui/UserAvatar";

export default function Explore() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState({ users: [], posts: [], hashtags: [] });
    const [suggestions, setSuggestions] = useState({ users: [], trendingHashtags: [] });
    const [loading, setLoading] = useState(false);
    
    // 🔥 NEW: Recent Search State
    const [recentSearches, setRecentSearches] = useState([]);

    // Load Recents on Mount
    useEffect(() => {
        const saved = localStorage.getItem('recent_searches');
        if (saved) {
            try { setRecentSearches(JSON.parse(saved)); } catch(e) {}
        }
    }, []);

    // 🔥 NEW: Helper to Add to History
    const addToHistory = (term) => {
        if (!term || term.length < 2) return;
        const newSet = new Set([term, ...recentSearches]);
        const newArr = Array.from(newSet).slice(0, 5); // Keep top 5
        setRecentSearches(newArr);
        localStorage.setItem('recent_searches', JSON.stringify(newArr));
    };

    // 🔥 NEW: Helper to Remove from History
    const removeFromHistory = (term, e) => {
        e.stopPropagation();
        const newArr = recentSearches.filter(s => s !== term);
        setRecentSearches(newArr);
        localStorage.setItem('recent_searches', JSON.stringify(newArr));
    };

    // Load Initial Suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const r = await API.get('/extra/suggestions');
                setSuggestions(r.data || { users: [], trendingHashtags: [] });
            } catch (e) {
                console.error("Failed to load suggestions", e);
            }
        };
        fetchSuggestions();
    }, []);

    // Handle Search Execution
    useEffect(() => {
        if (!query.trim()) {
            setResults({ users: [], posts: [], hashtags: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const r = await API.get(`/search/global?q=${encodeURIComponent(query)}`);
                setResults(r.data || { users: [], posts: [], hashtags: [] });
                
                // 🔥 Add to history if results found
                if (r.data?.users?.length > 0 || r.data?.posts?.length > 0) {
                    addToHistory(query);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }, 500); 

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="max-w-4xl mx-auto p-4 min-h-screen pb-20">
            {/* Search Bar */}
            <div className="relative mb-8">
                <FaSearch className="absolute left-4 top-4 text-gray-400" />
                <input 
                    value={query} 
                    onChange={e => setQuery(e.target.value)} 
                    placeholder="Search people, posts, tags..." 
                    className="w-full pl-12 p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 ring-indigo-500 transition"
                />
            </div>

            {query ? (
                // --- SEARCH RESULTS VIEW ---
                <div className="space-y-6">
                    {loading && <div className="text-center"><Spinner /></div>}
                    
                    {!loading && results.users.length === 0 && results.posts.length === 0 && (
                        <div className="text-center text-gray-500 py-10">No results found.</div>
                    )}

                    {/* Users Results */}
                    {results.users.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
                            <h3 className="font-bold mb-3 text-gray-500 text-xs uppercase tracking-wider">People</h3>
                            {results.users.map(u => (
                                <Link key={u._id} to={`/profile/${u._id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition">
                                    <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10" />
                                    <div>
                                        <div className="font-bold text-sm dark:text-white">{u.name}</div>
                                        <div className="text-xs text-gray-500">@{u.email.split('@')[0]}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Posts Results */}
                    {results.posts.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-3 text-gray-500 text-xs uppercase tracking-wider px-2">Posts</h3>
                            <div className="grid gap-4">
                                {results.posts.map(p => (
                                    <Link key={p._id} to={`/post/${p._id}`} className="block bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm hover:shadow-md transition">
                                        <div className="text-sm dark:text-gray-200 line-clamp-3">{p.content}</div>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                            <span>❤️ {p.likesCount || 0}</span>
                                            <span>• {new Date(p.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // --- DEFAULT VIEW ---
                <div className="space-y-8 animate-fade-in">
                    
                    {/* 🔥 NEW: Recent Searches */}
                    {recentSearches.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 flex items-center gap-2">
                                <FaHistory /> Recent
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map(term => (
                                    <div 
                                        key={term} 
                                        onClick={() => setQuery(term)}
                                        className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 group transition"
                                    >
                                        {term}
                                        <span onClick={(e) => removeFromHistory(term, e)} className="text-gray-400 hover:text-red-500 p-0.5 rounded-full"><FaTimes size={10} /></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Swipe Mode CTA */}
                    <div className="bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg transform hover:scale-[1.02] transition cursor-pointer">
                        <div>
                            <h2 className="text-2xl font-black mb-1">Swipe Mode 🔥</h2>
                            <p className="opacity-90 text-sm">Discover new people fast.</p>
                        </div>
                        <Link to="/discover" className="bg-white text-pink-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-gray-100">
                            Play
                        </Link>
                    </div>

                    {/* Trending Hashtags */}
                    {/* ... (Existing code) ... */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                            <FaFire className="text-orange-500" /> Trending Now
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {suggestions.trendingHashtags?.length > 0 ? (
                                suggestions.trendingHashtags.map(tag => (
                                    <button 
                                        key={tag} 
                                        onClick={() => setQuery(`#${tag}`)}
                                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition flex items-center gap-1"
                                    >
                                        <FaHashtag size={12} /> {tag}
                                    </button>
                                ))
                            ) : (
                                <div className="text-gray-400 text-sm">No trends yet.</div>
                            )}
                        </div>
                    </div>

                    {/* People Suggestions */}
                    {/* ... (Existing code) ... */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                            <FaUserPlus className="text-green-500" /> Suggested for You
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {suggestions.users?.map(u => (
                                <Link key={u._id} to={`/profile/${u._id}`} className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-3 hover:-translate-y-1 transition text-center group">
                                    <div className="relative">
                                        <UserAvatar src={u.avatar} name={u.name} className="w-16 h-16" />
                                        <div className="absolute -bottom-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm opacity-0 group-hover:opacity-100 transition">
                                            View
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm dark:text-white truncate w-full">{u.name}</div>
                                        <div className="text-xs text-gray-500">{u.followers?.length || 0} followers</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}