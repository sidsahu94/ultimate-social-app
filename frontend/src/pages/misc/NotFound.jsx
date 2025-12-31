import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-4">
      <div className="text-9xl mb-4">🛸</div>
      <h1 className="text-4xl font-black mb-2 text-indigo-600">404</h1>
      <p className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-8">
        Lost in the digital void?
      </p>
      <Link to="/" className="btn-primary px-8 py-3 rounded-full flex items-center gap-2">
        <FaHome /> Return Home
      </Link>
    </div>
  );
}
