// frontend/src/components/ui/LinkPreviewCard.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';

export default function LinkPreviewCard({ text }) {
  const [meta, setMeta] = useState(null);
  const [url, setUrl] = useState(null);

  useEffect(() => {
    // Extract first URL from text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    
    if (match && match[0]) {
      const foundUrl = match[0];
      setUrl(foundUrl);
      API.post('/posts/unfurl', { url: foundUrl })
         .then(res => {
             if (res.data.title) setMeta(res.data);
         })
         .catch(() => {});
    }
  }, [text]);

  if (!meta) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2 mb-2 group">
      <div className="bg-[#070B14] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:shadow-xl transition-all">
        {meta.image && (
          <div className="h-32 w-full overflow-hidden">
             <img src={meta.image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
        <div className="p-3.5">
          <h4 className="font-bold text-sm text-[#F7F7FC] line-clamp-1 font-serif">{meta.title}</h4>
          {meta.description && <p className="text-xs text-[#CBD5E1]/70 mt-1 line-clamp-2">{meta.description}</p>}
          <span className="text-[10px] text-[#00F2FE] mt-2 block uppercase font-bold tracking-wider">{new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
}
