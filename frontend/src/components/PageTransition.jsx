// frontend/src/components/PageTransition.jsx
import React from 'react';
import { motion } from 'framer-motion';

export const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="w-full min-h-[calc(100vh-160px)]"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
