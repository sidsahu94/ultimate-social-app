// frontend/src/components/common/FAB.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

const FAB = ({ onClick }) => {
  return (
    <motion.button
      className="fixed bottom-24 right-6 z-50 group md:hidden"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      {/* Pulse Rings */}
      <div className="absolute inset-0 rounded-full border border-primary opacity-50 animate-ping" />
      
      {/* Core Button */}
      <div className="relative w-14 h-14 rounded-full bg-white dark:bg-black border border-slate-200 dark:border-white/20 flex items-center justify-center overflow-hidden shadow-xl dark:shadow-neon-cyan">
        {/* Inner Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-transparent to-secondary opacity-20 dark:opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Icon */}
        <FaPlus className="relative z-10 text-primary dark:text-white text-xl" />
      </div>
    </motion.button>
  );
};

export default FAB;