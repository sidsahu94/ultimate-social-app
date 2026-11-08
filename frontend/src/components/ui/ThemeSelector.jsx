// frontend/src/components/ui/ThemeSelector.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import { useTheme } from '../../contexts/ThemeProvider';

export default function ThemeSelector({ className = '' }) {
  const { currentTheme, activeThemeId, selectTheme, isDark, toggleDarkMode, themes } = useTheme();

  return (
    <div
      className={`rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#070B14]/85 p-3.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-[rgba(255,255,255,0.2)] ${className}`}
      style={{
        boxShadow: `0 16px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 25px ${currentTheme.glow}`,
      }}
    >
      {/* Header with Title & Sun/Moon Toggle */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
              boxShadow: `0 0 12px ${currentTheme.glow}`,
            }}
          >
            <span className="text-[11px]">🎨</span>
          </div>
          <div>
            <span className="text-xs font-bold text-[#F8FAFC] tracking-tight block leading-tight">
              Themes
            </span>
            <span className="text-[9.5px] font-medium text-[#CBD5E1]/60 block leading-tight">
              {currentTheme.name}
            </span>
          </div>
        </div>

        {/* Day / Night Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#CBD5E1] transition-all hover:bg-white/10 hover:text-white cursor-pointer"
          title={isDark ? 'Switch to Bright Luxe mode' : 'Switch to Ultra Dark mode'}
        >
          <IoSunnyOutline className={`text-xs ${!isDark ? 'text-[#F59E0B]' : 'opacity-40'}`} />
          <IoMoonOutline className={`text-xs ${isDark ? 'text-[#38BDF8]' : 'opacity-40'}`} />
        </button>
      </div>

      {/* 8 Coordinated Theme Swatches */}
      <div className="flex items-center justify-between gap-1.5">
        {themes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => selectTheme(theme.id)}
              className="group relative flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-125 cursor-pointer"
              title={`${theme.name} Theme`}
            >
              {/* Outer Active Ring */}
              {isActive && (
                <motion.div
                  layoutId="activeThemeRing"
                  className="absolute -inset-1 rounded-full border-2 border-white/80"
                  style={{
                    boxShadow: `0 0 12px ${theme.color}, 0 0 20px ${theme.accent}`,
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                />
              )}

              {/* Swatch Circle */}
              <div
                className="h-5 w-5 rounded-full border border-white/30 shadow-md transition-all group-hover:shadow-lg"
                style={{
                  background:
                    theme.id === 'royalAether'
                      ? 'linear-gradient(135deg, #00F2FE 0%, #10B981 50%, #D4AF37 100%)'
                      : theme.id === 'silverGlass'
                      ? 'linear-gradient(135deg, #F8FAFC 0%, #94A3B8 50%, #475569 100%)'
                      : theme.id === 'cherryNoir'
                      ? 'linear-gradient(135deg, #E11D48 0%, #8B0018 50%, #1A080F 100%)'
                      : `linear-gradient(135deg, ${theme.color} 0%, ${theme.accent} 100%)`,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
