// frontend/src/pages/apps/NewsPage.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaSearch, FaNewspaper, FaGlobe } from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';

const COUNTRIES = [
  { code: 'in', name: 'India' },
  { code: 'us', name: 'USA' },
  { code: 'gb', name: 'UK' },
  { code: 'ca', name: 'Canada' },
  { code: 'au', name: 'Australia' }
];

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('in');
  const [query, setQuery] = useState('');

  const fetchNews = async () => {
    setLoading(true);
    try {
      const r = await API.get(`/integrations/news?country=${country}&q=${query}`);
      const data = r.data?.data || r.data;
      setNews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, [country]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen pb-24">
      <div className="flex items-center gap-3.5 mb-6">
        <div className="p-3 bg-[#052E24]/20 border border-[#052E24]/30 text-[#10B981] rounded-2xl shadow-[0_0_15px_rgba(185,28,28,0.3)]">
          <FaNewspaper size={20} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
            Global Dispatch<span className="text-[#00F2FE]">.</span>
          </h1>
          <p className="text-xs text-[#CBD5E1] mt-0.5">Real-time international press coverage and media wires.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#070B14]/90 border border-white/10 p-4 rounded-3xl shadow-xl backdrop-blur-xl mb-6 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-[#0A111E] border border-white/10 px-4 rounded-2xl flex-1">
          <FaGlobe className="text-[#00F2FE]" size={14} />
          <select 
            value={country} 
            onChange={(e) => setCountry(e.target.value)}
            className="bg-transparent py-3 outline-none w-full cursor-pointer text-xs font-bold text-[#F7F7FC]"
          >
            {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-[#070B14] text-[#F7F7FC]">{c.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2 flex-[2]">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-3.5 text-[#A5A9BB]" size={12} />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics (e.g. AI, Economy, Space)..."
              className="w-full pl-10 p-3 bg-[#0A111E] border border-white/10 rounded-2xl text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50 transition"
            />
          </div>
          <button 
            onClick={fetchNews} 
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white font-bold text-xs shadow-md hover:opacity-95 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* News Grid */}
      {loading ? <div className="p-12 flex justify-center"><Spinner /></div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {news.length === 0 && (
            <div className="text-[#CBD5E1] col-span-2 text-center py-16 bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl text-xs">
              No news dispatches available for this filter.
            </div>
          )}
          {news.map((article, i) => (
            <a 
              key={i} 
              href={article.link} 
              target="_blank" 
              rel="noreferrer"
              className="bg-[#070B14]/90 border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_8px_30px_rgba(29,78,216,0.2)] hover:border-white/20 transition-all duration-300 group block h-full flex flex-col backdrop-blur-xl"
            >
              {article.image && (
                <div className="h-44 overflow-hidden bg-black/40">
                  <img src={article.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="news" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#00F2FE] mb-1.5 uppercase tracking-wider">{article.source || 'WIRE'}</div>
                  <h3 className="font-bold text-base mb-2 leading-snug text-[#F7F7FC] line-clamp-2 group-hover:text-[#00F2FE] transition-colors">{article.title}</h3>
                  <p className="text-xs text-[#CBD5E1] line-clamp-3 mb-4 leading-relaxed">
                    {article.description}
                  </p>
                </div>
                <div className="text-[11px] text-[#A5A9BB] font-medium pt-2 border-t border-white/5">
                  {article.date ? new Date(article.date).toLocaleDateString() : 'Just now'}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
