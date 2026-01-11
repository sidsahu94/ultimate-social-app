// frontend/src/components/ui/NeonIcon.jsx
import React from 'react';
import { motion } from 'framer-motion';

const NeonIcon = ({ icon, color = 'cyan', size = 'text-2xl', isActive = false, className = '' }) => {
  // Define color maps for shadows
  const colors = {
    cyan: { text: 'text-cyan-400', shadow: 'drop-shadow-[0_0_10px_rgba(0,255,242,0.8)]' },
    purple: { text: 'text-purple-500', shadow: 'drop-shadow-[0_0_10px_rgba(189,0,255,0.8)]' },
    pink: { text: 'text-pink-500', shadow: 'drop-shadow-[0_0_10px_rgba(255,0,153,0.8)]' },
    blue: { text: 'text-blue-500', shadow: 'drop-shadow-[0_0_10px_rgba(0,102,255,0.8)]' },
  };

  const selectedColor = colors[color] || colors.cyan;

  return (
    <motion.div
      className={`relative group ${size} ${className} z-10`}
      // Subtle 3D tilt effect on hover
      whileHover={{ 
        scale: 1.1, 
        rotateX: 10, 
        rotateY: -10,
        perspective: 1000,
        z: 50
      }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* The glowing icon element */}
      <div className={`
        transition-all duration-300
        ${isActive ? selectedColor.text : 'text-gray-400 group-hover:text-gray-200'}
        ${isActive ? selectedColor.shadow : 'group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'}
      `}>
        {icon}
      </div>
      
      {/* Optional: A faint reflection underneath */}
      {isActive && (
         <div className={`absolute -bottom-3 left-0 right-0 h-4 ${selectedColor.text} opacity-20 blur-md transform rotateX(180deg) scaleY(0.5)`}>
            {icon}
         </div>
      )}
    </motion.div>
  );
};

export default NeonIcon;