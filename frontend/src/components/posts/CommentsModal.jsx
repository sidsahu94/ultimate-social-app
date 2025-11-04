// frontend/src/components/posts/CommentsModal.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import { useToast } from "../ui/ToastProvider";

const fetchPost = async (id) => {
  // try the most likely path first
  const tryPaths = [`/posts/${id}`, `/post/${id}`, `/posts/post/${id}`];
  for (const p of tryPaths) {
    try {
      const r = await API.get(p);
      if (r?.data) return r.data;
    } catch (e) {
      // continue
    }
  }
  throw new Error("Post not found");
};

const postComment = async (postId, content) => {
  // Try first the general /comments route (common shape), then fallbacks
  const tried = [
    { path: "/comments", body: { postId, content } },
    { path: `/comments/${postId}`, body: { content } },
    { path: `/posts/${postId}/comment`, body: { content } },
    { path: `/posts/comment/${postId}`, body: { content } },
  ];
  for (const t of tried) {
    try {
      const r = await API.post(t.path, t.body);
      if (r?.data) return r.data;
    } catch (e) {
      // try next
    }
  }
  throw new Error("Failed to add comment");
};

const CommentsModal = ({ postId, isOpen, onClose, onCommentAdded }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const { add } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    if (!postId) {
      add("Invalid post", { type: "error" });
      onClose && onClose();
      return;
    }
    setLoading(true);
    fetchPost(postId)
      .then((p) => setPost(p))
      .catch((err) => {
        console.error("load post for comments err", err);
        add("Failed to load comments", { type: "error" });
        onClose && onClose();
      })
      .finally(() => setLoading(false));
  }, [isOpen, postId, add, onClose]);

  if (!isOpen) return null;
  if (loading) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await postComment(postId, content);
      add("Comment added", { type: "info" });
      setContent("");
      const p = await fetchPost(postId);
      setPost(p);
      onCommentAdded && onCommentAdded();
    } catch (err) {
      console.error("add comment err", err);
      add(err.message || "Failed to add comment", { type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (!sending) onClose(); }} />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl p-4 z-10">
        <div className="flex items-center gap-3 mb-3">
          <img src={post?.user?.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full" alt="author" />
          <div>
            <div className="font-semibold">{post?.user?.name}</div>
            <div className="text-xs text-gray-500">{new Date(post?.createdAt).toLocaleString()}</div>
          </div>
          <button className="ml-auto" onClick={() => { if (!sending) onClose(); }}>✕</button>
        </div>

        <div className="mb-3 text-sm">{post?.content}</div>

        <div className="max-h-60 overflow-y-auto space-y-3 mb-3">
          {(post?.comments || []).map((c) => (
            <div key={c._id || `${c.user?._id}-${c.createdAt}`} className="flex items-start gap-3">
              <img src={c.user?.avatar || "/default-avatar.png"} className="w-8 h-8 rounded-full" />
              <div>
                <div className="text-sm"><span className="font-semibold mr-2">{c.user?.name}</span>{c.content}</div>
                <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a comment..." className="flex-1 p-2 border rounded" />
          <button disabled={sending} className="px-3 py-2 rounded bg-gradient-to-r from-indigo-600 to-pink-500 text-white">
            {sending ? "Posting..." : "Post"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CommentsModal;
