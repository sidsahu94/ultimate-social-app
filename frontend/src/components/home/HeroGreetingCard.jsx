// frontend/src/components/home/HeroGreetingCard.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSunny, IoPartlySunny, IoRainy, IoChevronForward, IoLocationSharp, IoClose } from 'react-icons/io5';
import { useTheme } from '../../contexts/ThemeProvider';

export default function HeroGreetingCard() {
  const { user } = useSelector((s) => s.auth);
  const { currentTheme } = useTheme();
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Sidhanta';
  const city = user?.location || 'Mumbai';

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.16)] p-5 md:p-6 mb-5 shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-2xl group"
        style={{
          boxShadow: `0 18px 45px rgba(0, 0, 0, 0.7), 0 0 30px ${currentTheme.glow}`,
          borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.16)',
        }}
      >
        {/* Cinematic Panoramic Mountain Background */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80")',
          }}
        />

        {/* Ambient Theme Gradient Overlays */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#04070D]/95 via-[#070B14]/75 to-transparent"
          style={{
            backgroundImage: `linear-gradient(90deg, #04070D 0%, rgba(7, 11, 20, 0.85) 45%, ${currentTheme.glow} 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04070D] via-transparent to-transparent opacity-80" />

        {/* Animated Sunlit Mountain Peak Flare */}
        <motion.div
          animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.95, 1.1, 0.95] }}
          transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-10 right-1/4 h-56 w-72 rounded-full blur-3xl"
          style={{ background: currentTheme.glow }}
        />

        {/* Luminous Fluid Ribbon across bottom */}
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-72 rounded-full blur-3xl opacity-60"
          style={{ background: currentTheme.color }}
        />

        {/* Content Layout */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#CBD5E1]/80">
                WELCOME BACK
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full animate-ping"
                style={{ backgroundColor: currentTheme.accent }}
              />
            </div>

            <h2 className="mt-1 font-display text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-md flex items-center gap-2">
              <span>
                {getGreeting()}, {displayName}
              </span>
              <span className="animate-bounce">👋</span>
            </h2>

            <p className="mt-1.5 text-xs font-medium text-[#CBD5E1]/85 tracking-wide flex items-center gap-2">
              <span>Capture</span>
              <span className="text-white/40">•</span>
              <span>Connect</span>
              <span className="text-white/40">•</span>
              <span>Create</span>
              <span className="text-white/40">•</span>
              <span>Share</span>
              <span className="text-white/40">•</span>
              <span>Discover</span>
            </p>
          </div>

          {/* Weather & Date Pill (Clickable) */}
          <button
            type="button"
            onClick={() => setShowWeatherModal(true)}
            className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-black/40 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xl shadow-lg transition-all hover:bg-black/60 hover:scale-105 active:scale-95 cursor-pointer self-start md:self-auto"
            style={{
              borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <IoSunny className="text-base text-[#F59E0B] animate-spin-slow" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] text-[#CBD5E1]/70 font-mono">{formattedDate}</span>
              <span className="text-xs font-bold text-white">28°C {city}</span>
            </div>
            <IoChevronForward className="text-xs text-white/60 ml-1" />
          </button>
        </div>
      </motion.div>

      {/* Quick Weather Forecast Modal */}
      <AnimatePresence>
        {showWeatherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-[#070B14]/95 p-6 text-white shadow-2xl backdrop-blur-2xl"
              style={{ borderColor: currentTheme.border }}
            >
              <button
                onClick={() => setShowWeatherModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white p-1 rounded-full"
              >
                <IoClose size={20} />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#CBD5E1]">
                <IoLocationSharp className="text-[#38BDF8]" /> {city}, India Telemetry
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-4xl font-black font-display text-white">28°C</div>
                  <div className="text-xs text-[#CBD5E1]/70">Sunny &amp; Breezy • Humidity: 54%</div>
                </div>
                <IoPartlySunny size={48} className="text-[#F59E0B]" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center text-xs">
                <div className="rounded-xl bg-white/5 p-2">
                  <span className="text-[10px] text-[#CBD5E1]/60 block">Morning</span>
                  <span className="font-bold">24°C</span>
                </div>
                <div className="rounded-xl bg-white/5 p-2 border border-white/15">
                  <span className="text-[10px] text-[#CBD5E1]/60 block">Afternoon</span>
                  <span className="font-bold">31°C</span>
                </div>
                <div className="rounded-xl bg-white/5 p-2">
                  <span className="text-[10px] text-[#CBD5E1]/60 block">Night</span>
                  <span className="font-bold">26°C</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
