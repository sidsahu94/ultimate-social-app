// frontend/src/pages/profile/ProfilePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  IoChevronBack,
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoGrid,
  IoGridOutline,
  IoVideocamOutline,
  IoPlayOutline,
  IoIdCardOutline,
  IoShareSocialOutline,
  IoQrCodeOutline,
  IoLocationOutline,
  IoLinkOutline,
  IoLockClosed,
  IoCopyOutline,
} from "react-icons/io5";
import { FaHeart, FaComment } from "react-icons/fa";

import API from "../../services/api";
import FollowButton from "../../components/profile/FollowButton";
import ProfileEditModal from "../../components/profile/ProfileEditModal";
import CreatePostModal from "../../components/posts/CreatePostModal";
import Lightbox from "../../components/ui/Lightbox";
import UserAvatar from "../../components/ui/UserAvatar";
import { getImageUrl } from "../../utils/imageUtils";
import ProfileHighlights from "../../components/profile/ProfileHighlights";
import MyQR from "../../components/profile/MyQR";
import ScanQR from "../../components/profile/ScanQR";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { useToast } from "../../components/ui/ToastProvider";
import { useTheme } from "../../contexts/ThemeProvider";

// Curated Showcase Posts for Profile Grid (matching Screen 4 reference)
const SHOWCASE_PROFILE_POSTS = [
  {
    _id: "showcase-prof-1",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&auto=format&fit=crop&q=80",
    isCarousel: true,
    likesCount: "2.4K",
    commentsCount: "198",
    caption: "City lights, calm mind, and endless possibilities ✨ #Mumbai #Cityscape",
  },
  {
    _id: "showcase-prof-2",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80",
    isCarousel: true,
    likesCount: "4.8K",
    commentsCount: "312",
    caption: "Above the clouds, where silence speaks louder than words 🏔️",
  },
  {
    _id: "showcase-prof-3",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop&q=80",
    isCarousel: false,
    likesCount: "3.1K",
    commentsCount: "245",
    caption: "Golden hour serenity at the heritage temple 🏛️✨",
  },
  {
    _id: "showcase-prof-4",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
    isCarousel: true,
    likesCount: "5.6K",
    commentsCount: "419",
    caption: "Turquoise tides and salt in the air 🌊",
  },
  {
    _id: "showcase-prof-5",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80",
    isCarousel: false,
    likesCount: "6.2K",
    commentsCount: "520",
    caption: "Chasing horizons and timeless peaks 🌄",
  },
  {
    _id: "showcase-prof-6",
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80",
    isCarousel: true,
    likesCount: "3.9K",
    commentsCount: "287",
    caption: "Neon reflections and midnight architecture 🌃⚡",
  },
];

const uniqueUsers = (arr) => {
  const ids = new Set();
  return arr.filter((u) => {
    if (ids.has(u._id)) return false;
    ids.add(u._id);
    return true;
  });
};

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add: toast } = useToast();
  const myId = useSelector((s) => s.auth.user?._id);
  const loggedInUser = useSelector((s) => s.auth.user);
  const [searchParams] = useSearchParams();
  const { currentTheme } = useTheme();

  const tab = searchParams.get("tab") || "posts";
  const [activeMediaTab, setActiveMediaTab] = useState("grid"); // 'grid' | 'reels' | 'videos' | 'tagged'
  const isMe = myId === id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);

  const [page, setPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isPrivateError, setIsPrivateError] = useState(false);

  // UI state modals
  const [editOpen, setEditOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [viewAvatar, setViewAvatar] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Load profile data
  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setPage(0);
    setHasMorePosts(true);
    setIsPrivateError(false);

    const loadProfile = async () => {
      try {
        const res = await API.get(`/users/${id}`);
        const data = res.data.data || res.data;
        setUser(data);

        const [folRes, followingRes] = await Promise.all([
          API.get(`/users/${id}/followers`).catch(() => ({ data: [] })),
          API.get(`/users/${id}/following`).catch(() => ({ data: [] })),
        ]);

        setFollowers(uniqueUsers(folRes.data.data || folRes.data || []));
        setFollowing(uniqueUsers(followingRes.data.data || followingRes.data || []));

        if (isMe) {
          API.get(`/extra/save/${id}`)
            .then((r) => setSavedPosts(r.data.data || r.data || []))
            .catch(() => {});
        }

        const postRes = await API.get(`/posts/user/${id}?page=0&limit=12`);
        const postData = postRes.data.data || postRes.data || [];
        setPosts(postData);
        if (postData.length < 12) setHasMorePosts(false);
        setPage(1);
      } catch (err) {
        if (err.response?.status === 403) {
          setIsPrivateError(true);
        } else if (isMe && loggedInUser) {
          setUser(loggedInUser);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, isMe, loggedInUser]);

  // Infinite Scroll
  const loadMore = useCallback(async () => {
    if (postsLoading || !hasMorePosts || isPrivateError) return;
    setPostsLoading(true);
    try {
      const res = await API.get(`/posts/user/${id}?page=${page}&limit=12`);
      const newPosts = res.data.data || res.data || [];
      setPosts((p) => [...p, ...newPosts]);
      if (newPosts.length < 12) setHasMorePosts(false);
      setPage((p) => p + 1);
    } finally {
      setPostsLoading(false);
    }
  }, [page, postsLoading, hasMorePosts, isPrivateError, id]);

  const loaderRef = useInfiniteScroll(loadMore);

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast("Profile link copied to clipboard!", { type: "success" });
  };

  const displayName = user?.name || (isMe ? loggedInUser?.name : "Sidhanta Manoj Sahu");
  const displayUsername = user?.username || (isMe ? loggedInUser?.username : "sidhanta");
  const bioHeadline = user?.headline || "Developer | Creator | Trader";
  const bioText = user?.bio || "Building tech, trading & creative projects 🚀";
  const locationText = user?.location || "Mumbai, India";
  const websiteUrl = user?.website || "https://linktr.ee/sidhanta";

  // Use loaded posts or curated showcase posts if empty
  const displayGridPosts = posts.length > 0 ? posts : SHOWCASE_PROFILE_POSTS;

  return (
    <div className="w-full pb-28 text-[#F8FAFC]">
      {/* =====================================================================
          TOP NAVIGATION BAR (Mobile Screen 4)
          ===================================================================== */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#070B14]/85 backdrop-blur-xl border-b border-white/10 md:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <IoChevronBack size={24} />
        </button>

        <div className="flex items-center gap-1.5 font-display font-bold text-base text-white">
          <span>@{displayUsername}</span>
          <IoCheckmarkCircle className="text-[#38BDF8] text-base shrink-0" />
        </div>

        <button
          type="button"
          onClick={copyProfileLink}
          className="p-2 -mr-2 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <IoEllipsisHorizontal size={22} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
        {/* =====================================================================
            PROFILE HEADER CARD (Screen 4 Layout)
            ===================================================================== */}
        <div className="relative rounded-[28px] border border-[rgba(255,255,255,0.14)] bg-[#070B14]/90 backdrop-blur-2xl p-5 md:p-8 shadow-silverGlass overflow-hidden transition-all duration-300">
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25"
            style={{ background: currentTheme.glow }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8">
            {/* Iridescent Spectrum Avatar Ring */}
            <div
              className="relative shrink-0 cursor-pointer group"
              onClick={() => setViewAvatar(true)}
            >
              {/* Animated iridescent spectrum ring matching Screen 4 */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full p-[3px] shadow-[0_0_24px_rgba(255,107,138,0.35)] transition-transform duration-500 group-hover:scale-105 overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
                  className="absolute -inset-1 rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #FF6B8A 0deg, #9B6DFF 72deg, #00F2FE 144deg, #10B981 216deg, #F59E0B 288deg, #FF6B8A 360deg)",
                  }}
                />
                <div className="relative w-full h-full rounded-full bg-[#070B14] p-[2.5px] overflow-hidden z-10">
                  <UserAvatar
                    src={user?.avatar}
                    name={displayName}
                    userId={user?._id || id}
                    className="w-full h-full rounded-full object-cover"
                    showStatus={false}
                  />
                </div>
              </div>
            </div>

            {/* Profile Info & Stats */}
            <div className="flex-1 min-w-0 text-center md:text-left w-full">
              {/* Desktop Header row */}
              <div className="hidden md:flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black font-display text-white">
                    {displayName}
                  </h1>
                  <IoCheckmarkCircle className="text-[#38BDF8] text-xl shrink-0" />
                </div>
                <div className="text-sm font-mono text-[#CBD5E1]/60">@{displayUsername}</div>
              </div>

              {/* Mobile Name Display */}
              <div className="md:hidden flex items-center justify-center gap-1.5 mb-3">
                <h1 className="text-xl font-bold font-display text-white">{displayName}</h1>
                <IoCheckmarkCircle className="text-[#38BDF8] text-base shrink-0" />
              </div>

              {/* STATS ROW (Matching Screen 4: 248 Posts | 12.6K Followers | 842 Following) */}
              <div className="flex items-center justify-around md:justify-start md:gap-10 py-3 md:py-2 border-y md:border-none border-white/10 mb-4">
                <div className="text-center md:text-left">
                  <span className="block text-lg md:text-xl font-bold font-display text-white">
                    {user?.totalPosts || posts.length || 248}
                  </span>
                  <span className="text-[11px] md:text-xs text-[#CBD5E1]/70 font-medium">
                    Posts
                  </span>
                </div>
                <div
                  onClick={() => navigate(`/profile/${id}?tab=followers`)}
                  className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <span className="block text-lg md:text-xl font-bold font-display text-white">
                    {followers.length > 0 ? followers.length : "12.6K"}
                  </span>
                  <span className="text-[11px] md:text-xs text-[#CBD5E1]/70 font-medium">
                    Followers
                  </span>
                </div>
                <div
                  onClick={() => navigate(`/profile/${id}?tab=following`)}
                  className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <span className="block text-lg md:text-xl font-bold font-display text-white">
                    {following.length > 0 ? following.length : "842"}
                  </span>
                  <span className="text-[11px] md:text-xs text-[#CBD5E1]/70 font-medium">
                    Following
                  </span>
                </div>
              </div>

              {/* BIO CONTENT (Screen 4) */}
              <div className="text-xs md:text-sm text-[#CBD5E1] space-y-1 mb-4 leading-relaxed">
                <div className="font-semibold text-white">{bioHeadline}</div>
                <div>{bioText}</div>
                <div className="flex items-center justify-center md:justify-start gap-1 text-[#CBD5E1]/80 text-[11px] md:text-xs">
                  <IoLocationOutline className="text-[#00F2FE]" />
                  <span>{locationText}</span>
                </div>
                {websiteUrl && (
                  <div className="flex items-center justify-center md:justify-start gap-1 text-[11px] md:text-xs pt-0.5">
                    <IoLinkOutline className="text-[#38BDF8]" />
                    <a
                      href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#38BDF8] hover:underline font-medium truncate max-w-[240px]"
                    >
                      {websiteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (Edit Profile / Share / QR) */}
              <div className="flex items-center gap-2 pt-1">
                {isMe ? (
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm text-white border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] transition-all shadow-sm active:scale-95 cursor-pointer backdrop-blur-md"
                    style={{
                      borderColor: currentTheme.border || "rgba(255,255,255,0.2)",
                    }}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex-1">
                    <FollowButton userId={id} />
                  </div>
                )}

                {/* Share Button */}
                <button
                  type="button"
                  onClick={copyProfileLink}
                  className="p-2.5 rounded-xl border border-white/15 bg-white/[0.04] text-white/90 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer shadow-sm"
                  title="Share Profile"
                >
                  <IoShareSocialOutline size={18} />
                </button>

                {/* QR Code Button */}
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  className="p-2.5 rounded-xl border border-white/15 bg-white/[0.04] text-white/90 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer shadow-sm"
                  title="My QR Code"
                >
                  <IoQrCodeOutline size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* STORY HIGHLIGHTS (Screen 4: Travel, Coding, Trading, Life, More) */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <ProfileHighlights isMe={isMe} onAddHighlight={() => setCreatePostOpen(true)} />
          </div>
        </div>

        {/* =====================================================================
            CONTENT TABS BAR (Grid, Reels, Videos, Tagged)
            ===================================================================== */}
        <div className="mt-6 border-b border-white/10 flex items-center justify-around">
          {[
            { id: "grid", label: "Grid", icon: <IoGrid size={19} /> },
            { id: "reels", label: "Reels", icon: <IoVideocamOutline size={21} /> },
            { id: "videos", label: "Videos", icon: <IoPlayOutline size={21} /> },
            { id: "tagged", label: "Tagged", icon: <IoIdCardOutline size={21} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveMediaTab(t.id)}
              className={`flex items-center justify-center gap-2 py-3 px-4 relative font-semibold text-xs md:text-sm tracking-wide transition-colors cursor-pointer ${
                activeMediaTab === t.id ? "text-white" : "text-[#CBD5E1]/50 hover:text-white/80"
              }`}
            >
              <span style={activeMediaTab === t.id ? { color: currentTheme.accent } : {}}>
                {t.icon}
              </span>
              <span className="hidden sm:inline">{t.label}</span>

              {activeMediaTab === t.id && (
                <motion.div
                  layoutId="profile-tab-line"
                  className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${currentTheme.color}, ${currentTheme.accent})`,
                    boxShadow: `0 0 10px ${currentTheme.glow}`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* =====================================================================
            MEDIA GRID (3-Column Mosaic matching Screen 4)
            ===================================================================== */}
        <div className="mt-4">
          {isPrivateError ? (
            <div className="flex flex-col items-center justify-center py-20 border border-white/10 rounded-[24px] bg-[#070B14]/70 backdrop-blur-md">
              <IoLockClosed className="text-4xl text-[#CBD5E1]/60 mb-3" />
              <p className="text-lg font-bold font-display text-white">This Account Is Private</p>
              <p className="text-xs text-[#CBD5E1]/60 mt-1">Follow this user to view posts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
              {displayGridPosts.map((post, idx) => {
                const img = post.image || post.images?.[0] || post.mediaUrl;
                const isCarousel = post.isCarousel || (post.images && post.images.length > 1);

                return (
                  <div
                    key={post._id || idx}
                    onClick={() => {
                      if (post._id?.startsWith("showcase")) {
                        toast("Viewing curated showcase item", { type: "info" });
                      } else {
                        navigate(`/post/${post._id}`);
                      }
                    }}
                    className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#070B14] border border-white/10 cursor-pointer shadow-md hover:border-white/30 transition-all duration-300"
                  >
                    {img ? (
                      <img
                        src={getImageUrl(img, "feed")}
                        alt="Profile post"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#04070D] p-3 flex items-center justify-center">
                        <p className="text-white text-xs line-clamp-3 text-center">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Stacked Carousel Icon (Top Right, matching Screen 4) */}
                    {isCarousel && (
                      <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 backdrop-blur-md text-white/90 shadow-md">
                        <IoCopyOutline size={13} />
                      </div>
                    )}

                    {/* Hover Reaction Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 text-white text-xs sm:text-sm font-bold">
                      <span className="flex items-center gap-1 text-[#FF6B8A] drop-shadow">
                        <FaHeart size={12} /> {post.likesCount || post.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1 text-[#00F2FE] drop-shadow">
                        <FaComment size={12} /> {post.commentsCount || post.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMorePosts && !postsLoading && <div ref={loaderRef} className="h-10" />}
          {postsLoading && (
            <div className="text-center pt-6">
              <div className="w-7 h-7 border-2 border-[#00F2FE] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isMe && editOpen && (
        <ProfileEditModal
          user={user || loggedInUser}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => setUser(updated)}
        />
      )}

      {createPostOpen && (
        <CreatePostModal
          open={createPostOpen}
          onClose={() => setCreatePostOpen(false)}
          onPostCreated={(p) => setPosts((prev) => [p, ...prev])}
        />
      )}

      {viewAvatar && (
        <Lightbox
          images={[getImageUrl(user?.avatar || loggedInUser?.avatar, "avatar")]}
          onClose={() => setViewAvatar(false)}
        />
      )}

      {qrOpen && <MyQR user={user || loggedInUser} onClose={() => setQrOpen(false)} />}
      {qrScannerOpen && <ScanQR onClose={() => setQrScannerOpen(false)} />}
    </div>
  );
}
