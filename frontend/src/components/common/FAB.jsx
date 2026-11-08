// frontend/src/components/common/FAB.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

const FAB = ({ onClick }) => {
  return (
    <motion.button
      className="fixed bottom-24 right-6 z-50 group md:hidden"
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      {/* Pulse Rings */}
      <div className="absolute inset-0 rounded-full border border-[#00F2FE] opacity-50 animate-ping pointer-events-none" />
      
      {/* Core Button */}
      <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#1D4ED8] via-[#052E24] to-[#D4AF37] border-2 border-[rgba(226,232,240,0.25)] flex items-center justify-center overflow-hidden shadow-[0_0_25px_rgba(29,78,216,0.6)] group-hover:shadow-[0_0_30px_rgba(100,223,223,0.7)] transition-all">
        {/* Specular sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Icon */}
        <FaPlus className="relative z-10 text-white text-xl" />
      </div>
    </motion.button>
  );
};

export default FAB;
