// frontend/src/pages/reels/Reels.jsx
import React, { useEffect, useState, useRef } from 'react';
import API from '../../services/api';

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    loadMore();
  }, []);

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const r = await API.get(`/extra/reels?page=${page}&limit=10`);
      setReels(prev => [...prev, ... (r.data || [])]);
      setPage(p => p + 1);
    } catch (err) {
      console.error('reels load err', err);
    } finally {
      setLoading(false);
    }
  };

  // simple infinite scroll for vertical feed:
  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        loadMore();
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [page]);

  return (
    <div ref={containerRef} className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Reels</h2>
      <div className="space-y-6">
        {reels.map(r => (
          <div key={r._id} className="rounded-lg overflow-hidden bg-black">
            <video src={r.videos?.[0]} controls className="w-full max-h-[70vh] object-cover" />
            <div className="p-3 bg-white text-sm">
              <div className="flex items-center gap-3">
                <img src={r.user?.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full" />
                <div>
                  <div className="font-medium">{r.user?.name}</div>
                  <div className="text-xs text-gray-500">{(r.content || '').slice(0, 120)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && <div className="text-center py-6">Loading…</div>}
        {!loading && reels.length === 0 && <div className="text-center py-6 text-gray-500">No reels found</div>}
      </div>
    </div>
  );
}
