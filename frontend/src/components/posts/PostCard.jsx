// frontend/src/components/posts/PostCard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API from "../../services/api";
import LazyImage from "../ui/LazyImage";
import { useToast } from "../ui/ToastProvider";
import ConfirmModal from "../ui/ConfirmModal";
import { useSelector } from "react-redux";

const PostCard = ({ post: initialPost }) => {
  const [post, setPost] = useState(initialPost);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();
  const myId = localStorage.getItem("meId") || (useSelector(s => s.auth?.user?._id) || null);

  useEffect(() => setPost(initialPost), [initialPost]);

  const likedByMe = !!(post?.likes && post.likes.map(String).includes(myId));

  const toggleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.add('Login to like posts', { type: 'error' });
      return;
    }

    if (!post?._id) return;
    if (liking) return;
    setLiking(true);

    const prevLikes = post.likes || [];
    setPost((p) => {
      const copy = { ...p };
      copy.likes = likedByMe ? prevLikes.filter(id => String(id) !== myId) : [...prevLikes, myId];
      return copy;
    });

    try {
      const res = await API.put(`/posts/like/${post._id}`);
      const liked = res.data?.liked;
      setPost((p) => {
        const copy = { ...p };
        if (liked) {
          copy.likes = Array.from(new Set([...(p.likes || []).map(String), myId]));
        } else {
          copy.likes = (p.likes || []).map(String).filter(id => id !== myId);
        }
        return copy;
      });
      toast.add(liked ? "Liked" : "Unliked", { type: "info" });
    } catch (err) {
      setPost((p) => ({ ...p, likes: prevLikes }));
      toast.add(err.userMessage || "Failed to toggle like", { type: "error" });
    } finally {
      setLiking(false);
    }
  };

  const openComments = () => {
    if (!post?._id) return;
    window.dispatchEvent(new CustomEvent("openComments", { detail: post._id }));
  };

  const openView = () => {
    if (!post?._id) return;
    window.dispatchEvent(new CustomEvent("openViewPost", { detail: post._id }));
  };

  // Delete flow
  const canDelete = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null') || null; // optional stored user
      const role = user?.role || (useSelector(s => s.auth?.user?.role) || null);
      const uidFromRedux = useSelector(s => s.auth?.user?._id);
      // Owner or admin
      if (!post || !post.user) return false;
      const ownerId = (post.user._id || post.user) && String(post.user._id || post.user);
      const currentId = myId || uidFromRedux;
      if (!currentId) return false;
      if (ownerId === String(currentId)) return true;
      if (role === 'admin') return true;
      // fallback: if auth state has role
      const authUser = useSelector(s => s.auth?.user);
      if (authUser?.role === 'admin') return true;
      return false;
    } catch (e) {
      return false;
    }
  })();

  const doDelete = async () => {
    if (!post || !post._id) return;
    setDeleting(true);
    try {
      await API.delete(`/posts/${post._id}`);
      toast.add('Post deleted', { type: 'info' });

      // notify global listeners (Feed) to remove it from list
      window.dispatchEvent(new CustomEvent('postDeleted', { detail: post._id }));

      // Optionally close any open post views — signal to PostModal etc.
      window.dispatchEvent(new CustomEvent('postDeleted:close', { detail: post._id }));
    } catch (err) {
      console.error('delete post err', err);
      toast.add(err.userMessage || 'Failed to delete post', { type: 'error' });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (!post) return null;

  return (
    <>
      <motion.article layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-4 mb-4">
        <div className="flex items-start gap-4">
          <img src={post.user?.avatar || "/default-avatar.png"} className="w-12 h-12 rounded-full object-cover" alt={post.user?.name} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{post.user?.name}</div>
                <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-500">{(post.likes && post.likes.length) || 0} ❤️</div>
            </div>

            <p className="mt-3 text-sm leading-6">{post.content}</p>

            {post.images?.length > 0 && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {post.images.map((img, i) => (
                  <LazyImage key={`${post._id}-img-${i}`} src={img} alt={`post-${i}`} className="h-52 rounded-lg" />
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleLike}
                disabled={liking}
                className={`flex items-center gap-2 ${likedByMe ? "text-pink-500" : ""}`}
                aria-pressed={likedByMe}
              >
                <motion.span layout key={likedByMe ? "liked" : "unliked"} initial={{ scale: 0.8 }} animate={{ scale: likedByMe ? 1.15 : 1 }}>
                  {likedByMe ? "💗" : "🤍"}
                </motion.span>
                <span>{(post.likes && post.likes.length) || 0} Like</span>
              </motion.button>

              <button onClick={openComments} className="flex items-center gap-2">
                💬 <span>{(post.comments && post.comments.length) || 0} Comment</span>
              </button>

              <button
                onClick={() => {
                  if (!post._id) return;
                  const u = `${window.location.origin}/post/${post._id}`;
                  if (navigator.share) navigator.share({ title: post.content?.slice(0, 50) || "Post", url: u }).catch(() => {});
                  else navigator.clipboard?.writeText(u).then(() => toast.add("Link copied"));
                }}
                className="flex items-center gap-2"
              >
                🔗 Share
              </button>

              <button onClick={openView} className="ml-auto px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">View</button>

              {canDelete && (
                <button onClick={() => setConfirmOpen(true)} className="ml-2 px-3 py-1 rounded bg-red-600 text-white">
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.article>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete post?"
        description="This action will permanently delete the post. Are you sure you want to continue?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default PostCard;
