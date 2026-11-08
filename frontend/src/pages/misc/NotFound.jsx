// frontend/src/pages/misc/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#04070D] text-center p-4 select-none">
      <div className="text-8xl mb-4 animate-bounce">🛸</div>
      <h1 className="text-6xl font-black mb-2 font-display bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] bg-clip-text text-transparent">404</h1>
      <p className="text-lg font-medium text-[#CBD5E1] mb-8 max-w-sm">
        Lost in the cosmic void? The artifact you sought has drifted away.
      </p>
      <Link to="/" className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white text-xs font-bold flex items-center gap-2 shadow-[0_4px_25px_rgba(29,78,216,0.35)] hover:opacity-95 transition">
        <FaHome /> Return to Feed
      </Link>
    </div>
  );
}
