// frontend/src/pages/intro/Onboarding.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRocket,
  FaBroadcastTower,
  FaVideo,
  FaWallet,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaCompass,
  FaUserCheck,
} from 'react-icons/fa';
import { playSound } from '../../utils/soundEffects';

const FEATURES = [
  {
    id: 1,
    badge: 'Content & Visuals',
    title: 'Stories & Reels',
    desc: 'Share your daily moments with 24-hour stories, photo filters, and immersive full-screen vertical reels.',
    icon: <FaRocket className="text-3xl text-[#D4AF37]" />,
    highlight: '60fps fluid media experience',
  },
  {
    id: 2,
    badge: 'Live Broadcasting',
    title: 'Live Streams & Superchats',
    desc: 'Broadcast directly from your webcam or mobile camera. Interact with viewers and receive real-time superchat tips.',
    icon: <FaBroadcastTower className="text-3xl text-[#10B981]" />,
    highlight: 'Low-latency peer broadcasting',
  },
  {
    id: 3,
    badge: 'Real-Time Communication',
    title: 'HD Video Calling & Chat',
    desc: 'End-to-end connected chats with voice notes, media attachments, and one-click WebRTC HD video calling.',
    icon: <FaVideo className="text-3xl text-[#1D4ED8]" />,
    highlight: 'Crystal-clear audio & video calls',
  },
  {
    id: 4,
    badge: 'Creator Economy',
    title: 'Wallet & Instant Tipping',
    desc: 'Empower creators with instant wallet tips, daily bonus rewards, 6-digit PIN security, and built-in marketplace.',
    icon: <FaWallet className="text-3xl text-[#00F2FE]" />,
    highlight: 'Instant zero-fee wallet transfers',
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const completeOnboarding = (targetPath = '/login') => {
    playSound('cyber');
    localStorage.setItem('hasSeenOnboarding', 'true');
    navigate(targetPath);
  };

  const handleNext = () => {
    playSound('pop');
    if (index < FEATURES.length - 1) {
      setIndex(index + 1);
    } else {
      completeOnboarding('/login');
    }
  };

  const handlePrev = () => {
    playSound('pop');
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const handleDotClick = (i) => {
    playSound('pop');
    setIndex(i);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden overflow-y-auto bg-[#04070D] px-6 py-10 font-sans text-[#F8FAFC]">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#1D4ED8]/15 blur-[150px]" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-[#052E24]/12 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-96 w-96 rounded-full bg-[#00F2FE]/10 blur-[150px]" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-[14px] shadow-lg shadow-[#1D4ED8]/25 border border-[rgba(226,232,240,0.18)] bg-[#070B14]">
            <img src="/socialo-logo.jpg" alt="Socialo" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl font-black tracking-tight text-[#F8FAFC]">
              Socialo<span className="text-[#D4AF37]">.</span>
            </span>
            <span className="text-[8.5px] font-bold tracking-[0.2em] uppercase text-[#CBD5E1]/70">
              AURORA NOIR • MASTERPIECE
            </span>
          </div>
        </div>

        <button
          onClick={() => completeOnboarding('/explore')}
          className="flex items-center gap-2 rounded-full border border-[rgba(226,232,240,0.14)] bg-[#070B14]/90 px-4 py-2 text-xs font-semibold text-[#CBD5E1] hover:text-[#00F2FE] hover:border-[#00F2FE]/50 transition cursor-pointer backdrop-blur-xl shadow-silverGlass"
        >
          <FaCompass /> Explore as Guest
        </button>
      </header>

      {/* Hero / Main Body */}
      <main className="relative z-10 mx-auto my-auto flex w-full max-w-4xl flex-col items-center text-center py-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1D4ED8]/30 bg-[#1D4ED8]/15 px-4 py-1.5 text-xs font-bold tracking-wider text-[#00F2FE] shadow-[0_0_15px_rgba(29,78,216,0.3)]"
        >
          ✨ AURORA NOIR • THE NEXT-GEN CREATOR NETWORK
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-4xl font-black tracking-tight sm:text-6xl md:text-7xl text-[#F8FAFC] leading-tight"
        >
          Designed for <br />
          <span className="bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] bg-clip-text text-transparent">
            Human Connection.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-[#CBD5E1]/80 leading-relaxed font-light"
        >
          Experience Socialo — a fluid, artistic masterpiece built with cinematic Obsidian depth,
          vibrant creator moments, real-time audio spaces, and instant creator tipping.
        </motion.p>

        {/* Feature Carousel Card */}
        <div className="relative mt-8 w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.25 }}
              className="relative overflow-hidden rounded-[24px] border border-[rgba(226,232,240,0.16)] bg-[#070B14]/90 p-8 text-center shadow-silverGlass backdrop-blur-2xl"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(226,232,240,0.14)] bg-[#04070D] shadow-inner">
                {FEATURES[index].icon}
              </div>

              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                {FEATURES[index].badge}
              </span>

              <h3 className="font-display mt-1 text-2xl font-black text-[#F8FAFC]">
                {FEATURES[index].title}
              </h3>

              <p className="mt-2 text-xs text-[#CBD5E1]/80 leading-relaxed">
                {FEATURES[index].desc}
              </p>

              <div className="mt-4 inline-block rounded-full bg-[#04070D] border border-[rgba(226,232,240,0.12)] px-3.5 py-1 text-[11px] font-bold text-[#00F2FE]">
                {FEATURES[index].highlight}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={handlePrev}
              disabled={index === 0}
              className="p-1.5 text-[#CBD5E1]/50 transition hover:text-white disabled:opacity-20 cursor-pointer"
            >
              <FaChevronLeft size={13} />
            </button>

            {FEATURES.map((_, i) => (
              <button
                key={i}
                onClick={() => handleDotClick(i)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? 'w-8 bg-gradient-to-r from-[#1D4ED8] to-[#00F2FE] shadow-[0_0_12px_rgba(100,223,223,0.5)]' : 'w-2 bg-white/20'
                }`}
              />
            ))}

            <button
              onClick={handleNext}
              disabled={index === FEATURES.length - 1}
              className="p-1.5 text-[#CBD5E1]/50 transition hover:text-white disabled:opacity-20 cursor-pointer"
            >
              <FaChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex w-full max-w-md flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => completeOnboarding('/register')}
            className="flex w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] px-8 py-3.5 font-display font-bold text-white shadow-sapphireGlow border border-[rgba(226,232,240,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Create Account <FaArrowRight size={13} />
          </button>

          <button
            onClick={() => completeOnboarding('/login')}
            className="flex w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-[14px] border border-[rgba(226,232,240,0.16)] bg-[#070B14] px-8 py-3.5 font-display font-bold text-[#F8FAFC] backdrop-blur-md transition-all hover:border-[#00F2FE] hover:text-[#00F2FE] hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-silverGlass"
          >
            <FaUserCheck size={13} /> Sign In
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-[#CBD5E1]/50">
        Socialo Network &copy; {new Date().getFullYear()} &bull; Aurora Noir &bull; Expression &bull; All Rights Reserved
      </footer>
    </div>
  );
}
