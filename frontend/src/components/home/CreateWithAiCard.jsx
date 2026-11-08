// frontend/src/components/home/CreateWithAiCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { IoSparkles, IoArrowForward } from 'react-icons/io5';
import { useTheme } from '../../contexts/ThemeProvider';

export default function CreateWithAiCard({ onClick }) {
  const { currentTheme } = useTheme();

  const handleLaunch = () => {
    if (onClick) {
      onClick();
    } else {
      window.dispatchEvent(new CustomEvent('openCreatePost', { detail: { openAiStudio: true } }));
    }
  };

  return (
    <div
      onClick={handleLaunch}
      className="relative overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.14)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.65)] backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] hover:border-[rgba(255,255,255,0.28)] cursor-pointer group"
      style={{
        background: `linear-gradient(135deg, ${currentTheme.bgSurface} 0%, #070B14 100%)`,
        boxShadow: `0 16px 40px rgba(0, 0, 0, 0.7), 0 0 30px ${currentTheme.glow}`,
        borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.14)',
      }}
    >
      {/* Luminous Glow behind lens */}
      <div
        className="pointer-events-none absolute -right-6 -bottom-6 h-40 w-40 rounded-full blur-2xl opacity-60 transition-opacity group-hover:opacity-90"
        style={{ background: currentTheme.color }}
      />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="max-w-[200px]">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white">
            <span>Create with AI</span>
            <IoSparkles className="text-[#F4D49A] animate-pulse" />
          </div>

          <h4 className="mt-1.5 font-display text-xs sm:text-sm font-semibold leading-snug text-[#CBD5E1]/90">
            Turn your ideas into stunning posts, reels and stories with AI.
          </h4>

          {/* Glowing Arrow Button matching Image 2 */}
          <div className="mt-3 flex items-center">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg transition-transform group-hover:scale-110 active:scale-90"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                boxShadow: `0 0 15px ${currentTheme.glow}`,
              }}
            >
              <IoArrowForward size={16} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* 3D Realistic High-Tech Optical Camera Lens (Matching Image 2) */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          {/* Outer Metallic Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full p-[3px] shadow-2xl"
            style={{
              background: `conic-gradient(from 0deg, #334155, ${currentTheme.color}, #64748B, ${currentTheme.accent}, #1E293B, #334155)`,
              boxShadow: `0 0 25px ${currentTheme.glow}`,
            }}
          >
            {/* Concentric Step Bevel */}
            <div className="h-full w-full rounded-full bg-[#0A0F1D] p-1.5 flex items-center justify-center">
              {/* Notched Gear Rim */}
              <div
                className="h-full w-full rounded-full border border-white/20 p-1 flex items-center justify-center"
                style={{
                  background: `conic-gradient(from 45deg, ${currentTheme.color}60, #04070D 25%, ${currentTheme.accent}60 50%, #04070D 75%, ${currentTheme.color}60)`,
                }}
              >
                {/* Rotating Aperture Blades */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="h-full w-full rounded-full bg-[#050914] p-1 flex items-center justify-center relative overflow-hidden"
                >
                  {/* Deep Convex Glass Lens Core */}
                  <div
                    className="h-10 w-10 rounded-full border border-white/50 shadow-inner relative flex items-center justify-center overflow-hidden"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${currentTheme.accent} 25%, #6366F1 50%, #000000 100%)`,
                      boxShadow: `inset 0 0 12px rgba(0, 0, 0, 0.9), 0 0 15px ${currentTheme.accent}`,
                    }}
                  >
                    {/* Chromatic Reflection Streak */}
                    <div className="absolute top-1 left-1.5 w-4 h-2 rounded-full bg-white/70 blur-[1px] rotate-[-30deg]" />

                    {/* Central Glowing Laser Diode */}
                    <motion.div
                      animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: currentTheme.accent,
                        boxShadow: `0 0 10px #FFFFFF, 0 0 20px ${currentTheme.accent}`,
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
