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
      setNews(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, [country]); // Auto fetch on country change

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-100 text-red-600 rounded-xl"><FaNewspaper size={24} /></div>
        <h1 className="text-2xl font-bold">Global Headlines</h1>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 rounded-xl flex-1">
          <FaGlobe className="text-gray-400" />
          <select 
            value={country} 
            onChange={(e) => setCountry(e.target.value)}
            className="bg-transparent py-3 outline-none w-full cursor-pointer dark:text-white"
          >
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2 flex-[2]">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics (e.g. Crypto, Tech)..."
              className="w-full pl-10 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl outline-none focus:ring-2 ring-indigo-500 transition dark:text-white"
            />
          </div>
          <button onClick={fetchNews} className="btn-primary px-6 rounded-xl font-bold">Search</button>
        </div>
      </div>

      {/* News Grid */}
      {loading ? <div className="p-10 flex justify-center"><Spinner /></div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {news.length === 0 && <div className="text-gray-500 col-span-2 text-center py-10">No news found.</div>}
          {news.map((article, i) => (
            <a 
              key={i} 
              href={article.link} 
              target="_blank" 
              rel="noreferrer"
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition group border dark:border-gray-700 block h-full flex flex-col"
            >
              {article.image && (
                <div className="h-48 overflow-hidden">
                  <img src={article.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="news" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs font-bold text-indigo-500 mb-1 uppercase tracking-wide">{article.source || 'News'}</div>
                <h3 className="font-bold text-lg mb-2 leading-tight dark:text-white line-clamp-2">{article.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                  {article.description}
                </p>
                <div className="text-xs text-gray-400 mt-auto">
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