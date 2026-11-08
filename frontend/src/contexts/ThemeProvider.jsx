// frontend/src/contexts/ThemeProvider.jsx
import React, { createContext, useEffect, useState, useContext } from 'react';

export const THEMES = [
  {
    id: 'darkRed',
    name: 'Dark Red',
    color: '#DC2626',
    glow: 'rgba(220, 38, 38, 0.65)',
    border: 'rgba(251, 113, 133, 0.42)',
    bgVoid: '#0A0204',
    bgSurface: '#18060E',
    accent: '#FB7185',
    activeGradient: 'from-[#DC2626] via-[#BE123C] to-[#FB7185]',
    envMode: 'crimsonMaple',
    waveformColors: ['#DC2626', '#FB7185', '#FDE047'],
  },
  {
    id: 'silverGlass',
    name: 'Silver Glass',
    color: '#E2E8F0',
    glow: 'rgba(226, 232, 240, 0.55)',
    border: 'rgba(226, 232, 240, 0.35)',
    bgVoid: '#050810',
    bgSurface: '#0D1322',
    accent: '#38BDF8',
    activeGradient: 'from-[#E2E8F0] via-[#94A3B8] to-[#38BDF8]',
    envMode: 'silverCrystal',
    waveformColors: ['#E2E8F0', '#94A3B8', '#38BDF8'],
  },
  {
    id: 'roseGold',
    name: 'Rose Gold',
    color: '#E09F8F',
    glow: 'rgba(224, 159, 143, 0.6)',
    border: 'rgba(244, 212, 154, 0.42)',
    bgVoid: '#0F060A',
    bgSurface: '#1C0D15',
    accent: '#F4D49A',
    activeGradient: 'from-[#E09F8F] via-[#F4D49A] to-[#D4AF37]',
    envMode: 'roseSunset',
    waveformColors: ['#E09F8F', '#F4D49A', '#D4AF37'],
  },
  {
    id: 'sandBeige',
    name: 'Sand Beige',
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.55)',
    border: 'rgba(253, 230, 138, 0.4)',
    bgVoid: '#0A0805',
    bgSurface: '#17130B',
    accent: '#D4AF37',
    activeGradient: 'from-[#FDE68A] via-[#F59E0B] to-[#D4AF37]',
    envMode: 'sandDune',
    waveformColors: ['#FDE68A', '#F59E0B', '#D4AF37'],
  },
  {
    id: 'sapphireElite',
    name: 'Sapphire Elite',
    color: '#2563EB',
    glow: 'rgba(37, 99, 235, 0.65)',
    border: 'rgba(96, 165, 250, 0.45)',
    bgVoid: '#030714',
    bgSurface: '#0A1430',
    accent: '#00F2FE',
    activeGradient: 'from-[#2563EB] via-[#1D4ED8] to-[#00F2FE]',
    envMode: 'sapphireAbyss',
    waveformColors: ['#00F2FE', '#2563EB', '#60A5FA'],
  },
  {
    id: 'deepTeal',
    name: 'Deep Teal',
    color: '#0D9488',
    glow: 'rgba(13, 148, 136, 0.6)',
    border: 'rgba(45, 212, 191, 0.42)',
    bgVoid: '#020B0C',
    bgSurface: '#07181A',
    accent: '#00F2FE',
    activeGradient: 'from-[#0D9488] via-[#14B8A6] to-[#00F2FE]',
    envMode: 'deepTealBonsai',
    waveformColors: ['#00F2FE', '#0D9488', '#2DD4BF'],
  },
  {
    id: 'cherryNoir',
    name: 'Cherry Noir',
    color: '#BE123C',
    glow: 'rgba(190, 18, 60, 0.65)',
    border: 'rgba(251, 113, 133, 0.45)',
    bgVoid: '#060104',
    bgSurface: '#15030A',
    accent: '#FDA4AF',
    activeGradient: 'from-[#BE123C] via-[#9F1239] to-[#FDA4AF]',
    envMode: 'crimsonMaple',
    waveformColors: ['#BE123C', '#E11D48', '#FDA4AF'],
  },
  {
    id: 'oceanMist',
    name: 'Ocean Mist',
    color: '#00F2FE',
    glow: 'rgba(0, 242, 254, 0.65)',
    border: 'rgba(56, 189, 248, 0.45)',
    bgVoid: '#03070E',
    bgSurface: '#081220',
    accent: '#38BDF8',
    activeGradient: 'from-[#00F2FE] via-[#38BDF8] to-[#1D4ED8]',
    envMode: 'deepTealBonsai',
    waveformColors: ['#00F2FE', '#38BDF8', '#10B981'],
  },
  {
    id: 'royalAether',
    name: 'Royal Aether',
    color: '#00F2FE',
    glow: 'rgba(0, 242, 254, 0.75)',
    border: 'rgba(16, 185, 129, 0.48)',
    bgVoid: '#020408',
    bgSurface: '#06101E',
    accent: '#10B981',
    gold: '#D4AF37',
    activeGradient: 'from-[#00F2FE] via-[#10B981] to-[#D4AF37]',
    envMode: 'royalAether',
    waveformColors: ['#00F2FE', '#10B981', '#D4AF37'],
  },
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('socialverse_theme_id') || 'deepTeal';
  });

  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('socialverse_theme_mode') === 'light';
  });

  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[5];

  useEffect(() => {
    localStorage.setItem('socialverse_theme_id', themeId);
    localStorage.setItem('socialverse_theme_mode', isLightMode ? 'light' : 'dark');

    const root = document.documentElement;

    root.style.setProperty('--theme-color', currentTheme.color);
    root.style.setProperty('--theme-glow', currentTheme.glow);
    root.style.setProperty('--theme-border', currentTheme.border);
    root.style.setProperty('--theme-bg-void', currentTheme.bgVoid);
    root.style.setProperty('--theme-bg-surface', currentTheme.bgSurface);
    root.style.setProperty('--theme-accent', currentTheme.accent);

    if (isLightMode) {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }

    // Dynamic Mobile PWA Status Bar Color
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.name = 'theme-color';
      document.head.appendChild(metaTheme);
    }
    metaTheme.content = isLightMode ? '#F8FAFC' : (currentTheme.bgVoid || '#04070D');
  }, [themeId, isLightMode, currentTheme]);

  const selectTheme = (newThemeId) => {
    if (THEMES.some((t) => t.id === newThemeId)) {
      setThemeId(newThemeId);
    }
  };

  const toggleDayNight = () => {
    setIsLightMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        themes: THEMES,
        currentTheme,
        currentThemeId: themeId,
        activeThemeId: themeId,
        selectTheme,
        isLightMode,
        isDark: !isLightMode,
        toggleDayNight,
        toggleDarkMode: toggleDayNight,
        toggle: toggleDayNight,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
