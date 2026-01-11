// frontend/src/components/live/LiveOverlay.jsx
import React, { useEffect, useState } from 'react';
import socket from '../../services/socket';

export default function LiveOverlay({ roomId }) {
  const [comments, setComments] = useState([]);
  const [reaction, setReaction] = useState(null);

  useEffect(() => {
    const onComment = (c) => setComments(s => [...s.slice(-80), c]);
    const onReaction = (r) => { setReaction(r.reaction); setTimeout(()=>setReaction(null), 2200); };

    socket.on('live:comment', onComment);
    socket.on('live:reaction', onReaction);
    return () => { socket.off('live:comment', onComment); socket.off('live:reaction', onReaction); };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute left-4 bottom-20 flex flex-col gap-2 max-w-xs">
        {comments.slice().reverse().map(c => (
          <div key={c.id} className="bg-black/60 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
            <b className="mr-2">{c.from?.name||'anon'}</b>{c.message}
          </div>
        ))}
      </div>

      {reaction && (
        <div className="absolute right-6 top-8 text-4xl animate-pop">
          {reaction}
        </div>
      )}

      <style>{`.animate-pop{ animation: pop .6s ease } @keyframes pop { from{ transform: scale(.4); opacity:0 } to{ transform:scale(1); opacity:1 } }`}</style>
    </div>
  );
}
