// frontend/src/components/profile/PostGrid.jsx
import React from 'react';

const PostGrid = ({ posts = [] }) => {
  if (!Array.isArray(posts)) return null;

  return (
    <div>
      <div className="grid grid-cols-3 md:grid-cols-3 gap-1">
        {posts.map((p, i) => (
          <div key={p._id ? `${p._id}-${i}` : `post-${i}`} className="relative group overflow-hidden">
            {p.images && p.images[0] ? (
              <img src={p.images[0]} alt="post" className="w-full h-32 md:h-44 object-cover transition-transform transform group-hover:scale-105" />
            ) : p.videos && p.videos[0] ? (
              <video src={p.videos[0]} className="w-full h-32 md:h-44 object-cover" />
            ) : (
              <div className="w-full h-32 md:h-44 bg-gray-100 flex items-center justify-center">No media</div>
            )}

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="text-white text-sm flex gap-4">
                <div>❤️ {p.likes?.length || 0}</div>
                <div>💬 {p.comments?.length || 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
};

export default PostGrid;
