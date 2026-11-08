// frontend/src/pages/explore/Explore.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IoSearchOutline,
  IoScanOutline,
  IoCopyOutline,
  IoPlay,
  IoMenuOutline,
  IoClose,
  IoHeart,
  IoChatbubble,
  IoLocationOutline,
  IoFlame,
  IoPeopleOutline,
  IoSparkles,
} from "react-icons/io5";

import API from "../../services/api";
import Spinner from "../../components/common/Spinner";
import UserAvatar from "../../components/ui/UserAvatar";
import { getImageUrl } from "../../utils/imageUtils";
import { playSound } from "../../utils/soundEffects";
import { useTheme } from "../../contexts/ThemeProvider";

// Curated Staggered Mosaic Pieces (Matching Screen 2 of the reference design)
const CURATED_EXPLORE_PIECES = [
  {
    _id: "exp-1",
    aspect: "tall", // Portrait aspect
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=700&auto=format&fit=crop&q=80",
    caption: "Frozen peaks reaching into the infinite sky 🏔️",
    isCarousel: true,
    user: { name: "Elena Vance", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" },
    likes: "18.4K",
    comments: "342",
  },
  {
    _id: "exp-2",
    aspect: "square",
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=700&auto=format&fit=crop&q=80",
    caption: "City cadence and neon reflections in the midnight rain 🌃✨",
    isCarousel: false,
    user: { name: "Marcus Thorne", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200" },
    likes: "22.1K",
    comments: "419",
  },
  {
    _id: "exp-3",
    aspect: "square",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&auto=format&fit=crop&q=80",
    caption: "Turquoise shorelines and calm Pacific breeze 🌊🌴",
    isCarousel: false,
    user: { name: "Kai Sterling", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
    likes: "14.9K",
    comments: "215",
  },
  {
    _id: "exp-4",
    aspect: "tall",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=700&auto=format&fit=crop&q=80",
    caption: "Pristine macro morning dew drops on emerald foliage 🍃💧",
    isCarousel: true,
    user: { name: "Aria Chen", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200" },
    likes: "31.2K",
    comments: "580",
  },
  {
    _id: "exp-5",
    aspect: "tall",
    isVideo: true,
    viewCount: "1.2M",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=700&auto=format&fit=crop&q=80",
    caption: "Sunset hiker atop the clouds watching golden horizons 🌄",
    isCarousel: true,
    user: { name: "Sidhanta Sahu", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" },
    likes: "45.7K",
    comments: "912",
  },
  {
    _id: "exp-6",
    aspect: "square",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=700&auto=format&fit=crop&q=80",
    caption: "Ancient heritage sandstone temple bathed in dusk light 🏛️✨",
    isCarousel: false,
    user: { name: "Neha Sharma", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
    likes: "19.3K",
    comments: "288",
  },
  {
    _id: "exp-7",
    aspect: "square",
    isVideo: true,
    viewCount: "432K",
    image: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=700&auto=format&fit=crop&q=80",
    caption: "Serengeti king in deep golden gaze 🦁",
    isCarousel: true,
    user: { name: "Vikram Mehta", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
    likes: "38.6K",
    comments: "640",
  },
  {
    _id: "exp-8",
    aspect: "tall",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=700&auto=format&fit=crop&q=80",
    caption: "Secret turquoise cove surrounded by lush alpine pines 🌲💧",
    isCarousel: false,
    user: { name: "Ishita Roy", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" },
    likes: "27.4K",
    comments: "430",
  },
];

const TRENDING_PLACES = [
  { name: "Mumbai, India", count: "142K posts", img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400" },
  { name: "Swiss Alps", count: "98K posts", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400" },
  { name: "Bali, Indonesia", count: "86K posts", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400" },
  { name: "Kyoto, Japan", count: "64K posts", img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400" },
];

export default function Explore() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("For You"); // 'For You' | 'Trending' | 'People' | 'Places'
  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] });
  const [suggestions, setSuggestions] = useState({ users: [], trendingHashtags: [] });
  const [loading, setLoading] = useState(false);
  const [categoryPosts, setCategoryPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Load Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const r = await API.get("/extra/suggestions");
        const payload = r.data.data || r.data || {};
        setSuggestions({
          users: Array.isArray(payload.users) ? payload.users : [],
          trendingHashtags: Array.isArray(payload.trendingHashtags) ? payload.trendingHashtags : [],
        });
      } catch (e) {
        // Fallback demo users
      }
    };
    fetchSuggestions();
  }, []);

  // Fetch Feed for current category
  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        let res;
        if (activeCategory === "For You" || activeCategory === "Trending") {
          res = await API.get("/posts/trending");
        } else if (activeCategory === "Places") {
          res = await API.get("/search/global?q=places");
        } else {
          res = await API.get(`/search/global?q=${encodeURIComponent(activeCategory)}`);
        }
        const raw = res.data?.data || res.data;
        const postsList = Array.isArray(raw) ? raw : raw?.posts || [];
        setCategoryPosts(postsList);
      } catch (e) {
        setCategoryPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, [activeCategory]);

  // Handle Search
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
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Combined grid posts (database posts or curated showcase pieces)
  const mosaicPieces =
    categoryPosts.length >= 4 ? categoryPosts : CURATED_EXPLORE_PIECES;

  return (
    <div className="w-full pb-28 text-[#F8FAFC]">
      {/* =====================================================================
          HEADER (Mobile Screen 2: Hamburger + Explore + Search with QR Scanner)
          ===================================================================== */}
      <div className="sticky top-0 z-30 bg-[#070B14]/90 backdrop-blur-2xl border-b border-white/10 px-4 pt-3 pb-3">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="p-1 -ml-1 text-white/80 hover:text-white md:hidden"
            >
              <IoMenuOutline size={26} />
            </button>
            <h1 className="text-xl md:text-2xl font-black font-display text-white tracking-tight">
              Explore
            </h1>
          </div>

          <span
            className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.color}25, ${currentTheme.accent}20)`,
              border: `1px solid ${currentTheme.color}50`,
              color: currentTheme.accent,
            }}
          >
            Curated Feed
          </span>
        </div>

        {/* Search Bar with QR Scanner Icon (Screen 2) */}
        <div className="relative mb-3">
          <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-lg" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, people, tags..."
            className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-[#04070D]/85 border border-white/15 outline-none focus:border-white/40 transition-all text-white placeholder-white/40 text-sm shadow-inner"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1"
            >
              <IoClose size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Scan QR"
            >
              <IoScanOutline size={20} />
            </button>
          )}
        </div>

        {/* CATEGORY FILTER PILLS (Screen 2: For You | 🔥 Trending | 👥 People | 📍 Places) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: "For You", label: "For You", icon: null },
            { id: "Trending", label: "Trending", icon: <IoFlame className="text-[#FF6B8A]" /> },
            { id: "People", label: "People", icon: <IoPeopleOutline className="text-[#00F2FE]" /> },
            { id: "Places", label: "Places", icon: <IoLocationOutline className="text-[#F59E0B]" /> },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  playSound("pop");
                  setActiveCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? "text-white shadow-lg scale-105"
                    : "bg-[#04070D]/70 border-white/10 text-white/70 hover:text-white hover:border-white/20"
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${currentTheme.color}40, ${currentTheme.accent}30)`,
                        borderColor: currentTheme.accent,
                        boxShadow: `0 0 14px ${currentTheme.glow}`,
                      }
                    : {}
                }
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
        {/* =====================================================================
            SEARCH RESULTS VIEW (When query is active)
            ===================================================================== */}
        {query ? (
          <div className="space-y-6">
            {loading && (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            )}

            {!loading && results.users?.length === 0 && results.posts?.length === 0 && (
              <div className="text-center text-white/60 py-14 rounded-2xl border border-dashed border-white/15 bg-white/[0.02]">
                No direct results found for "{query}". Try browsing the curated feed.
              </div>
            )}

            {/* Users */}
            {results.users?.length > 0 && (
              <div className="rounded-2xl border border-white/15 bg-[#070B14]/85 p-4 backdrop-blur-md">
                <h3 className="font-bold mb-3 text-white/70 text-xs uppercase tracking-wider">
                  Creators
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.users.map((u) => (
                    <Link
                      key={u._id}
                      to={`/profile/${u._id}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.05] transition border border-transparent hover:border-white/10"
                    >
                      <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-white truncate">{u.name}</div>
                        <div className="text-xs text-white/50 truncate">
                          @{u.username || "creator"}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Grid */}
            {results.posts?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {results.posts.map((post) => (
                  <div
                    key={post._id}
                    onClick={() => navigate(`/post/${post._id}`)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer group"
                  >
                    <img
                      src={getImageUrl(post.image || post.images?.[0] || post.mediaUrl, "feed")}
                      alt="Result"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeCategory === "People" ? (
          /* ===================================================================
              PEOPLE VIEW (When "👥 People" tab is selected)
              =================================================================== */
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">
              Suggested Creators For You
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(suggestions.users.length > 0
                ? suggestions.users
                : [
                    { _id: "u1", name: "Aarav Deshmukh", username: "aaravd", followersCount: "42.1K" },
                    { _id: "u2", name: "Riya Sharma", username: "riyas", followersCount: "28.5K" },
                    { _id: "u3", name: "Karan Patel", username: "karanp", followersCount: "19.3K" },
                    { _id: "u4", name: "Neha Verma", username: "nehav", followersCount: "35.8K" },
                  ]
              ).map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-white/15 bg-[#070B14]/85 backdrop-blur-xl"
                >
                  <Link
                    to={`/profile/${u._id}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <UserAvatar src={u.avatar} name={u.name} className="w-12 h-12" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white truncate">{u.name}</div>
                      <div className="text-xs text-white/50 truncate">
                        @{u.username || "creator"}
                      </div>
                      <div className="text-[11px] font-semibold text-[#00F2FE] mt-0.5">
                        {u.followersCount || `${u.followers?.length || 12} followers`}
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("pop");
                    }}
                    className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md hover:scale-105 transition-transform"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                    }}
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeCategory === "Places" ? (
          /* ===================================================================
              PLACES VIEW (When "📍 Places" tab is selected)
              =================================================================== */
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">
              Trending Destinations & Spots
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {TRENDING_PLACES.map((place, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(place.name.split(",")[0]);
                  }}
                  className="group relative h-40 rounded-2xl overflow-hidden border border-white/15 cursor-pointer shadow-lg"
                >
                  <img
                    src={place.img}
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3.5">
                    <span className="font-bold text-white text-sm drop-shadow">
                      {place.name}
                    </span>
                    <span className="text-[11px] text-white/70 font-medium">
                      {place.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ===================================================================
              MOSAIC MASONRY GRID (Screen 2: For You / Trending)
              Staggered 2-column on mobile, 3-4 column on desktop
              =================================================================== */
          <div className="space-y-4">
            {activeCategory === "Trending" && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                  { tag: "#IndiaTechSummit", count: "142K posts" },
                  { tag: "#MumbaiRains", count: "98K posts" },
                  { tag: "#AIRevolution", count: "276K posts" },
                  { tag: "#CreatorEconomy", count: "64K posts" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(item.tag)}
                    className="flex items-center gap-2 whitespace-nowrap px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/25 text-xs text-white transition-all cursor-pointer group shrink-0"
                  >
                    <span className="font-bold text-[#38BDF8]">{item.tag}</span>
                    <span className="text-[10px] text-[#CBD5E1]/60">{item.count}</span>
                    <span className="text-[#10B981] text-xs font-bold transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                  </button>
                ))}
              </div>
            )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
            {mosaicPieces.map((piece, idx) => {
              const img = piece.image || piece.images?.[0] || piece.mediaUrl;
              const isVideo = piece.isVideo;
              const viewCount = piece.viewCount;
              const isCarousel = piece.isCarousel;
              const isTall = piece.aspect === "tall" || idx % 3 === 0;

              return (
                <div
                  key={piece._id || idx}
                  onClick={() => {
                    if (piece._id?.startsWith("exp")) {
                      if (isVideo) {
                        navigate("/reels");
                      }
                    } else {
                      navigate(`/post/${piece._id}`);
                    }
                  }}
                  className={`group relative rounded-2xl overflow-hidden bg-[#070B14] border border-white/10 cursor-pointer shadow-md hover:border-white/30 transition-all duration-300 ${
                    isTall ? "row-span-2 aspect-[4/5] sm:aspect-[3/4]" : "aspect-square"
                  }`}
                >
                  <img
                    src={getImageUrl(img, "feed")}
                    alt="Explore piece"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Stacked Carousel Icon (Top Right, Screen 2) */}
                  {isCarousel && (
                    <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-black/60 backdrop-blur-md text-white/90 shadow-md">
                      <IoCopyOutline size={14} />
                    </div>
                  )}

                  {/* Video Play Badge (Bottom Left, Screen 2: ▷ 1.2M / ▷ 432K) */}
                  {isVideo && viewCount && (
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold text-[11px] shadow-lg">
                      <IoPlay size={11} className="text-white" />
                      <span>{viewCount}</span>
                    </div>
                  )}

                  {/* Hover Overlay with Creator & Reactions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5">
                    {piece.user && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <UserAvatar
                          src={piece.user.avatar}
                          name={piece.user.name}
                          className="w-6 h-6 border border-white/30"
                        />
                        <span className="text-white text-xs font-semibold truncate">
                          {piece.user.name}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-white text-xs font-bold">
                      <span className="flex items-center gap-1 text-[#FF6B8A]">
                        <IoHeart size={12} /> {piece.likes || piece.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1 text-[#00F2FE]">
                        <IoChatbubble size={11} /> {piece.comments || piece.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
