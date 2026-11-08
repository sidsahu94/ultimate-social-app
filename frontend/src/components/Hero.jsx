import React from 'react';
import { motion } from 'framer-motion';

export const Hero = () => {
  // Animation settings for the text revealing line by line
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 bg-[#04070D]">
      
      {/* Subtle animated background glow (Cinematic Mesh) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0F766E]/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#D4AF37]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#052E24]/15 blur-[150px] rounded-full pointer-events-none" />

      <motion.div 
        className="relative z-10 text-center max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="inline-block mb-4 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md bg-white/[0.04] text-xs font-semibold tracking-wider uppercase text-[#D4AF37] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          ✨ Introducing the Next Generation
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 text-[#F7F7FC] font-serif">
          Designed for <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] via-[#F4D49A] to-[#D4AF37]">
            Human Connection.
          </span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-lg md:text-xl text-[#CBD5E1]/80 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          Experience a fluid, emotionally engaging social space. Handcrafted with cinematic gradients and ultra-premium silver glassmorphism.
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden group px-8 py-4 rounded-full bg-gradient-to-r from-[#1D4ED8] via-[#0F766E] to-[#00F2FE] text-white font-semibold tracking-wide shadow-[0_0_40px_-10px_rgba(100,223,223,0.4)] hover:shadow-[0_0_60px_-10px_rgba(100,223,223,0.7)] transition-all duration-300 border border-white/20"
          >
            <span className="relative z-10">Explore the Feed</span>
            {/* Hover shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};
