import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function SmartImage({ src, alt, className }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-surface-card ${className}`}>
      {/* Skeleton / Blur Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${className}`}
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* Holographic Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-electric-cyan/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none mix-blend-overlay" />
    </div>
  );
}