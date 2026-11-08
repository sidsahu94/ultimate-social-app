// frontend/src/pages/profile/ProfilePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

import API from "../../services/api";

import FollowButton from "../../components/profile/FollowButton";
import FollowRequestButton from "../../components/profile/FollowRequestButton";
import ProfileEditModal from "../../components/profile/ProfileEditModal";
import CreatePostModal from "../../components/posts/CreatePostModal";

import Lightbox from "../../components/ui/Lightbox";
import UserAvatar from "../../components/ui/UserAvatar";
import { getImageUrl } from "../../utils/imageUtils";

import ProfileHighlights from "../../components/profile/ProfileHighlights";
import ProfileCompletion from "../../components/profile/ProfileCompletion";
import MyQR from "../../components/profile/MyQR";
import ScanQR from "../../components/profile/ScanQR";

import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { useToast } from "../../components/ui/ToastProvider";

// Icons
import {
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaQrcode,
  FaShare,
  FaLock,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";

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
  const [searchParams] = useSearchParams();

  const tab = searchParams.get("tab") || "posts";
  const isMe = myId === id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [pinnedPost, setPinnedPost] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);

  const [page, setPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  const [isPrivateError, setIsPrivateError] = useState(false);

  // UI states
  const [editOpen, setEditOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [viewAvatar, setViewAvatar] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Initial load
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

        if (data.pinnedPost) {
          API.get(`/posts/${data.pinnedPost}`)
            .then((r) => setPinnedPost(r.data.data || r.data))
            .catch(() => {});
        }

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
        if (err.response?.status === 403) setIsPrivateError(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  // Infinite Scroll Logic
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
  }, [page, postsLoading, hasMorePosts, isPrivateError]);

  const loaderRef = useInfiniteScroll(loadMore);

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast("Profile link copied!", { type: "success" });
  };

  const renderPremiumGrid = (postArray) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
      {postArray.map((post) => (
        <div 
          key={post._id} 
          onClick={() => navigate(`/post/${post._id}`)}
          className="relative group aspect-square rounded-2xl overflow-hidden bg-[#070B14]/90 border border-white/10 cursor-pointer shadow-xl hover:border-white/25 hover:shadow-[0_8px_30px_rgba(29,78,216,0.2)] transition-all duration-300 backdrop-blur-xl"
        >
          {post.images?.[0] ? (
            <img src={getImageUrl(post.images[0], 'feed')} alt="Post" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : post.videos?.[0] ? (
            <video src={getImageUrl(post.videos[0])} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" muted loop playsInline onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4 bg-[#171A26]/80 transition-transform duration-700 group-hover:scale-105">
              <p className="text-xs md:text-sm line-clamp-4 text-[#CBD5E1] text-center font-medium leading-relaxed">{post.content}</p>
            </div>
          )}
          
          {/* Cinematic Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center opacity-0 backdrop-blur-[2px]">
            <div className="flex gap-6 text-[#F7F7FC] font-bold text-base drop-shadow-md transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
              <span className="flex items-center gap-1.5 text-[#FF6B8A]">❤️ {post.likes?.length || 0}</span>
              <span className="flex items-center gap-1.5 text-[#00F2FE]">💬 {post.comments?.length || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading)
    return (
      <div className="text-center p-12 text-[#CBD5E1] bg-[#070B14]/40 rounded-3xl border border-white/10 backdrop-blur-xl max-w-4xl mx-auto my-8">
        Loading profile...
      </div>
    );

  if (!user)
    return (
      <div className="text-center p-12 text-[#CBD5E1] bg-[#070B14]/40 rounded-3xl border border-white/10 backdrop-blur-xl max-w-4xl mx-auto my-8">
        Profile not found.
      </div>
    );

  return (
    <div className="px-4 md:px-8 py-6 pb-24">
      
      {/* PREMIUM PROFILE HEADER */}
      <div className="relative w-full rounded-[28px] p-8 lg:p-12 mb-8 overflow-hidden bg-[#171A26]/85 backdrop-blur-3xl border border-[#292D40] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500">
        
        {/* Ambient Background Glow inside the header */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#6558F5]/14 blur-[110px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#55E6FF]/08 blur-[90px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          
          {/* Avatar with Animated Glow Ring */}
          <div className="relative group cursor-pointer" onClick={() => setViewAvatar(true)}>
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#6558F5] via-[#9B6DFF] to-[#FF6B8A] rounded-full opacity-70 group-hover:opacity-100 blur-md transition-opacity duration-500" />
            <img 
              src={getImageUrl(user.avatar, 'avatar')} 
              alt="Profile" 
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-[3px] border-[#101321] shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>

          {/* User Info & Glass Stats */}
          <div className="flex flex-col items-center md:items-start flex-1 w-full">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-[#F7F7FC]">
                {user.name}
              </h1>
              {user.isVerified && <FaCheckCircle className="text-[#55E6FF] text-xl" />}
            </div>
            <p className="text-[#A5A9BB] font-medium tracking-wide mb-3 text-sm">
              @{user.username || 'user'}
            </p>

            <p className="max-w-xl text-center md:text-left text-[#F7F7FC]/90 mb-5 whitespace-pre-line leading-relaxed text-sm">
              {user.bio || "No bio available."}
            </p>

            {/* Social Links */}
            <div className="flex gap-2.5 mb-6 flex-wrap justify-center md:justify-start">
              {user.socialLinks?.twitter && (
                <a href={user.socialLinks.twitter} target="_blank" rel="noreferrer" className="p-2.5 rounded-full text-[#55E6FF] bg-[#101321] border border-[#292D40] hover:border-[#55E6FF]/50 transition-colors shadow-sm">
                  <FaTwitter />
                </a>
              )}
              {user.socialLinks?.instagram && (
                <a href={user.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2.5 rounded-full text-[#FF6B8A] bg-[#101321] border border-[#292D40] hover:border-[#FF6B8A]/50 transition-colors shadow-sm">
                  <FaInstagram />
                </a>
              )}
              {user.socialLinks?.linkedin && (
                <a href={user.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-2.5 rounded-full text-[#6558F5] bg-[#101321] border border-[#292D40] hover:border-[#6558F5]/50 transition-colors shadow-sm">
                  <FaLinkedin />
                </a>
              )}
            </div>

            {/* Floating Glass Statistic Cards */}
            <div className="flex gap-3.5 w-full md:w-auto">
              {[
                { label: 'Posts', value: user.totalPosts || posts.length || 0 },
                { label: 'Followers', value: followers.length || 0 },
                { label: 'Following', value: following.length || 0 },
              ].map((stat, idx) => (
                <div key={idx} className="flex-1 md:flex-none flex flex-col items-center justify-center px-6 py-3 rounded-[18px] bg-[#101321] border border-[#292D40] shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:border-[#6558F5]/40">
                  <span className="text-xl md:text-2xl font-bold font-display text-[#F7F7FC] mb-0.5">
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-[#A5A9BB] uppercase tracking-wider font-semibold">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Buttons (Edit Profile / Follow / Share / QR) */}
          <div className="mt-6 md:mt-0 flex gap-2.5 h-full items-center">
            {isMe ? (
              <button onClick={() => setEditOpen(true)} className="px-8 py-3 rounded-full bg-[#6558F5] text-white font-semibold shadow-[0_0_20px_rgba(101,88,245,0.4)] hover:shadow-[0_0_30px_rgba(101,88,245,0.6)] hover:bg-[#5548e6] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer">
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center">
                <FollowButton userId={id} />
              </div>
            )}
            
            <button
              onClick={copyProfileLink}
              className="p-3.5 rounded-full border border-[#292D40] bg-[#101321] text-[#F7F7FC] hover:text-[#55E6FF] hover:border-[#55E6FF]/50 shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
              title="Share Profile"
            >
              <FaShare />
            </button>
            <button
              onClick={() => setQrOpen(true)}
              className="p-3.5 rounded-full border border-[#292D40] bg-[#101321] text-[#F7F7FC] hover:text-[#55E6FF] hover:border-[#55E6FF]/50 shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
              title="QR Code"
            >
              <FaQrcode />
            </button>
          </div>
        </div>
      </div>

      {/* PROFILE COMPLETION BAR */}
      {isMe && <ProfileCompletion user={user} />}

      <ProfileHighlights isMe={isMe} userId={id} />

      {/* FLOATING PILL TABS */}
      <div className="flex justify-center mb-8 mt-8">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#101321] border border-[#292D40] shadow-md overflow-x-auto no-scrollbar">
          {["posts", "followers", "following", ...(isMe ? ["saved"] : [])].map((t) => (
            <button
              key={t}
              onClick={() => navigate(`/profile/${id}?tab=${t}`)}
              className="relative px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-colors duration-300 capitalize cursor-pointer"
            >
              {tab === t && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6558F5] to-[#9B6DFF] shadow-[0_0_15px_rgba(101,88,245,0.4)]"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
              <span className={`relative z-10 ${tab === t ? 'text-white' : 'text-[#A5A9BB] hover:text-white'}`}>
                {t}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="min-h-[300px]">
        {tab === "posts" && !isPrivateError && (
          <>
            {posts.length > 0 ? (
              renderPremiumGrid(posts)
            ) : (
              <div className="text-center text-[#A5A9BB] py-14 border-2 border-dashed border-[#292D40] rounded-[24px]">
                No posts yet.
                {isMe && (
                  <button
                    onClick={() => setCreatePostOpen(true)}
                    className="block mt-3 mx-auto text-[#55E6FF] hover:underline font-semibold text-sm cursor-pointer"
                  >
                    Create your first post
                  </button>
                )}
              </div>
            )}

            {hasMorePosts && !postsLoading && (
              <div ref={loaderRef} className="h-10" />
            )}

            {postsLoading && (
              <div className="text-center pt-6">
                <div className="w-7 h-7 border-2 border-[#6558F5] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
          </>
        )}

        {isPrivateError && tab === "posts" && (
          <div className="flex flex-col items-center justify-center py-20 border border-[#292D40] rounded-[24px] bg-[#171A26]/80 backdrop-blur-md">
            <FaLock className="text-4xl text-[#A5A9BB] mb-4" />
            <p className="text-xl font-bold font-display text-[#F7F7FC]">This Account Is Private</p>
            <p className="text-sm text-[#A5A9BB] mt-2">
              Follow this user to view posts.
            </p>
          </div>
        )}

        {tab === "followers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followers.length > 0 ? (
              followers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-4 p-4 rounded-[20px] bg-[#171A26] border border-[#292D40] shadow-sm hover:border-[#6558F5]/40 transition"
                >
                  <UserAvatar
                    src={u.avatar}
                    name={u.name}
                    className="w-12 h-12 cursor-pointer transition-transform hover:scale-105"
                    onClick={() => navigate(`/profile/${u._id}`)}
                  />
                  <div
                    className="flex-1 font-medium cursor-pointer text-[#F7F7FC] truncate text-sm"
                    onClick={() => navigate(`/profile/${u._id}`)}
                  >
                    {u.name}
                  </div>
                  <FollowRequestButton
                    userId={u._id}
                    onChange={() => {}}
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-[#A5A9BB] col-span-full py-10">No followers yet.</p>
            )}
          </div>
        )}

        {tab === "following" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {following.length > 0 ? (
              following.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-4 p-4 rounded-[20px] bg-[#171A26] border border-[#292D40] shadow-sm hover:border-[#6558F5]/40 transition"
                >
                  <UserAvatar
                    src={u.avatar}
                    name={u.name}
                    className="w-12 h-12 cursor-pointer transition-transform hover:scale-105"
                    onClick={() => navigate(`/profile/${u._id}`)}
                  />
                  <div
                    className="flex-1 font-medium cursor-pointer text-[#F7F7FC] truncate text-sm"
                    onClick={() => navigate(`/profile/${u._id}`)}
                  >
                    {u.name}
                  </div>
                  <FollowRequestButton userId={u._id} onChange={() => {}} />
                </div>
              ))
            ) : (
              <p className="text-center text-[#A5A9BB] col-span-full py-10">No following yet.</p>
            )}
          </div>
        )}

        {tab === "saved" && isMe && (
           <>
             {savedPosts.length > 0 ? (
                renderPremiumGrid(savedPosts)
             ) : (
               <div className="text-center text-[#A5A9BB] py-14 border-2 border-dashed border-[#292D40] rounded-[24px]">
                 No saved posts yet.
               </div>
             )}
           </>
        )}
      </div>

      {/* MODALS */}
      <ProfileEditModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onUpdate={(u) => setUser((p) => ({ ...p, ...u }))}
      />

      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
      />

      <Lightbox
        open={viewAvatar}
        images={[user.avatar]}
        index={0}
        onClose={() => setViewAvatar(false)}
      />

      {/* QR MODAL */}
      {qrOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center px-6 transition-opacity"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="bg-[#070B14]/95 p-6 rounded-3xl shadow-2xl border border-white/15 backdrop-blur-2xl transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <MyQR />
          </div>
        </div>
      )}

      {/* QR SCANNER */}
      {qrScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#070B14]/95 rounded-3xl p-5 relative shadow-2xl border border-white/15 backdrop-blur-2xl">
            <button
              className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors z-10"
              onClick={() => setQrScannerOpen(false)}
            >
              <FaTimes />
            </button>
            <ScanQR />
          </div>
        </div>
      )}
    </div>
  );
}
