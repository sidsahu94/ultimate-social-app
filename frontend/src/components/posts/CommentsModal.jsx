// frontend/src/components/posts/CommentsModal.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import { useToast } from "../ui/ToastProvider";
import socket from '../../services/socket';
import UserAvatar from "../ui/UserAvatar";
import { FaTrash, FaHeart, FaRegHeart, FaTimes } from "react-icons/fa"; // Added FaTimes
import { useSelector } from "react-redux"; 

// 🔥 Import AudioRecorder
import AudioRecorder from "../chat/AudioRecorder"; 

const CommentsModal = ({ postId, isOpen, onClose }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    
    // 🔥 NEW: State to hold audio blob before uploading
    const [audioFile, setAudioFile] = useState(null);

    // Pagination State
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const { add } = useToast();
    const myId = useSelector(s => s.auth.user?._id);

    // --- Socket Logic (Real-time updates) ---
    useEffect(() => {
        if (!postId) return;
        socket.emit('joinRoom', { room: `post:${postId}` });
        
        const onNewComment = (newComment) => {
            if (newComment.user?._id === myId || newComment.user === myId) {
                return;
            }

            if (newComment.post === postId || (post && post._id === postId)) {
                setPost(prev => ({
                    ...prev,
                    comments: [newComment, ...(prev?.comments || [])],
                }));
            }
        };
        
        const onDeleteComment = ({ commentId }) => {
            setPost(prev => ({
                ...prev,
                comments: prev.comments.filter(c => c._id !== commentId)
            }));
        };

        socket.on('comment:created', onNewComment);
        socket.on('comment:deleted', onDeleteComment); 

        return () => {
            socket.off('comment:created', onNewComment);
            socket.off('comment:deleted', onDeleteComment);
        };
    }, [postId, post, myId]); 

    // --- Load Comments with Pagination ---
    const loadComments = async (isReset = false) => {
        const p = isReset ? 0 : page;
        if (isReset) setLoading(true);

        try {
            const res = await API.get(`/comments/${postId}?page=${p}`);
            const newComments = res.data;
            
            if (newComments.length < 20) setHasMore(false);
            
            if (isReset) {
                setPost(prev => ({ ...prev, comments: newComments }));
            } else {
                setPost(prev => ({
                    ...prev,
                    comments: [...(prev.comments || []), ...newComments]
                }));
            }
            setPage(p + 1);
        } catch(e) {
            if (isReset) {
                try {
                    const r = await API.get(`/posts/${postId}`);
                    setPost(r.data);
                    setHasMore(false); 
                } catch (err) { onClose(); }
            }
        } finally {
            if (isReset) setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && postId) {
            setPage(0);
            setHasMore(true);
            loadComments(true);
        }
    }, [isOpen, postId]);

    // --- 🔥 UPDATED: SUBMIT COMMENT (Text + Optional Audio) ---
    const submit = async (e) => {
        e.preventDefault();
        
        // Validation: Must have text OR audio
        if (!content.trim() && !audioFile) return;

        setSending(true);

        try {
            let audioUrl = null;

            // 1. Upload Audio if exists
            if (audioFile) {
                const fd = new FormData();
                fd.append('media', audioFile); 
                const upRes = await API.post('/extra/upload', fd);
                audioUrl = upRes.data.url;
            }

            // 2. Submit Comment (Content + Audio URL)
            const res = await API.post(`/comments/${postId}`, { 
                text: content, 
                audio: audioUrl 
            });

            // 3. Update UI
            setPost(prev => ({
                ...prev,
                comments: [res.data, ...(prev.comments || [])]
            }));

            // Reset Form
            setContent("");
            setAudioFile(null);

        } catch (err) {
            add("Failed to comment", { type: "error" });
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const deleteComment = async (commentId) => {
        if(!confirm("Delete comment?")) return;
        try {
            await API.delete(`/comments/${commentId}`);
            setPost(prev => ({
                ...prev,
                comments: prev.comments.filter(c => c._id !== commentId)
            }));
            add("Comment deleted", { type: "info" });
        } catch(e) {
            add("Failed to delete", { type: "error" });
        }
    };

    const toggleCommentLike = async (commentId, likesArray) => {
        setPost(prev => ({
            ...prev,
            comments: prev.comments.map(c => {
                if (c._id === commentId) {
                    const isLiked = c.likes?.includes(myId);
                    return {
                        ...c,
                        likes: isLiked 
                            ? c.likes.filter(id => id !== myId)
                            : [...(c.likes || []), myId]
                    };
                }
                return c;
            })
        }));

        try {
            await API.post(`/comments/like/${commentId}`);
        } catch (e) { }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl flex flex-col max-h-[80vh] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold">Comments</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl leading-none">&times;</button>
                </div>
                
                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading && <div className="text-center py-4 text-gray-500">Loading comments...</div>}
                    
                    {!loading && (!post?.comments || post.comments.length === 0) && (
                        <div className="text-gray-500 text-center py-4">No comments yet.</div>
                    )}
                    
                    {(post?.comments || []).map((c) => {
                        const isLiked = c.likes?.includes(myId);
                        
                        return (
                            <div key={c._id} className="flex gap-3 group">
                                <UserAvatar src={c.user?.avatar} name={c.user?.name} className="w-8 h-8 flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none relative pr-8">
                                        <div className="font-bold text-xs mb-1">{c.user?.name}</div>
                                        
                                        {/* Display Text */}
                                        {c.text && <div className="text-sm text-gray-800 dark:text-gray-200">{c.text}</div>}
                                        
                                        {/* Display Audio */}
                                        {c.audio && (
                                            <div className="mt-2">
                                                <audio controls src={c.audio} className="w-full h-8" />
                                            </div>
                                        )}
                                        
                                        <button 
                                            onClick={() => toggleCommentLike(c._id, c.likes)}
                                            className="absolute bottom-2 right-3 text-xs flex items-center gap-1 transition"
                                        >
                                            {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-400 hover:text-red-500" />}
                                            <span className="text-gray-400">{c.likes?.length || 0}</span>
                                        </button>

                                        {(String(c.user?._id) === String(myId) || String(post?.user?._id) === String(myId)) && (
                                            <button 
                                                onClick={() => deleteComment(c._id)}
                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 ml-1">
                                        {new Date(c.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Load More Button */}
                    {!loading && hasMore && (post?.comments?.length > 0) && (
                        <button 
                            onClick={() => loadComments(false)}
                            className="w-full py-2 text-sm text-indigo-500 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition rounded-lg"
                        >
                            Load more comments
                        </button>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-2">
                        
                        {/* 🔥 Audio Recorder with Staged File State */}
                        {audioFile ? (
                           <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800 text-xs font-bold animate-pulse whitespace-nowrap">
                               <span>🎵 Voice Note Ready</span>
                               <button 
                                   type="button"
                                   onClick={() => setAudioFile(null)} 
                                   className="text-red-500 hover:text-red-700 ml-1 p-1"
                               >
                                   <FaTimes />
                               </button>
                           </div>
                        ) : (
                           <AudioRecorder 
                               chatId="comment_temp"
                               onFileReady={(file) => setAudioFile(file)} 
                           />
                        )}

                        <form onSubmit={submit} className="flex-1 flex gap-2">
                            <input 
                                value={content} 
                                onChange={(e) => setContent(e.target.value)} 
                                placeholder={audioFile ? "Add text (optional)..." : "Write a comment..."}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white" 
                            />
                            <button disabled={sending || (!content && !audioFile)} className="text-indigo-600 font-bold px-3 disabled:opacity-50">Post</button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CommentsModal;