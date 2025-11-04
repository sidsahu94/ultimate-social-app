import React from 'react';

const SkeletonPost = () => (
  <div className="card p-4 mb-4 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-3" />
    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

export default SkeletonPost;
