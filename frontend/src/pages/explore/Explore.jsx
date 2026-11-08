// frontend/src/pages/explore/Explore.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import { FaHashtag, FaUserPlus, FaSearch, FaFire, FaHistory, FaTimes, FaCompass, FaHeart, FaComment } from 'react-icons/fa';
import UserAvatar from "../../components/ui/UserAvatar";
import { getImageUrl } from "../../utils/imageUtils";
import { playSound } from "../../utils/soundEffects";

let cachedExploreSuggestions = null;
let lastSuggestionsFetchTime = 0;
const exploreCategoryCache = new Map();

export default function Explore() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState('For You');
    const [results, setResults] = useState({ users: [], posts: [], hashtags: [] });
    const [suggestions, setSuggestions] = useState({ users: [], trendingHashtags: [] });
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [categoryPosts, setCategoryPosts] = useState([]);
    const [loadingCategoryPosts, setLoadingCategoryPosts] = useState(false);

    // Load History
    useEffect(() => {
        const saved = localStorage.getItem('recent_searches');
        if (saved) { try { setRecentSearches(JSON.parse(saved)); } catch(e) {} }
    }, []);

    const addToHistory = (term) => {
        if (!term || term.length < 2) return;
        const newSet = new Set([term, ...recentSearches]);
        const newArr = Array.from(newSet).slice(0, 5);
        setRecentSearches(newArr);
        localStorage.setItem('recent_searches', JSON.stringify(newArr));
    };

    const removeFromHistory = (term, e) => {
        e.stopPropagation();
        const newArr = recentSearches.filter(s => s !== term);
        setRecentSearches(newArr);
        localStorage.setItem('recent_searches', JSON.stringify(newArr));
    };

    // Load Suggestions (Users & Trends)
    useEffect(() => {
        if (cachedExploreSuggestions && Date.now() - lastSuggestionsFetchTime < 180000) {
            setSuggestions(cachedExploreSuggestions);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const r = await API.get('/extra/suggestions');
                const payload = r.data.data || r.data || {};
                
                const data = { 
                    users: Array.isArray(payload.users) ? payload.users : [],
                    trendingHashtags: Array.isArray(payload.trendingHashtags) ? payload.trendingHashtags : []
                };
                cachedExploreSuggestions = data;
                lastSuggestionsFetchTime = Date.now();
                setSuggestions(data);
            } catch (e) {
                console.error("Failed to load suggestions", e);
            }
        };
        fetchSuggestions();
    }, []);

    // Load Category Posts for Explore feed
    useEffect(() => {
        const cachedCat = exploreCategoryCache.get(activeCategory);
        if (cachedCat && Date.now() - cachedCat.time < 120000) {
            setCategoryPosts(cachedCat.posts);
            return;
        }

        const fetchCategoryPosts = async () => {
            setLoadingCategoryPosts(true);
            try {
                let res;
                if (activeCategory === 'For You' || activeCategory === 'Trending') {
                    res = await API.get('/posts/trending');
                } else {
                    res = await API.get(`/search/global?q=${encodeURIComponent(activeCategory)}`);
                }
                const raw = res.data?.data || res.data;
                let postsList = Array.isArray(raw) ? raw : (raw?.posts || []);

                // If category search has 0 items, fetch trending as fallback so feed is never blank
                if ((!postsList || postsList.length === 0) && activeCategory !== 'For You') {
                    const fallbackRes = await API.get('/posts/trending');
                    const fallbackRaw = fallbackRes.data?.data || fallbackRes.data;
                    postsList = Array.isArray(fallbackRaw) ? fallbackRaw : [];
                }

                exploreCategoryCache.set(activeCategory, { posts: postsList, time: Date.now() });
                setCategoryPosts(postsList);
            } catch (err) {
                console.error("Failed to load category posts", err);
                setCategoryPosts([]);
            } finally {
                setLoadingCategoryPosts(false);
            }
        };
        fetchCategoryPosts();
    }, [activeCategory]);

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
                setResults(r.data.data || r.data || { users: [], posts: [], hashtags: [] });
                
                const payload = r.data.data || r.data;
                if (payload?.users?.length > 0 || payload?.posts?.length > 0) {
                    addToHistory(query);
                }
            } catch (e) { 
                console.error(e); 
            } finally { 
                setLoading(false); 
            }
        }, 350); 
        return () => clearTimeout(timer);
    }, [query]);

    const categories = ['For You', 'Trending', 'Design', 'Technology', 'Photography', 'Art'];

    const handleSelectCategory = (cat) => {
        playSound('pop');
        setActiveCategory(cat);
    };

    return (
        <div className="w-full pb-24 font-sans text-[#F8FAFC]">
            
            {/* EXPLORE HEADER */}
            <div className="mb-6 rounded-[24px] bg-[#070B14]/85 backdrop-blur-xl p-5 border border-[rgba(226,232,240,0.14)] shadow-silverGlass">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-[#F8FAFC]">
                      Discover<span className="text-[#D4AF37]">.</span>
                    </h1>
                    <p className="text-xs text-[#CBD5E1]/70 font-medium mt-0.5">Curated creators, aesthetic pieces &amp; real-time trends</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1D4ED8]/20 text-[#00F2FE] border border-[rgba(226,232,240,0.14)]">
                    Curated Feed
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E1]/50 text-sm" />
                    <input 
                        value={query} 
                        onChange={e => setQuery(e.target.value)} 
                        placeholder="Search creators, thoughts, tags..." 
                        className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#04070D]/80 shadow-inner border border-[rgba(226,232,240,0.14)] outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-all text-[#F8FAFC] placeholder-[#CBD5E1]/40 text-sm"
                    />
                    {query && (
                      <button 
                        onClick={() => setQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#CBD5E1]/50 hover:text-white p-1"
                      >
                        <FaTimes />
                      </button>
                    )}
                </div>
                
                {/* Floating Glass Categories */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
                  {categories.map((cat, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSelectCategory(cat)}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 border cursor-pointer ${
                        activeCategory === cat 
                          ? 'bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white border-transparent shadow-sapphireGlow scale-105' 
                          : 'bg-[#04070D]/70 border-[rgba(226,232,240,0.12)] text-[#CBD5E1]/70 hover:text-[#00F2FE] hover:border-[#00F2FE]/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
            </div>

            <div className="space-y-6">
                {query ? (
                    /* --- SEARCH RESULTS VIEW --- */
                    <div className="space-y-6 animate-fade-in">
                        {loading && (
                          <div className="flex justify-center py-12"><Spinner /></div>
                        )}
                        
                        {!loading && results.users?.length === 0 && results.posts?.length === 0 && (
                            <div className="text-center text-[#CBD5E1]/60 py-12 border-2 border-dashed border-[rgba(226,232,240,0.14)] rounded-[24px] bg-[#070B14]/40">
                                No direct results found for "{query}". Try a different term or browse categories.
                            </div>
                        )}

                        {/* Users Results */}
                        {results.users?.length > 0 && (
                            <div className="bg-[#070B14]/85 backdrop-blur-md rounded-[24px] border border-[rgba(226,232,240,0.14)] p-5 shadow-silverGlass">
                                <h3 className="font-bold mb-3 text-[#CBD5E1]/70 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                  <FaUserPlus className="text-[#00F2FE]" /> Creators
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {results.users.map(u => (
                                        <Link key={u._id} to={`/profile/${u._id}`} className="flex items-center gap-3 p-2.5 hover:bg-white/[0.04] rounded-2xl transition border border-transparent hover:border-[rgba(226,232,240,0.14)]">
                                            <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10" />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-sm text-[#F8FAFC] truncate">{u.name}</div>
                                                <div className="text-xs text-[#CBD5E1]/60 truncate">@{u.username || 'creator'}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Posts Results */}
                        {results.posts?.length > 0 && (
                            <div>
                                <h3 className="font-bold mb-3 text-[#CBD5E1]/70 text-xs uppercase tracking-wider px-1">Posts</h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {results.posts.map((post) => (
                                    <div 
                                      key={post._id} 
                                      onClick={() => navigate(`/post/${post._id}`)}
                                      className="group relative rounded-[20px] overflow-hidden bg-[#070B14] border border-[rgba(226,232,240,0.14)] cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:border-[#00F2FE]/50 hover:shadow-silverGlass"
                                    >
                                      {post.image || post.images?.[0] || post.mediaUrl ? (
                                        <div className="aspect-square overflow-hidden bg-[#04070D]">
                                          <img 
                                            src={getImageUrl(post.image || post.images?.[0] || post.mediaUrl, 'feed')} 
                                            alt="Post" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                            loading="lazy"
                                          />
                                        </div>
                                      ) : (
                                        <div className="aspect-square bg-[#04070D] p-5 flex items-center justify-center">
                                            <p className="text-[#F8FAFC] text-xs font-medium line-clamp-4 text-center">
                                                {post.content}
                                            </p>
                                        </div>
                                      )}
                                      
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                                          <div className="flex items-center gap-2 mb-1.5">
                                            <UserAvatar src={post.user?.avatar} name={post.user?.name} className="w-6 h-6 border border-[#00F2FE]" />
                                            <span className="text-[#F8FAFC] font-medium text-xs truncate">
                                              {post.user?.name || 'Creator'}
                                            </span>
                                          </div>
                                          
                                          <p className="text-[#CBD5E1]/90 text-[11px] line-clamp-2 mb-2 font-light">
                                            {post.content}
                                          </p>
                                          
                                          <div className="flex items-center gap-2 text-white font-semibold text-[11px]">
                                            <span className="flex items-center gap-1 backdrop-blur-md bg-black/50 border border-white/10 px-2 py-0.5 rounded-full text-red-400">
                                              <FaHeart size={10} /> {post.likes?.length || post.likesCount || 0}
                                            </span>
                                            <span className="flex items-center gap-1 backdrop-blur-md bg-black/50 border border-white/10 px-2 py-0.5 rounded-full text-[#00F2FE]">
                                              <FaComment size={10} /> {post.comments?.length || post.commentsCount || 0}
                                            </span>
                                          </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* --- DEFAULT EXPLORE FEED --- */
                    <div className="space-y-6 animate-fade-in">
                        
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <div>
                                <h3 className="font-bold text-[#CBD5E1]/70 text-xs uppercase mb-2.5 flex items-center gap-2">
                                    <FaHistory size={11} /> Recent Searches
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map(term => (
                                        <div 
                                            key={term} 
                                            onClick={() => setQuery(term)}
                                            className="px-3.5 py-1.5 bg-[#070B14] border border-[rgba(226,232,240,0.14)] rounded-full text-xs font-semibold hover:border-[#00F2FE] cursor-pointer flex items-center gap-2 group transition text-[#F8FAFC] shadow-sm"
                                        >
                                            {term}
                                            <span onClick={(e) => removeFromHistory(term, e)} className="text-[#CBD5E1]/60 hover:text-[#10B981] p-0.5 rounded-full"><FaTimes size={9} /></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Swipe Discovery Banner */}
                        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] p-6 text-white shadow-sapphireGlow border border-white/15">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black font-display mb-1">Swipe Discovery 🔥</h2>
                                    <p className="text-xs opacity-90 font-medium">Experience full-screen cinematic cards &amp; swipe to discover new creators.</p>
                                </div>
                                <Link to="/discover" className="shrink-0 bg-[#04070D] text-[#F8FAFC] hover:text-[#00F2FE] px-6 py-2.5 rounded-full text-xs font-bold shadow-xl transition-all border border-[rgba(226,232,240,0.2)] hover:border-[#00F2FE]">
                                    Launch Swipe
                                </Link>
                            </div>
                        </div>

                        {/* Suggested Creators Strip */}
                        {suggestions.users?.length > 0 && (
                          <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-sm flex items-center gap-2 text-[#F8FAFC]">
                                    <FaUserPlus className="text-[#00F2FE]" /> Suggested Creators
                                </h3>
                                <Link to="/discovery/follow-suggestions" className="text-xs text-[#00F2FE] hover:underline font-semibold">
                                  View all
                                </Link>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {suggestions.users.slice(0, 3).map(u => (
                                      <Link key={u._id} to={`/profile/${u._id}`} className="bg-[#070B14] border border-[rgba(226,232,240,0.14)] p-4 rounded-[20px] flex flex-col items-center gap-2.5 hover:-translate-y-1 hover:border-[#00F2FE]/50 transition text-center group shadow-silverGlass">
                                          <div className="relative">
                                              <UserAvatar src={u.avatar} name={u.name} className="w-14 h-14 transition-transform group-hover:scale-105" />
                                          </div>
                                          <div className="w-full">
                                              <div className="font-bold text-xs text-[#F8FAFC] truncate">{u.name}</div>
                                              <div className="text-[11px] text-[#CBD5E1]/60 truncate">
                                                  @{u.username || 'creator'}
                                              </div>
                                              <div className="text-[10px] text-[#00F2FE] mt-1 font-semibold">
                                                  {u.followers?.length || 0} followers
                                              </div>
                                          </div>
                                      </Link>
                                  ))}
                              </div>
                          </div>
                        )}

                        {/* Curated Category Exploration Feed */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-base flex items-center gap-2 text-[#F8FAFC]">
                                    <FaCompass className="text-[#D4AF37]" /> {activeCategory} Feed
                                </h3>
                                <span className="text-xs text-[#CBD5E1]/60 font-medium">
                                  {categoryPosts.length > 0 ? `${categoryPosts.length} pieces` : 'Curated'}
                                </span>
                            </div>

                            {loadingCategoryPosts ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[1, 2, 3, 4, 5, 6].map((k) => (
                                    <div key={k} className="relative aspect-square rounded-[20px] overflow-hidden bg-[#070B14] border border-white/10 animate-pulse">
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-[shimmer_1.8s_infinite]" />
                                    </div>
                                  ))}
                                </div>
                            ) : categoryPosts.length === 0 ? (
                                <div className="text-center text-[#CBD5E1]/60 py-12 border-2 border-dashed border-[rgba(226,232,240,0.14)] rounded-[24px] bg-[#070B14]/30">
                                    <p className="font-semibold text-sm">Curating pieces for {activeCategory}...</p>
                                    <p className="text-xs text-[#CBD5E1]/40 mt-1">Explore other categories or create your own post!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {categoryPosts.map((post) => (
                                    <div 
                                      key={post._id} 
                                      onClick={() => navigate(`/post/${post._id}`)}
                                      className="group relative rounded-[20px] overflow-hidden bg-[#070B14] border border-[rgba(226,232,240,0.14)] cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:border-[#00F2FE]/50 hover:shadow-silverGlass"
                                    >
                                      {post.image || post.images?.[0] || post.mediaUrl ? (
                                        <div className="aspect-square overflow-hidden bg-[#04070D]">
                                          <img 
                                            src={getImageUrl(post.image || post.images?.[0] || post.mediaUrl, 'feed')} 
                                            alt="Explore piece" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                            loading="lazy"
                                          />
                                        </div>
                                      ) : (
                                        <div className="aspect-square bg-[#04070D] p-5 flex items-center justify-center">
                                            <p className="text-[#F8FAFC] text-xs font-medium line-clamp-4 text-center">
                                                {post.content}
                                            </p>
                                        </div>
                                      )}
                                      
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                                          <div className="flex items-center gap-2 mb-1.5">
                                            <UserAvatar src={post.user?.avatar} name={post.user?.name} className="w-6 h-6 border border-[#00F2FE]" />
                                            <span className="text-[#F8FAFC] font-medium text-xs truncate">
                                              {post.user?.name || 'Creator'}
                                            </span>
                                          </div>
                                          
                                          {post.content && (
                                            <p className="text-[#CBD5E1]/90 text-[11px] line-clamp-2 mb-2 font-light">
                                              {post.content}
                                            </p>
                                          )}
                                          
                                          <div className="flex items-center gap-2 text-white font-semibold text-[11px]">
                                            <span className="flex items-center gap-1 backdrop-blur-md bg-black/50 border border-white/10 px-2 py-0.5 rounded-full text-red-400">
                                              <FaHeart size={10} /> {post.likes?.length || post.likesCount || 0}
                                            </span>
                                            <span className="flex items-center gap-1 backdrop-blur-md bg-black/50 border border-white/10 px-2 py-0.5 rounded-full text-[#00F2FE]">
                                              <FaComment size={10} /> {post.comments?.length || post.commentsCount || 0}
                                            </span>
                                          </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
