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
        const r = await API.get(`/posts/search?q=%23${tag}`);
        const data = r.data?.data || r.data;
        const list = Array.isArray(data) ? data : [];
        setPosts(list);
        setStats({ count: list.length });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tag]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
      {/* Header Card */}
      <div className="bg-[#070B14]/90 border border-white/10 rounded-3xl p-8 text-[#F7F7FC] shadow-2xl mb-8 relative overflow-hidden backdrop-blur-xl">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-md text-white border border-white/10"
        >
            <FaArrowLeft size={14} />
        </button>
        
        <div className="absolute right-[-20px] bottom-[-20px] text-9xl text-[#00F2FE] opacity-10 rotate-12 pointer-events-none">
            <FaHashtag />
        </div>

        <div className="relative z-10 text-center mt-4">
            <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight font-display text-[#F7F7FC]">#{tag}</h1>
            <div className="inline-flex items-center gap-2 bg-[#171A26]/80 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-[#00F2FE] backdrop-blur-md">
                <FaChartLine /> {stats.count} Broadcasts Indexed
            </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {loading ? <div className="text-center py-12"><Spinner /></div> : (
            posts.length === 0 ? (
                <div className="text-center text-[#CBD5E1] py-16 bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl text-xs">
                    No broadcasts found tagged with <b className="text-white">#{tag}</b>. <br/>Be the first to publish with this tag!
                </div>
            ) : (
                posts.map(p => <PostCard key={p._id} post={p} />)
            )
        )}
      </div>
    </div>
  );
}
