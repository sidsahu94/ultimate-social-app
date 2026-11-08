// frontend/src/components/ui/SkeletonPost.jsx
import React from 'react';

const SkeletonPost = () => {
  return (
    <div className="relative overflow-hidden p-6 mb-6 bg-[#070B14]/90 backdrop-blur-xl rounded-[28px] shadow-2xl border border-white/10">
      {/* Specular Aurora Shimmer Sweep */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className="w-11 h-11 rounded-full bg-[#0A111E] border border-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-[#0A111E] rounded-md w-1/3" />
          <div className="h-2.5 bg-[#0A111E] rounded-md w-1/5" />
        </div>
      </div>

      {/* Text lines */}
      <div className="space-y-2.5 mb-4">
        <div className="h-3 bg-[#0A111E] rounded-md w-4/5" />
        <div className="h-3 bg-[#0A111E] rounded-md w-full" />
        <div className="h-3 bg-[#0A111E] rounded-md w-2/3" />
      </div>

      {/* Media placeholder */}
      <div className="h-64 sm:h-80 bg-[#0A111E]/80 rounded-2xl border border-white/5 mb-4 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.02]" />
      </div>

      {/* Action buttons footer */}
      <div className="flex items-center gap-6 pt-1 border-t border-white/5">
        <div className="h-4 bg-[#0A111E] rounded w-16" />
        <div className="h-4 bg-[#0A111E] rounded w-16" />
        <div className="h-4 bg-[#0A111E] rounded w-16" />
      </div>
    </div>
  );
};

export default SkeletonPost;
