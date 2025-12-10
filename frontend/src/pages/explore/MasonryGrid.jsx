import React from 'react';
import { Link } from 'react-router-dom';
import LazyImage from '../../components/ui/LazyImage';

export default function MasonryGrid({ posts }) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {posts.map((post) => (
        <Link 
          to={`/post/${post._id}`} 
          key={post._id} 
          className="block break-inside-avoid group relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4 hover:shadow-lg transition-all"
        >
          {post.images?.[0] ? (
            <LazyImage src={post.images[0]} className="w-full h-auto object-cover" />
          ) : post.videos?.[0] ? (
            <video src={post.videos[0]} className="w-full h-auto object-cover" muted loop onMouseOver={e=>e.target.play()} onMouseOut={e=>e.target.pause()} />
          ) : (
            <div className="p-6 text-sm text-center">{post.content}</div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <div className="text-white text-xs font-semibold flex gap-3">
              <span>❤️ {post.likes?.length || 0}</span>
              <span>💬 {post.comments?.length || 0}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}