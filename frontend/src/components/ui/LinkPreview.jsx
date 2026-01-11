// frontend/src/components/ui/LinkPreview.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';

export default function LinkPreview({ url }) {
  const [meta, set] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await API.post('/posts/unfurl', { url });
        set(r.data);
      } catch {}
    })();
  }, [url]);

  if (!meta) return null;
  return (
    <a href={url} target="_blank" className="block border rounded p-2 hover:bg-gray-50">
      <div className="font-semibold">{meta.title}</div>
      <div className="text-xs">{meta.desc}</div>
    </a>
  );
}
