// frontend/src/components/ui/Skeleton.jsx
import React from 'react';

export const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-[#0A111E] rounded-xl border border-white/5 ${className}`} />
);

export const PostSkeleton = () => {
  return (
    <div className="card p-5 mb-4 bg-[#070B14] border border-white/10 rounded-3xl shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="flex gap-4 mt-4">
        <Skeleton className="h-8 w-16 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  );
};
