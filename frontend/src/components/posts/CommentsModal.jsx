// frontend/src/components/posts/CommentsModal.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../ui/ToastProvider";
import socket from '../../services/socket';
import UserAvatar from "../ui/UserAvatar";
import { FaTrash, FaHeart, FaRegHeart, FaTimes, FaReply } from "react-icons/fa";
import { useSelector } from "react-redux"; 
import { getImageUrl } from "../../utils/imageUtils"; 
import AudioRecorder from "../chat/AudioRecorder"; 
import { playSound } from "../../utils/soundEffects";

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '✨', '💎', '🙌', '💯', '😍', '🚀'];

const CommentsModal = ({ postId, isOpen, onClose }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [audioFile, setAudioFile] = useState(null);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const inputRef = useRef(null);
    const { add } = useToast();
    const myId = useSelector(s => s.auth.user?._id);

    // Socket Logic
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
                comments: (prev?.comments || []).filter(c => c._id !== commentId)
            }));
        };

        socket.on('comment:created', onNewComment);
        socket.on('comment:deleted', onDeleteComment); 

        return () => {
            socket.off('comment:created', onNewComment);
            socket.off('comment:deleted', onDeleteComment);
        };
    }, [postId, post, myId]); 

    const loadComments = async (isReset = false) => {
        const p = isReset ? 0 : page;
        if (isReset) setLoading(true);

        try {
            const res = await API.get(`/comments/${postId}?page=${p}`);
            const payload = res.data?.data || res.data;
            const newComments = Array.isArray(payload) ? payload : [];
            
            if (newComments.length < 20) setHasMore(false);
            
            if (isReset) {
                setPost(prev => ({ ...prev, comments: newComments }));
            } else {
                setPost(prev => ({
                    ...prev,
                    comments: [...(prev?.comments || []), ...newComments]
                }));
            }
            setPage(p + 1);
        } catch(e) {
            if (isReset) {
                try {
                    const r = await API.get(`/posts/${postId}`);
                    const postPayload = r.data?.data || r.data;
                    setPost(postPayload);
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

    const submit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !audioFile) return;

        setSending(true);
        playSound('cyber');

        try {
            let audioUrl = null;

            if (audioFile) {
                const fd = new FormData();
                fd.append('media', audioFile); 
                const upRes = await API.post('/extra/upload', fd);
                audioUrl = upRes.data?.url || upRes.data?.data?.url;
            }

            const res = await API.post(`/comments/${postId}`, { 
                text: content, 
                audio: audioUrl 
            });

            const createdComment = res.data?.data || res.data;

            setPost(prev => ({
                ...prev,
                comments: [createdComment, ...(prev?.comments || [])]
            }));

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
        if(!window.confirm("Delete comment?")) return;
        try {
            await API.delete(`/comments/${commentId}`);
            setPost(prev => ({
                ...prev,
                comments: (prev?.comments || []).filter(c => c._id !== commentId)
            }));
            add("Comment deleted", { type: "info" });
        } catch(e) {
            add("Failed to delete", { type: "error" });
        }
    };

    const toggleCommentLike = async (commentId, likesArray) => {
        playSound('pop');
        setPost(prev => ({
            ...prev,
            comments: (prev?.comments || []).map(c => {
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

    const handleReplyTo = (username) => {
        if (!username) return;
        setContent(prev => `@${username} ${prev.replace(/@\w+\s?/, '')}`);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleInsertEmoji = (emoji) => {
        playSound('pop');
        setContent(prev => prev + emoji);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in">
            <motion.div 
              initial={{ y: 25, opacity: 0, scale: 0.98 }} 
              animate={{ y: 0, opacity: 1, scale: 1 }} 
              exit={{ y: 25, opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg bg-[#070B14]/95 border border-white/15 rounded-[32px] flex flex-col max-h-[85vh] shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-3xl"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-[#0A111E]/80 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#00F2FE] animate-pulse" />
                        <h3 className="font-bold text-sm text-[#F7F7FC] tracking-wide font-display">Community Dialogue</h3>
                    </div>
                    <button 
                      onClick={onClose} 
                      className="p-1.5 rounded-full text-[#A5A9BB] hover:text-[#F7F7FC] hover:bg-white/10 transition"
                    >
                      <FaTimes size={15} />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                    {loading && <div className="text-center py-8 text-xs text-[#A5A9BB] animate-pulse">Loading dialogue matrix...</div>}
                    
                    {!loading && (!post?.comments || post.comments.length === 0) && (
                        <div className="text-[#A5A9BB] text-center py-16 text-xs flex flex-col items-center justify-center">
                            <span className="text-3xl mb-2">💬</span>
                            <span>No comments yet. Start the conversation!</span>
                        </div>
                    )}
                    
                    {(post?.comments || []).map((c) => {
                        const isLiked = c.likes?.includes(myId);
                        const isOwner = String(c.user?._id) === String(myId) || String(post?.user?._id) === String(myId);
                        
                        return (
                            <div key={c._id} className="flex gap-3 group">
                                <UserAvatar 
                                  src={c.user?.avatar} 
                                  name={c.user?.name} 
                                  userId={c.user?._id} 
                                  className="w-8 h-8 flex-shrink-0 border border-white/15" 
                                />
                                <div className="flex-1">
                                    <div className="bg-[#0A111E]/90 border border-white/10 p-3.5 rounded-2xl rounded-tl-none relative pr-8 transition-colors hover:border-white/20">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-bold text-xs text-[#F7F7FC]">{c.user?.name}</span>
                                            <button
                                                onClick={() => handleReplyTo(c.user?.username || c.user?.name)}
                                                className="text-[10px] text-[#00F2FE] hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <FaReply size={9} /> Reply
                                            </button>
                                        </div>
                                        
                                        {/* Display Text */}
                                        {c.text && <div className="text-xs text-[#CBD5E1] leading-relaxed break-words">{c.text}</div>}
                                        
                                        {/* Display Audio Note */}
                                        {c.audio && (
                                            <div className="mt-2">
                                                <audio controls src={getImageUrl(c.audio)} className="w-full h-8 rounded-lg" />
                                            </div>
                                        )}
                                        
                                        {/* Like Button */}
                                        <button 
                                            onClick={() => toggleCommentLike(c._id, c.likes)}
                                            className="absolute bottom-2.5 right-3 text-xs flex items-center gap-1 transition active:scale-125"
                                        >
                                            {isLiked ? (
                                                <FaHeart className="text-[#10B981]" />
                                            ) : (
                                                <FaRegHeart className="text-[#A5A9BB] hover:text-[#10B981]" />
                                            )}
                                            <span className="text-[10px] text-[#A5A9BB] font-mono">{c.likes?.length || 0}</span>
                                        </button>

                                        {/* Delete Button for Author */}
                                        {isOwner && (
                                            <button 
                                                onClick={() => deleteComment(c._id)}
                                                className="absolute top-2.5 right-2.5 text-[#A5A9BB] hover:text-[#F87171] opacity-0 group-hover:opacity-100 transition p-1 hover:bg-[#052E24]/20 rounded"
                                                title="Delete comment"
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-[#A5A9BB] mt-1 ml-1 font-mono">
                                        {new Date(c.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Load More Button */}
                    {!loading && hasMore && (post?.comments?.length > 0) && (
                        <button 
                            onClick={() => loadComments(false)}
                            className="w-full py-2.5 text-xs text-[#00F2FE] font-semibold hover:bg-white/5 transition rounded-xl border border-white/5"
                        >
                            Load earlier comments
                        </button>
                    )}
                </div>

                {/* Input & Quick Reactions Area */}
                <div className="p-3.5 border-t border-white/10 bg-[#070B14]">
                    {/* Quick Emojis Strip */}
                    <div className="flex items-center gap-1 mb-2 px-1 overflow-x-auto no-scrollbar">
                        {QUICK_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => handleInsertEmoji(emoji)}
                                className="text-sm px-1.5 py-1 rounded-lg hover:bg-white/10 transition hover:scale-125 active:scale-95"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {audioFile ? (
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0F766E]/20 text-[#00F2FE] rounded-full border border-[#0F766E]/30 text-xs font-bold animate-pulse whitespace-nowrap">
                               <span>🎵 Audio Note Ready</span>
                                <button 
                                   type="button"
                                   onClick={() => setAudioFile(null)} 
                                   className="text-[#F87171] hover:opacity-80 ml-1 p-0.5"
                               >
                                   <FaTimes size={10} />
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
                                ref={inputRef}
                                value={content} 
                                onChange={(e) => setContent(e.target.value)} 
                                placeholder={audioFile ? "Add caption (optional)..." : "Write a comment..."}
                                className="flex-1 bg-[#0A111E] border border-white/15 rounded-full px-4 py-2.5 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] focus:outline-none focus:border-[#00F2FE] transition" 
                            />
                            <button 
                              type="submit"
                              disabled={sending || (!content.trim() && !audioFile)} 
                              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white font-bold text-xs disabled:opacity-40 transition hover:scale-105 active:scale-95 shadow-md"
                            >
                              Post
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CommentsModal;
