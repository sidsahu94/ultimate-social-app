// frontend/src/pages/posts/PostPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom"; // 🔥 Import useSearchParams
import API from "../../services/api";
import PostCard from "../../components/posts/PostCard";
import SkeletonPost from "../../components/ui/SkeletonPost";
import { useToast } from "../../components/ui/ToastProvider";

export default function PostPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams(); // 🔥 Get Query Params
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!id) {
        toast.add("Invalid post id", { type: "error" });
        setLoading(false);
        return;
      }
      try {
        const res = await API.get(`/posts/${id}`).catch(() => API.get(`/post/${id}`));
        setPost(res.data);

        // 🔥 FIX: Auto-open comments if query param exists
        if (searchParams.get('comments') === 'true') {
            // Slight delay to ensure modal mounts correctly and data is ready
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openComments', { detail: id }));
            }, 500);
        }

      } catch (err) {
        console.error("load single post err", err);
        toast.add("Failed to load post", { type: "error" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, toast, searchParams]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      {loading ? <SkeletonPost /> : (
        post ? <PostCard post={post} /> : <div className="card p-6 text-center text-gray-500">Post not found</div>
      )}
    </div>
  );
}