import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FaHeart, 
  FaRegHeart, 
  FaComment, 
  FaShare, 
  FaBookmark, 
  FaRegBookmark, 
  FaEllipsisH 
} from "react-icons/fa";
import { motion } from "framer-motion";
import API from "../../services/api";
import { useSelector } from "react-redux";
import { useToast } from "../ui/ToastProvider";
import UserAvatar from "../ui/UserAvatar"; 

export default function PostCard({ post: initialPost }) {
  const myId = useSelector((s) => s.auth.user?._id);
  const [post, setPost] = useState(initialPost);
  const [liking, setLiking] = useState(false);
  const [saved, setSaved] = useState(false);
  const { add: addToast } = useToast();

  useEffect(() => setPost(initialPost), [initialPost]);

  // --- Voting Logic ---
  const handleVote = async (index) => {
    try {
      const res = await API.post(`/polls/${post._id}/vote/${index}`);
      setPost(res.data); // Update local state with new poll data
      addToast("Vote recorded!", { type: "success" });
    } catch (err) {
      addToast(err.userMessage || "Failed to vote", { type: "error" });
    }
  };

  // --- Like Logic ---
  const toggleLike = async () => {
    if (!post?._id || liking) return;
    setLiking(true);
    
    // Optimistic Update
    const isLiked = post.likes.includes(myId);
    setPost(p => ({
        ...p,
        likes: isLiked ? p.likes.filter(id => id !== myId) : [...p.likes, myId]
    }));
    
    try {
      await API.put(`/posts/like/${post._id}`);
    } catch (err) {
      setPost(initialPost); // Revert on failure
    } finally {
      setLiking(false);
    }
  };

  // --- Calculations & Helper Variables ---
  const likedByMe = post?.likes?.includes(myId);
  const images = post.images || post.media?.filter(m => m.type === 'image').map(m => m.url) || [];
  const videos = post.videos || post.media?.filter(m => m.type === 'video').map(m => m.url) || [];

  // --- FIX: Calculate totalVotes HERE (Top Level) ---
  // This ensures 'totalVotes' is available when the poll options map runs below.
  const totalVotes = post?.poll?.options?.reduce((acc, o) => acc + (o.votes?.length || 0), 0) || 0;

  return (
    <motion.article 
        layout 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.user?._id}`}>
            <UserAvatar src={post.user?.avatar} name={post.user?.name} className="w-10 h-10" />
          </Link>
          <div>
            <Link to={`/profile/${post.user?._id}`} className="font-bold text-sm hover:text-indigo-500 transition">
                {post.user?.name}
            </Link>
            <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600"><FaEllipsisH /></button>
      </div>

      {/* Content */}
      <div className="px-4 pb-2 text-sm leading-relaxed whitespace-pre-wrap dark:text-gray-200">
        {post.content}
      </div>

      {/* Media */}
      {images.length > 0 && (
        <div className="mt-2">
            <img 
                src={images[0]} 
                alt="Post content" 
                className="w-full max-h-[500px] object-cover"
                onDoubleClick={toggleLike}
            />
        </div>
      )}
      {videos.length > 0 && (
        <div className="mt-2">
            <video src={videos[0]} controls className="w-full max-h-[500px] object-cover bg-black" />
        </div>
      )}

      {/* Polls Section */}
      {post.poll && post.poll.options && (
        <div className="p-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                <h4 className="font-bold mb-3 text-sm">{post.poll.question}</h4>
                <div className="space-y-2">
                    {post.poll.options.map((opt, idx) => {
                        // Calculate percentage safely using the totalVotes calculated above
                        const percent = totalVotes === 0 ? 0 : Math.round(((opt.votes?.length || 0) / totalVotes) * 100);
                        const hasVoted = opt.votes?.includes(myId);

                        return (
                            <button 
                                key={idx} 
                                onClick={() => handleVote(idx)}
                                className={`relative w-full text-left p-3 rounded-lg text-sm font-medium transition overflow-hidden border ${hasVoted ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                {/* Progress Bar Background */}
                                <div 
                                    className="absolute top-0 left-0 bottom-0 bg-indigo-200 dark:bg-indigo-600/40 transition-all duration-500" 
                                    style={{ width: `${percent}%` }} 
                                />
                                
                                {/* Text Label (z-10 ensures it sits above the bar) */}
                                <div className="relative flex justify-between z-10">
                                    <span>{opt.text}</span>
                                    <span>{percent}%</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="mt-2 text-xs text-gray-500 text-right">
                    {new Date(post.poll.expiresAt) < new Date() ? "Poll Ended" : "Voting Open"}
                </div>
            </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
            <button onClick={toggleLike} className="flex items-center gap-2 group">
                <motion.div whileTap={{ scale: 0.8 }}>
                    {likedByMe ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-xl group-hover:text-gray-600" />}
                </motion.div>
                <span className="font-semibold text-sm">{post.likes?.length || 0}</span>
            </button>

            <button 
                onClick={() => window.dispatchEvent(new CustomEvent("openComments", { detail: post._id }))} 
                className="flex items-center gap-2 group"
            >
                <FaComment className="text-xl text-gray-500 group-hover:text-indigo-500 transition" />
                <span className="font-semibold text-sm">{post.comments?.length || 0}</span>
            </button>

            <button className="text-gray-500 hover:text-green-500 transition"><FaShare className="text-xl" /></button>
        </div>
        
        <button onClick={() => setSaved(!saved)}>
            {saved ? <FaBookmark className="text-indigo-600 text-xl" /> : <FaRegBookmark className="text-gray-500 text-xl" />}
        </button>
      </div>
    </motion.article>
  );
}