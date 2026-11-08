import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Surface = ({ children, className, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={twMerge(
        clsx(
          // Base luxury glassmorphism styles
          "relative overflow-hidden rounded-2xl border",
          "backdrop-blur-2xl transition-all duration-300",
          "bg-[#070B14]/80 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_0_rgba(100,223,223,0.1)] hover:border-white/20",
          className
        )
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
