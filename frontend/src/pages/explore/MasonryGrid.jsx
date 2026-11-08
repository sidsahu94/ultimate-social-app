import React from 'react';
import { Link } from 'react-router-dom';
import LazyImage from '../../components/ui/LazyImage';
import { getImageUrl } from '../../utils/imageUtils';

export default function MasonryGrid({ posts }) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {posts.map((post) => (
        <Link 
          to={`/post/${post._id}`} 
          key={post._id} 
          className="block break-inside-avoid group relative rounded-2xl overflow-hidden bg-[#070B14]/90 border border-white/10 mb-4 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(29,78,216,0.25)] transition-all duration-300 backdrop-blur-xl"
        >
          {post.images?.[0] ? (
            <LazyImage src={getImageUrl(post.images[0], 'feed')} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : post.videos?.[0] ? (
            <video src={getImageUrl(post.videos[0])} className="w-full h-auto object-cover" muted loop onMouseOver={e=>e.target.play()} onMouseOut={e=>e.target.pause()} />
          ) : (
            <div className="p-6 text-xs text-[#CBD5E1] text-center bg-[#171A26]/80 leading-relaxed">{post.content}</div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <div className="text-[#F7F7FC] text-xs font-semibold flex gap-3">
              <span className="flex items-center gap-1 text-[#FF6B8A]">❤️ {post.likes?.length || 0}</span>
              <span className="flex items-center gap-1 text-[#00F2FE]">💬 {post.comments?.length || 0}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
