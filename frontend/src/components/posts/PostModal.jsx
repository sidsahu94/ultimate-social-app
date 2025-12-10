// frontend/src/components/posts/PostModal.jsximport React, { useEffect, useState } from "react";
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import { useToast } from "../ui/ToastProvider";
import LazyImage from "../ui/LazyImage";
import Spinner from "../common/Spinner";
import { Link } from "react-router-dom";

// Centralized post fetching logic
const fetchPost = async (id) => {
	const tryPaths = [`/posts/${id}`, `/post/${id}`, `/posts/post/${id}`];
	for (const p of tryPaths) {
		try {
			const r = await API.get(p);
			if (r?.data) return r.data;
		} catch (e) {
			// ignore specific error, try next path
		}
	}
	throw new Error("Post not found");
};


const PostModal = ({ postId, isOpen, onClose }) => {
	const [post, setPost] = useState(null);
	const [loading, setLoading] = useState(true);
	const { add: addToast } = useToast();

	useEffect(() => {
		if (!isOpen || !postId) {
			setPost(null);
			setLoading(true);
			return;
		}
		
		setLoading(true);
		fetchPost(postId)
			.then(p => setPost(p))
			.catch(err => {
				console.error("load post for view err", err);
				addToast("Failed to load post", { type: "error" });
				onClose && onClose();
			})
			.finally(() => setLoading(false));

	}, [isOpen, postId, addToast, onClose]);

	if (!isOpen) return null;
	
	const postMedia = (post?.images || []).length > 0 || (post?.videos || []).length > 0;
	const isImage = (post?.images || []).length > 0;
	
	// Separate error state/view
	if (loading || !post) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="absolute inset-0 bg-black/50" onClick={() => onClose && onClose()}></div>
				<motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-lg p-6 z-10 card">
					<div className="text-center">{loading ? <Spinner /> : "Post could not be loaded."}</div>
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
			<motion.div 
				initial={{ scale: 0.96, opacity: 0 }} 
				animate={{ scale: 1, opacity: 1 }} 
				className={`relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden grid grid-cols-1 ${postMedia ? 'md:grid-cols-2' : 'md:grid-cols-1'} card`}
			>
				{/* Left: media */}
				{postMedia && (
					<div className="bg-black/5 flex items-center justify-center min-h-[50vh] md:min-h-0">
						{isImage ? (
							<LazyImage 
								src={post.images[0]} 
								alt="post media" 
								className="w-full h-full max-h-[70vh] object-contain" 
								style={{ maxHeight: '70vh' }}
							/>
						) : (post.videos && post.videos.length > 0 ? (
							<video src={post.videos[0]} controls className="w-full h-full max-h-[70vh] object-cover" style={{ maxHeight: '70vh' }} />
						) : (
							<div className="p-6 text-center text-gray-400">No media</div>
						))}
					</div>
				)}

				{/* Right: details */}
				<div className="p-4 flex flex-col max-h-[80vh]">
					<div className="flex items-center gap-3 border-b pb-3">
						<Link to={`/profile/${post.user?._id}`}>
							<img 
								src={post.user?.avatar || "/default-avatar.png"} 
								className="w-10 h-10 rounded-full object-cover" 
								alt={post.user?.name}
							/>
						</Link>
						<div>
							<Link to={`/profile/${post.user?._id}`} className="font-semibold hover:text-indigo-500">{post.user?.name}</Link>
							<div className="text-xs text-gray-500 dark:text-gray-400">{new Date(post.createdAt).toLocaleString()}</div>
						</div>
						<div className="ml-auto">
							<button onClick={() => onClose && onClose()} className="px-2 py-1 text-gray-500 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">Close</button>
						</div>
					</div>

					<div className="mt-3 text-sm flex-1 overflow-y-auto pr-2">
						<div className="mb-4 whitespace-pre-wrap">{post.content}</div>

						{/* Comments Section */}
						<div className="mt-4">
							<div className="text-sm font-medium mb-2 border-t pt-2">Comments ({post.comments?.length || 0})</div>
							{(post.comments || []).length === 0 ? (
								<div className="text-sm text-gray-400">No comments yet.</div>
							) : (
								<div className="space-y-3">
									{(post.comments || []).map(c => (
										<div key={c._id || `${c.user?._id}-${c.createdAt}`} className="flex items-start gap-3">
											<img src={c.user?.avatar || "/default-avatar.png"} className="w-8 h-8 rounded-full" />
											<div>
												<div className="text-sm">
													<Link to={`/profile/${c.user?._id}`} className="font-semibold hover:text-indigo-500 transition mr-2">
														{c.user?.name}
													</Link>
													{c.content}
												</div>
												<div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Footer Actions */}
					<div className="mt-4 border-t pt-3">
						<button className="btn-primary mr-2 text-sm" onClick={() => {
							const u = `${window.location.origin}/post/${post._id}`;
							if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => addToast("Link copied"));
						}}>Copy link</button>
						<button className="px-4 py-2 rounded border text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition" onClick={() => {
							window.dispatchEvent(new CustomEvent("openComments", { detail: post._id }));
						}}>Add comment</button>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default PostModal;