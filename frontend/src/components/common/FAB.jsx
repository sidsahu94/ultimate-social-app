// frontend/src/components/common/FAB.jsx
// FAB button that opens the CreatePost modal using local state via props or centralized UI state
import React from 'react';
import { motion } from 'framer-motion';

const FAB = ({ onClick }) => {
  return (
    <motion.button
      className="fab"
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Create Post"
      title="Create post"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </motion.button>
  );
};

export default FAB;
