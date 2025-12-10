import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import { useToast } from "../ui/ToastProvider";
import socket from '../../services/socket';
import UserAvatar from "../ui/UserAvatar"; // Updated to use the new Avatar component

const fetchPost = async (id) => {
	const tryPaths = [`/posts/${id}`, `/post/${id}`, `/posts/post/${id}`];
	for (const p of tryPaths) {
		try {
			const r = await API.get(p);
			if (r?.data) return r.data;
		} catch (e) {}
	}
	throw new Error("Post not found");
};

const postComment = async (postId, content) => {
    // Ensuring we hit the specific route defined in server.js
	const r = await API.post(`/comments/${postId}`, { text: content });
    return r.data;
};

const CommentsModal = ({ postId, isOpen, onClose, onCommentAdded }) => {
	const [post, setPost] = useState(null);
	const [loading, setLoading] = useState(false);
	const [content, setContent] = useState("");
	const [sending, setSending] = useState(false);
	const { add } = useToast();

	useEffect(() => {
		if (!postId) return;

		socket.emit('joinRoom', { room: `post:${postId}` });

        // --- FIX: Changed event name from 'post:comment' to 'comment:created' ---
		const onNewComment = (newComment) => {
            // Check if this comment belongs to current post (backend sends the whole comment obj)
			if (newComment.post === postId || newComment.postId === postId || (post && post._id === postId)) {
				setPost(prev => ({
                    ...prev,
                    comments: [newComment, ...(prev?.comments || [])],
                    commentsCount: (prev?.commentsCount || 0) + 1
                }));
			}
		};

		socket.on('comment:created', onNewComment);

		return () => {
			socket.off('comment:created', onNewComment);
		};
	}, [postId]);

	useEffect(() => {
		if (!isOpen) return;
		if (!postId) {
			onClose && onClose();
			return;
		}
		setLoading(true);
		fetchPost(postId)
			.then((p) => setPost(p))
			.catch((err) => {
				add("Failed to load comments", { type: "error" });
				onClose && onClose();
			})
			.finally(() => setLoading(false));
	}, [isOpen, postId, add, onClose]);

	if (!isOpen) return null;

	const submit = async (e) => {
		e.preventDefault();
		if (!content.trim()) return;
		setSending(true);
		try {
			// API call (Backend emits socket event automatically)
            await postComment(postId, content); 
			add("Comment added", { type: "info" });
			setContent("");
			onCommentAdded && onCommentAdded();
		} catch (err) {
			console.error("add comment err", err);
			add(err.message || "Failed to add comment", { type: "error" });
		} finally {
			setSending(false);
		}
	};

	if (loading) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50" onClick={() => { if (!sending) onClose(); }} />
			<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl p-4 z-10 card flex flex-col max-h-[80vh]">
				<div className="flex items-center gap-3 mb-3 border-b pb-3">
                    <UserAvatar src={post?.user?.avatar} name={post?.user?.name} />
					<div>
						<div className="font-semibold">{post?.user?.name}</div>
						<div className="text-xs text-gray-500">{new Date(post?.createdAt).toLocaleString()}</div>
					</div>
					<button className="ml-auto text-gray-500 hover:text-red-500 transition" onClick={() => { if (!sending) onClose(); }}>✕</button>
				</div>
				
				<div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded mb-4 text-sm">{post?.content}</div>
                    <h4 className="font-bold text-sm">Comments</h4>
					{(!post?.comments || post?.comments.length === 0) && <div className="text-gray-400 text-center py-4">No comments yet.</div>}
					{(post?.comments || []).map((c) => (
						<div key={c._id || Math.random()} className="flex items-start gap-3">
                            <UserAvatar src={c.user?.avatar} name={c.user?.name} className="w-8 h-8" />
							<div>
								<div className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-lg rounded-tl-none">
                                    <span className="font-semibold mr-2">{c.user?.name}</span>
                                    {c.content || c.text}
                                </div>
								<div className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleString()}</div>
							</div>
						</div>
					))}
				</div>

				<form onSubmit={submit} className="flex gap-2 pt-2 border-t">
					<input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a comment..." className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
					<button disabled={sending} className="btn-primary">
						{sending ? "..." : "Post"}
					</button>
				</form>
			</motion.div>
		</div>
	);
};

export default CommentsModal;