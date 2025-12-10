import React, { useState } from 'react';
import API from '../services/api';

export default function TagSuggester({ text, onChoose }) {
  const [sugs, setSugs] = useState([]);
  const go = async () => {
    const r = await API.post('/tags/suggest', { text });
    setSugs(r.data.suggestions || []);
  };
  return (
    <div>
      <button className="px-2 py-1 rounded border text-sm" onClick={go}>Suggest tags</button>
      <div className="flex gap-2 mt-2 flex-wrap">
        {sugs.map(s => <button key={s} className="px-2 py-1 rounded bg-indigo-100" onClick={()=>onChoose(s)}>#{s}</button>)}
      </div>
    </div>
  );
}
