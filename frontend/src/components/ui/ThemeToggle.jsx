import React from 'react';
import { useTheme } from '../../contexts/ThemeProvider';
import { FaSun, FaMoon } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative w-16 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center px-1 transition-colors shadow-inner"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center ${
          theme === 'dark' 
            ? 'translate-x-8 bg-indigo-500 text-white' 
            : 'translate-x-0 bg-white text-yellow-500'
        }`}
      >
        {theme === 'dark' ? <FaMoon size={12} /> : <FaSun size={14} />}
      </motion.div>
    </button>
  );
}