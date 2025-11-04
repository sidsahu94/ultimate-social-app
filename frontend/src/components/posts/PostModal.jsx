// frontend/src/components/posts/PostModal.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import { useToast } from "../ui/ToastProvider";
import LazyImage from "../ui/LazyImage";

const PostModal = ({ postId, isOpen, onClose }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { add } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    if (!postId) {
      add("Invalid post", { type: "error" });
      onClose && onClose();
      return;
    }
    setLoading(true);
    (async () => {
      try {
        // try direct ID endpoint first
        const res = await API.get(`/posts/${postId}`);
        setPost(res.data);
      } catch (err) {
        // try fallbacks: /post/:id, /posts/post/:id
        try {
          const res2 = await API.get(`/post/${postId}`);
          setPost(res2.data);
        } catch (err2) {
          console.error("load post err", err2);
          add("Failed to load post", { type: "error" });
          onClose && onClose();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, postId, add, onClose]);

  if (!isOpen) return null;
  if (loading) return null;

  if (!post) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => onClose && onClose()}></div>
        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-lg p-6 z-10">
          <div className="text-center">Post could not be loaded.</div>
          <div className="mt-4 text-right">
            <button onClick={() => onClose && onClose()} className="px-3 py-2 rounded bg-indigo-600 text-white">Close</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => onClose && onClose()} />
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: media */}
        <div className="bg-black/5 flex items-center justify-center">
          {post.images && post.images.length > 0 ? (
            <LazyImage src={post.images[0]} alt="post media" className="w-full h-[70vh]" />
          ) : post.videos && post.videos.length > 0 ? (
            <video src={post.videos[0]} controls className="w-full h-[70vh] object-cover" />
          ) : (
            <div className="p-6 text-center">No media</div>
          )}
        </div>

        {/* Right: details */}
        <div className="p-4 flex flex-col">
          <div className="flex items-center gap-3">
            <img src={post.user?.avatar || "/default-avatar.png"} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <div className="font-semibold">{post.user?.name}</div>
              <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
            </div>
            <div className="ml-auto">
              <button onClick={() => onClose && onClose()} className="px-2 py-1 text-gray-500 rounded hover:bg-gray-100">Close</button>
            </div>
          </div>

          <div className="mt-3 text-sm flex-1 overflow-y-auto">
            <div className="mb-4">{post.content}</div>

            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Comments</div>
              {(post.comments || []).length === 0 ? <div className="text-sm text-gray-400">No comments yet.</div> :
                <div className="space-y-3">
                  {(post.comments || []).map(c => (
                    <div key={c._id || `${c.user?._id}-${c.createdAt}`} className="flex items-start gap-3">
                      <img src={c.user?.avatar || "/default-avatar.png"} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="text-sm"><span className="font-semibold">{c.user?.name}</span> {c.content}</div>
                        <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>

          <div className="mt-4">
            <button className="px-4 py-2 mr-2 rounded bg-gradient-to-r from-indigo-600 to-pink-500 text-white" onClick={() => {
              const u = `${window.location.origin}/post/${post._id}`;
              if (navigator.clipboard) navigator.clipboard.writeText(u).then(()=>add("Link copied"));
            }}>Copy link</button>
            <button className="px-4 py-2 rounded border" onClick={() => {
              window.dispatchEvent(new CustomEvent("openComments", { detail: post._id }));
            }}>Open comments</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PostModal;
