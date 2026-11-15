// frontend/src/components/common/CinematicEnvironmentalBackdrop.jsx
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeProvider';

function CinematicEnvironmentalBackdrop() {
  const { currentTheme } = useTheme();

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={{ transform: 'translate3d(0, 0, 0)' }}
    >
      {/* 1. Base Velvet Void */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{ backgroundColor: currentTheme.bgVoid || '#04070D' }}
      />

      {/* 2. Dynamic Luminous Auroral Wave Blobs (Hardware Accelerated GPU Gradients) */}
      <motion.div
        animate={{
          x: [0, 20, 0],
          y: [0, 15, 0],
          scale: [1, 1.08, 1],
          opacity: [0.25, 0.4, 0.25],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[15%] -left-[10%] h-[55vw] w-[55vw] rounded-full blur-[70px] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${currentTheme.color} 0%, transparent 70%)`,
          willChange: 'transform, opacity',
          transform: 'translateZ(0)',
        }}
      />

      <motion.div
        animate={{
          x: [0, -25, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
          opacity: [0.18, 0.35, 0.18],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] h-[50vw] w-[50vw] rounded-full blur-[80px] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${currentTheme.accent} 0%, transparent 70%)`,
          willChange: 'transform, opacity',
          transform: 'translateZ(0)',
        }}
      />

      {/* 3. Luminous Silk Wave Ribbons Across Bottom (Optimized Pure Path Geometry) */}
      <div className="absolute inset-x-0 bottom-0 h-64 overflow-hidden opacity-60 pointer-events-none">
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="silkRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentTheme.color} stopOpacity="0.7" />
              <stop offset="50%" stopColor={currentTheme.accent} stopOpacity="0.5" />
              <stop offset="100%" stopColor={currentTheme.color} stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="silkRibbonGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={currentTheme.accent} stopOpacity="0.5" />
              <stop offset="70%" stopColor={currentTheme.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Primary Wave Strand (GPU hardware accelerated transform) */}
          <motion.path
            d="M0,192L60,176C120,160,240,128,360,138.7C480,149,600,203,720,208C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L0,320Z"
            fill="url(#silkRibbonGrad)"
            animate={{
              y: [0, -10, 0],
              opacity: [0.65, 0.85, 0.65],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Secondary Wave Strand */}
          <motion.path
            d="M0,224L48,202.7C96,181,192,139,288,144C384,149,480,203,576,213.3C672,224,768,192,864,181.3C960,171,1056,181,1152,197.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L0,320Z"
            fill="url(#silkRibbonGrad2)"
            animate={{
              y: [0, 8, 0],
              opacity: [0.4, 0.65, 0.4],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </svg>
      </div>

      {/* 4. Foliage & Scenic Silhouettes for Themes */}
      {currentTheme.envMode === 'crimsonMaple' ? (
        <div className="absolute top-0 left-0 bottom-0 w-80 max-w-[28vw] hidden lg:block overflow-hidden opacity-80 pointer-events-none">
          <svg className="w-full h-full opacity-60" viewBox="0 0 320 900" fill="none">
            <path
              d="M-40 0 C 80 120, 170 210, 60 370 C 190 430, 250 550, 40 690 C 130 770, 170 850, -40 900 Z"
              fill="url(#crimsonGrad)"
            />
            <defs>
              <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BE123C" stopOpacity="0.75" />
                <stop offset="50%" stopColor="#8B0018" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FB7185" stopOpacity="0.25" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-20 left-10 h-20 w-16 rounded-2xl bg-[#FB7185]/30 blur-xl animate-pulse" />
        </div>
      ) : (
        <div className="absolute top-0 left-0 bottom-0 w-80 max-w-[28vw] hidden lg:block overflow-hidden opacity-80 pointer-events-none">
          <svg className="w-full h-full opacity-60" viewBox="0 0 320 900" fill="none">
            <path
              d="M-50 0 C 95 100, 190 190, 75 350 C 210 410, 240 530, 55 670 C 140 750, 160 830, -50 900 Z"
              fill="url(#goldTealGrad)"
            />
            <defs>
              <linearGradient id="goldTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.75" />
                <stop offset="50%" stopColor="#0D9488" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.25" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* 5. Starry Micro-Grid Particle Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.025] pointer-events-none" />
    </div>
  );
}

export default memo(CinematicEnvironmentalBackdrop);
