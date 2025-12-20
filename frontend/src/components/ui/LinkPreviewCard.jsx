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
      // Fetch metadata
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
      <div className="bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-all">
        {meta.image && (
          <div className="h-32 w-full overflow-hidden">
             <img src={meta.image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        )}
        <div className="p-3">
          <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{meta.title}</h4>
          {meta.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{meta.description}</p>}
          <span className="text-[10px] text-indigo-500 mt-2 block uppercase font-bold tracking-wide">{new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
}