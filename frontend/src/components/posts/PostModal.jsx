// frontend/src/components/posts/PostModal.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import { useToast } from "../ui/ToastProvider";
import LazyImage from "../ui/LazyImage";
import Spinner from "../common/Spinner";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUtils";
import { FaTimes } from "react-icons/fa";

const fetchPost = async (id) => {
	const tryPaths = [`/posts/${id}`, `/post/${id}`, `/posts/post/${id}`];
	for (const p of tryPaths) {
		try {
			const r = await API.get(p);
			if (r?.data) return r.data?.data || r.data;
		} catch (e) { }
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
	
	if (loading || !post) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => onClose && onClose()}></div>
				<motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#070B14]/95 border border-white/15 rounded-3xl p-6 z-10 shadow-2xl backdrop-blur-2xl text-center">
					<div>{loading ? <Spinner /> : <span className="text-xs text-[#CBD5E1]">Broadcast could not be loaded.</span>}</div>
					<div className="mt-4">
						<button onClick={() => onClose && onClose()} className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white">Close</button>
					</div>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => onClose && onClose()} />
			<motion.div 
				initial={{ scale: 0.96, opacity: 0 }} 
				animate={{ scale: 1, opacity: 1 }} 
				className={`relative w-full max-w-5xl bg-[#070B14]/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 ${postMedia ? 'md:grid-cols-2' : 'md:grid-cols-1'} backdrop-blur-2xl`}
			>
				{/* Left: media */}
				{postMedia && (
					<div className="bg-black/60 flex items-center justify-center min-h-[50vh] md:min-h-0 border-b md:border-b-0 md:border-r border-white/10">
						{isImage ? (
							<LazyImage 
								src={getImageUrl(post.images[0], 'feed')} 
								alt="post media" 
								className="w-full h-full max-h-[70vh] object-contain" 
								style={{ maxHeight: '70vh' }}
							/>
						) : (post.videos && post.videos.length > 0 ? (
							<video src={getImageUrl(post.videos[0])} controls className="w-full h-full max-h-[70vh] object-cover" style={{ maxHeight: '70vh' }} />
						) : (
							<div className="p-6 text-center text-[#A5A9BB] text-xs">No media preview</div>
						))}
					</div>
				)}

				{/* Right: details */}
				<div className="p-6 flex flex-col max-h-[80vh] justify-between">
					<div>
						<div className="flex items-center gap-3 border-b border-white/10 pb-4">
							<Link to={`/profile/${post.user?._id}`}>
								<img 
									src={post.user?.avatar || "/default-avatar.png"} 
									className="w-10 h-10 rounded-full object-cover border border-white/10" 
									alt={post.user?.name}
								/>
							</Link>
							<div>
								<Link to={`/profile/${post.user?._id}`} className="font-bold text-sm text-[#F7F7FC] hover:text-[#00F2FE] transition">{post.user?.name}</Link>
								<div className="text-[11px] text-[#A5A9BB]">{new Date(post.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</div>
							</div>
							<div className="ml-auto">
								<button onClick={() => onClose && onClose()} className="p-1.5 text-[#A5A9BB] hover:text-white transition">
									<FaTimes size={14} />
								</button>
							</div>
						</div>

						<div className="mt-4 text-xs flex-1 overflow-y-auto pr-2 leading-relaxed">
							<div className="mb-4 whitespace-pre-wrap text-[#F7F7FC] text-sm">{post.content}</div>

							{/* Comments Section */}
							<div className="mt-4 border-t border-white/5 pt-3">
								<div className="text-xs font-bold text-[#A5A9BB] mb-3 uppercase tracking-wider">Responses ({post.comments?.length || 0})</div>
								{(post.comments || []).length === 0 ? (
									<div className="text-xs text-[#A5A9BB] py-4">No comments on this broadcast yet.</div>
								) : (
									<div className="space-y-3">
										{(post.comments || []).map(c => (
											<div key={c._id || `${c.user?._id}-${c.createdAt}`} className="flex items-start gap-3 bg-[#171A26]/60 p-3 rounded-2xl border border-white/5">
												<img src={c.user?.avatar || "/default-avatar.png"} className="w-7 h-7 rounded-full border border-white/10" alt="avatar" />
												<div className="min-w-0 flex-1">
													<div className="text-xs">
														<Link to={`/profile/${c.user?._id}`} className="font-bold text-[#F7F7FC] hover:text-[#00F2FE] transition mr-2">
															{c.user?.name}
														</Link>
														<span className="text-[#CBD5E1]">{c.text || c.content}</span>
													</div>
													<div className="text-[10px] text-[#A5A9BB] mt-1">{new Date(c.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Footer Actions */}
					<div className="mt-4 border-t border-white/10 pt-4 flex gap-2">
						<button 
							className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white text-xs font-bold shadow-md hover:opacity-95 transition" 
							onClick={() => {
								const u = `${window.location.origin}/post/${post._id}`;
								if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => addToast("Link copied", { type: 'success' }));
							}}
						>
							Copy Link
						</button>
						<button 
							className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#CBD5E1] hover:bg-white/5 transition" 
							onClick={() => {
								window.dispatchEvent(new CustomEvent("openComments", { detail: post._id }));
							}}
						>
							Add Response
						</button>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default PostModal;
