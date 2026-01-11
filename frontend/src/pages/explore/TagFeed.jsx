// frontend/src/pages/explore/TagFeed.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import PostCard from '../../components/posts/PostCard';
import { FaHashtag, FaArrowLeft, FaChartLine } from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';

export default function TagFeed() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Reuse search endpoint but filter strictly for tags
        // Backend 'searchPosts' logic handles hashtags automatically if query starts with #
        const r = await API.get(`/posts/search?q=%23${tag}`); // %23 is #
        setPosts(r.data || []);
        setStats({ count: r.data?.length || 0 });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tag]);

  return (
    <div className="max-w-3xl mx-auto p-4 pb-20">
      
      {/* Header Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition backdrop-blur-md">
            <FaArrowLeft />
        </button>
        
        <div className="absolute right-[-20px] bottom-[-20px] text-9xl opacity-20 rotate-12 pointer-events-none">
            <FaHashtag />
        </div>

        <div className="relative z-10 text-center mt-4">
            <h1 className="text-4xl font-black mb-2 tracking-tight">#{tag}</h1>
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-md">
                <FaChartLine /> {stats.count} posts
            </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {loading ? <div className="text-center py-10"><Spinner /></div> : (
            posts.length === 0 ? (
                <div className="text-center text-gray-500 py-10 card">
                    No posts found with <b>#{tag}</b>. <br/>Be the first to post!
                </div>
            ) : (
                posts.map(p => <PostCard key={p._id} post={p} />)
            )
        )}
      </div>
    </div>
  );
}