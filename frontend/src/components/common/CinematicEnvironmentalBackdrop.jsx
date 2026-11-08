// frontend/src/components/common/CinematicEnvironmentalBackdrop.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeProvider';

export default function CinematicEnvironmentalBackdrop() {
  const { currentTheme } = useTheme();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* 1. Base Velvet Void */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{ backgroundColor: currentTheme.bgVoid || '#04070D' }}
      />

      {/* 2. Dynamic Luminous Auroral Wave Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.45, 0.2],
          rotate: [0, 8, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[20%] -left-[10%] h-[70vw] w-[70vw] rounded-full blur-[140px]"
        style={{
          background: `radial-gradient(circle, ${currentTheme.color} 0%, transparent 70%)`,
        }}
      />

      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.4, 0.15],
          rotate: [0, -10, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[-15%] right-[-10%] h-[60vw] w-[60vw] rounded-full blur-[150px]"
        style={{
          background: `radial-gradient(circle, ${currentTheme.accent} 0%, transparent 70%)`,
        }}
      />

      {/* 3. Sweeping Luminous Silk Wave Ribbons Across Bottom (Matching Images 1 & 2) */}
      <div className="absolute inset-x-0 bottom-0 h-72 overflow-hidden opacity-70">
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="silkRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentTheme.color} stopOpacity="0.8" />
              <stop offset="50%" stopColor={currentTheme.accent} stopOpacity="0.6" />
              <stop offset="100%" stopColor={currentTheme.color} stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="silkRibbonGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={currentTheme.accent} stopOpacity="0.6" />
              <stop offset="70%" stopColor={currentTheme.color} stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
            <filter id="ribbonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Primary Wave Strand */}
          <motion.path
            d="M0,192L60,176C120,160,240,128,360,138.7C480,149,600,203,720,208C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            fill="url(#silkRibbonGrad)"
            filter="url(#ribbonGlow)"
            animate={{
              d: [
                "M0,192L60,176C120,160,240,128,360,138.7C480,149,600,203,720,208C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L0,320Z",
                "M0,160L60,181.3C120,203,240,245,360,240C480,235,600,181,720,165.3C840,149,960,171,1080,192C1200,213,1320,235,1380,245.3L1440,256L1440,320L0,320Z",
                "M0,192L60,176C120,160,240,128,360,138.7C480,149,600,203,720,208C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L0,320Z",
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Secondary Higher Strand */}
          <motion.path
            d="M0,224L48,202.7C96,181,192,139,288,144C384,149,480,203,576,213.3C672,224,768,192,864,181.3C960,171,1056,181,1152,197.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L0,320Z"
            fill="url(#silkRibbonGrad2)"
            filter="url(#ribbonGlow)"
            animate={{
              d: [
                "M0,224L48,202.7C96,181,192,139,288,144C384,149,480,203,576,213.3C672,224,768,192,864,181.3C960,171,1056,181,1152,197.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L0,320Z",
                "M0,192L48,208C96,224,192,256,288,250.7C384,245,480,203,576,186.7C672,171,768,181,864,197.3C960,213,1056,235,1152,229.3C1248,224,1344,192,1392,176L1440,160L1440,320L0,320Z",
                "M0,224L48,202.7C96,181,192,139,288,144C384,149,480,203,576,213.3C672,224,768,192,864,181.3C960,171,1056,181,1152,197.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L0,320Z",
              ],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </svg>
      </div>

      {/* 4. Foliage & Scenic Silhouettes for Themes (Matching Uploaded Images 1 & 2) */}
      {currentTheme.envMode === 'crimsonMaple' ? (
        // Crimson Maple & Water Lantern Aesthetics (Image 2)
        <div className="absolute top-0 left-0 bottom-0 w-84 max-w-[30vw] hidden lg:block overflow-hidden opacity-90 pointer-events-none">
          {/* Stylized Glowing Crimson Maple Tree Leaves Silhouette */}
          <svg className="w-full h-full opacity-70" viewBox="0 0 320 900" fill="none">
            <path
              d="M-40 0 C 80 120, 170 210, 60 370 C 190 430, 250 550, 40 690 C 130 770, 170 850, -40 900 Z"
              fill="url(#crimsonGrad)"
              filter="blur(18px)"
            />
            <defs>
              <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BE123C" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#8B0018" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#FB7185" stopOpacity="0.35" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating Lantern Glow Reflection (Image 2) */}
          <div className="absolute bottom-20 left-10 h-24 w-20 rounded-2xl bg-[#FB7185]/35 blur-2xl animate-pulse" />
          <div className="absolute bottom-10 left-24 h-16 w-14 rounded-2xl bg-[#F59E0B]/30 blur-2xl animate-pulse delay-500" />
        </div>
      ) : (
        // Golden Autumn Bonsai / Deep Teal Ribbons (Image 1)
        <div className="absolute top-0 left-0 bottom-0 w-84 max-w-[30vw] hidden lg:block overflow-hidden opacity-90 pointer-events-none">
          {/* Stylized Golden Bonsai Foliage Silhouette */}
          <svg className="w-full h-full opacity-70" viewBox="0 0 320 900" fill="none">
            <path
              d="M-50 0 C 95 100, 190 190, 75 350 C 210 410, 240 530, 55 670 C 140 750, 160 830, -50 900 Z"
              fill="url(#goldTealGrad)"
              filter="blur(16px)"
            />
            <defs>
              <linearGradient id="goldTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#0D9488" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.35" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* 5. Cosmic Starry Micro-Particles */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.035]" />
    </div>
  );
}
