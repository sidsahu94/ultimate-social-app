import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children }) => {
  // Grab both 'user' and 'isLoading' from your Redux auth slice
  // (Make sure your auth slice sets isLoading to true on initial app load)
  const { user, isLoading } = useSelector(s => s.auth);
  const location = useLocation();

  // 1. The Hydration Barrier:
  // Show the premium OLED loader while Redux is checking local storage / validating the token.
  // This absolutely prevents the infinite redirect loop.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [0.98, 1.05, 0.98], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-16 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        />
      </div>
    );
  }

  // 2. The Auth Check & Deep Link redirect
  if (!user) {
    // 🔥 FIX: Pass 'state' with where they came from (deep linking support)
    // When Login succeeds, it will read location.state.from and redirect there.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. Render the protected content if logged in
  return children;
};

export default ProtectedRoute;