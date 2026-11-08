// frontend/src/pages/memories/Memories.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import PostCard from '../../components/posts/PostCard';
import { FaHistory } from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';

export default function Memories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/social/memories');
        const data = res.data?.data || res.data;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Memories load error:', e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-1">
          <FaHistory /> Time Capsule
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
          Memories & Flashbacks<span className="text-[#00F2FE]">.</span>
        </h1>
        <p className="text-xs text-[#CBD5E1] mt-1">Revisit moments you shared on this date across past years.</p>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="p-16 text-center text-[#CBD5E1] bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl">
          <FaHistory className="mx-auto text-4xl mb-3 text-[#A5A9BB] opacity-30" />
          <p className="font-semibold text-sm">No flashbacks today.</p>
          <p className="text-xs text-[#A5A9BB] mt-1">When posts reach their anniversary dates, they will illuminate here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((p) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
