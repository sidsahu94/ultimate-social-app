// frontend/src/pages/explore/Explore.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import LazyImage from "../../components/ui/LazyImage";

/**
 * Explore: search, trending hashtags, grid preview.
 * Defensive: if backend endpoints missing, shows helpful messages.
 */
export default function Explore() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetch trending posts (best-effort)
    (async () => {
      try {
        const r = await API.get("/posts/trending");
        setTrending(r.data || []);
      } catch (e) {
        // fallback: try /posts?sort=trending
        try {
          const r2 = await API.get("/posts?sort=trending");
          setTrending(r2.data || []);
        } catch (err) {
          console.warn("Trending fetch failed", err);
        }
      }
    })();
  }, []);

  const doSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      // try common search endpoints
      const r = await API.get(`/posts/search?q=${encodeURIComponent(query)}`);
      setResults(r.data || []);
    } catch (err) {
      try {
        const r2 = await API.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(r2.data || []);
      } catch (e2) {
        console.error("search failed", e2);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <motion.div layout className="card p-4">
          <form onSubmit={doSearch} className="flex gap-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts, users, hashtags..." className="flex-1 p-3 rounded-full bg-gray-100 dark:bg-gray-800 outline-none" />
            <button className="btn-primary px-4">Search</button>
          </form>
        </motion.div>

        <motion.div layout className="card p-4">
          <h3 className="font-semibold mb-2">Results</h3>
          {loading ? <div className="text-gray-500">Searching…</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.length === 0 ? <div className="text-gray-400">No results — try a different keyword.</div> :
                results.map((p) => (
                  <motion.div key={p._id} whileHover={{ scale: 1.01 }} className="p-3 border rounded">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={p.user?.avatar || "/default-avatar.png"} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="font-medium">{p.user?.name}</div>
                        <div className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-sm mb-2">{p.content}</div>
                    {p.images?.[0] && <LazyImage src={p.images[0]} className="h-40 rounded object-cover" />}
                  </motion.div>
                ))
              }
            </div>
          )}
        </motion.div>
      </div>

      <aside className="space-y-4">
        <div className="card p-4">
          <h4 className="font-semibold">Trending</h4>
          <div className="mt-3 space-y-2">
            {trending.length === 0 ? <div className="text-gray-400">No trending items yet.</div> :
              trending.slice(0, 6).map(t => (
                <div key={t._id} className="flex items-center gap-3">
                  <img src={t.user?.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{t.user?.name}</div>
                    <div className="text-xs text-gray-500">{(t.content || "").slice(0, 50)}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="card p-4">
          <h4 className="font-semibold">Suggestions</h4>
          <p className="text-sm text-gray-500 mt-2">Follow people to personalize your Explore feed.</p>
        </div>
      </aside>
    </div>
  );
}
