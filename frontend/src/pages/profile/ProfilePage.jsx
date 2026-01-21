// frontend/src/pages/profile/ProfilePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

import API from "../../services/api";

import PostGrid from "../../components/profile/PostGrid";
import FollowButton from "../../components/profile/FollowButton";
import FollowRequestButton from "../../components/profile/FollowRequestButton";
import ProfileEditModal from "../../components/profile/ProfileEditModal";
import CreatePostModal from "../../components/posts/CreatePostModal";

import Lightbox from "../../components/ui/Lightbox";
import UserAvatar from "../../components/ui/UserAvatar";

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

  if (loading)
    return (
      <div className="text-center p-10 text-slate-500 dark:text-slate-400">
        Loading profile...
      </div>
    );

  if (!user)
    return (
      <div className="text-center p-10 text-slate-500">Profile not found.</div>
    );

  return (
    <>
      {/* HEADER COVER */}
      <div className="relative h-52 md:h-64 rounded-b-3xl overflow-hidden shadow-lg bg-gray-300 dark:bg-gray-800 mb-24">
        <img
          src={user.coverPhoto || "/default-cover.jpg"}
          alt="cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

        {/* AVATAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute -bottom-20 left-5 md:left-10 cursor-pointer"
          onClick={() => setViewAvatar(true)}
        >
          <div className="p-[4px] rounded-full bg-gradient-to-br from-primary via-primary-glow to-secondary shadow-neon-blue">
            <UserAvatar
              src={user.avatar}
              name={user.name}
              className="w-36 h-36 border-4 border-white dark:border-bg-dark rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* USER DETAILS */}
      <div className="px-5 md:px-10 mt-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              {user.isVerified && (
                <FaCheckCircle className="text-primary-glow text-xl" />
              )}
            </div>

            <p className="text-slate-400 text-sm">@{user.email?.split("@")[0]}</p>

            {/* FOLLOW/POST COUNTS */}
            <div className="flex gap-6 mt-4 text-slate-600 dark:text-slate-300">
              <button
                onClick={() => navigate(`/profile/${id}?tab=posts`)}
                className="hover:text-primary smooth"
              >
                <span className="font-bold text-xl">{posts.length}</span> Posts
              </button>
              <button
                onClick={() => navigate(`/profile/${id}?tab=followers`)}
                className="hover:text-primary smooth"
              >
                <span className="font-bold text-xl">{followers.length}</span>{" "}
                Followers
              </button>
              <button
                onClick={() => navigate(`/profile/${id}?tab=following`)}
                className="hover:text-primary smooth"
              >
                <span className="font-bold text-xl">{following.length}</span>{" "}
                Following
              </button>
            </div>

            <p className="mt-4 max-w-xl text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {user.bio || "No bio available."}
            </p>

            {/* SOCIALS */}
            <div className="flex gap-3 mt-4 flex-wrap">
              {user.socialLinks?.twitter && (
                <a
                  href={user.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl text-blue-500 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 smooth"
                >
                  <FaTwitter />
                </a>
              )}

              {user.socialLinks?.instagram && (
                <a
                  href={user.socialLinks.instagram}
                  className="p-2 rounded-xl text-pink-500 bg-pink-100 dark:bg-pink-900/20 hover:bg-pink-200 smooth"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaInstagram />
                </a>
              )}

              {user.socialLinks?.linkedin && (
                <a
                  href={user.socialLinks.linkedin}
                  className="p-2 rounded-xl text-blue-700 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 smooth"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaLinkedin />
                </a>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 h-full">
            {isMe ? (
              <button
                onClick={() => setEditOpen(true)}
                className="px-6 py-3 rounded-xl border smooth hover:bg-white/50 dark:hover:bg-white/10"
              >
                Edit Profile
              </button>
            ) : (
              <FollowButton userId={id} />
            )}

            <button
              onClick={copyProfileLink}
              className="p-3 rounded-xl border smooth hover:bg-white/50 dark:hover:bg-white/10"
            >
              <FaShare />
            </button>

            <button
              onClick={() => setQrOpen(true)}
              className="p-3 rounded-xl border smooth hover:bg-white/50 dark:hover:bg-white/10"
            >
              <FaQrcode />
            </button>
          </div>
        </div>
      </div>

      {/* PROFILE COMPLETION BAR */}
      {isMe && <ProfileCompletion user={user} />}

      <ProfileHighlights isMe={isMe} userId={id} />

      {/* TABS */}
      <div className="mt-8 px-5 md:px-10 border-b border-white/20 dark:border-white/10 flex gap-8 overflow-x-auto no-scrollbar">
        {["posts", "followers", "following", ...(isMe ? ["saved"] : [])].map(
          (t) => (
            <button
              key={t}
              onClick={() => navigate(`/profile/${id}?tab=${t}`)}
              className={`py-4 text-sm font-bold relative smooth ${
                tab === t
                  ? "text-primary"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {t}
              {tab === t && (
                <motion.div
                  layoutId="profile-tab-underline"
                  className="h-[3px] bg-primary rounded-full absolute left-0 right-0 bottom-0 shadow-neon-blue"
                />
              )}
            </button>
          )
        )}
      </div>

      {/* CONTENT */}
      <div className="px-5 md:px-10 py-8 min-h-[300px]">
        {tab === "posts" && !isPrivateError && (
          <>
            {posts.length > 0 ? (
              <PostGrid posts={posts} />
            ) : (
              <div className="text-center text-slate-400 py-10 border-2 border-dashed rounded-xl">
                No posts yet.
                {isMe && (
                  <button
                    onClick={() => setCreatePostOpen(true)}
                    className="block mt-3 text-primary hover:underline"
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
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
          </>
        )}

        {isPrivateError && tab === "posts" && (
          <div className="flex flex-col items-center justify-center py-20 border rounded-3xl bg-white/40 dark:bg-black/20">
            <FaLock className="text-4xl text-gray-500 mb-4" />
            <p className="text-xl font-bold">This Account Is Private</p>
            <p className="text-sm text-slate-400">
              Follow this user to view posts.
            </p>
          </div>
        )}

        {tab === "followers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {followers.length > 0 ? (
              followers.map((u) => (
                <div
                  key={u._id}
                  className="neu-card flex items-center gap-3 p-3 bg-white dark:bg-bg-dark"
                >
                  <UserAvatar
                    src={u.avatar}
                    name={u.name}
                    className="w-12 h-12"
                    onClick={() => navigate(`/profile/${u._id}`)}
                  />
                  <div
                    className="flex-1 font-medium cursor-pointer"
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
              <p className="text-center text-slate-400">No followers yet.</p>
            )}
          </div>
        )}

        {tab === "following" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {following.length > 0 ? (
              following.map((u) => (
                <div
                  key={u._id}
                  className="neu-card flex items-center gap-3 p-3"
                >
                  <UserAvatar
                    src={u.avatar}
                    name={u.name}
                    className="w-12 h-12"
                    onClick={() => navigate(`/profile/${u._id}`)}
                  />
                  <div
                    className="flex-1 font-medium cursor-pointer"
                    onClick={() => navigate(`/profile/${u._id}`)}
                  >
                    {u.name}
                  </div>
                  <FollowRequestButton userId={u._id} onChange={() => {}} />
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400">No following yet.</p>
            )}
          </div>
        )}

        {tab === "saved" && isMe && (
          <PostGrid posts={savedPosts} />
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center px-6"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="bg-white dark:bg-bg-dark p-6 rounded-2xl shadow-xl smooth"
            onClick={(e) => e.stopPropagation()}
          >
            <MyQR />
          </div>
        </div>
      )}

      {/* QR SCANNER */}
      {qrScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-bg-dark rounded-xl p-4 relative">
            <button
              className="absolute top-2 right-2 p-2 bg-black/40 text-white rounded-full"
              onClick={() => setQrScannerOpen(false)}
            >
              <FaTimes />
            </button>
            <ScanQR />
          </div>
        </div>
      )}
    </>
  );
}
