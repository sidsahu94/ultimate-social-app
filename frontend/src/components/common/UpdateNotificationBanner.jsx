// frontend/src/components/common/UpdateNotificationBanner.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSyncAlt, FaTimes, FaRocket } from 'react-icons/fa';

const APP_CURRENT_VERSION = 'v5.1.0-socialverse';

export default function UpdateNotificationBanner() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // 1. Check if previous user has an older version saved
    const savedVersion = localStorage.getItem('socialverse_app_version');
    if (!savedVersion || savedVersion !== APP_CURRENT_VERSION) {
      const timer = setTimeout(() => setShowUpdate(true), 2500);
      return () => clearTimeout(timer);
    }

    // 2. Listen to Service Worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      localStorage.setItem('socialverse_app_version', APP_CURRENT_VERSION);

      // Clear all old caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Tell waiting service worker to activate immediately
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      // Hard reload with clean cache
      window.location.reload(true);
    } catch (err) {
      console.warn('Update apply fallback:', err);
      window.location.reload(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('socialverse_app_version', APP_CURRENT_VERSION);
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="App update announcement"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fixed top-4 left-4 right-4 md:left-auto md:right-8 md:top-6 z-[9999] max-w-md pointer-events-auto"
      >
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,242,254,0.3)] bg-gradient-to-r from-[#070B14]/95 via-[#0A111E]/95 to-[#04070D]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(0,242,254,0.2)] backdrop-blur-2xl ring-1 ring-white/10">
          {/* Subtle Ambient Orbs */}
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#00F2FE]/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#D4AF37]/20 blur-2xl" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00F2FE] via-[#1D4ED8] to-[#D4AF37] text-[#04070D] shadow-lg shadow-[#00F2FE]/30">
                <FaRocket className="text-white text-lg animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#F8FAFC]">
                    SocialVerse ∞ Update Ready
                  </span>
                  <span className="rounded-full bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-0.5 text-[9px] font-bold text-[#10B981]">
                    LIVE
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#CBD5E1]/80 leading-snug">
                  8 luxury themes, 3D Social AI assistant, dynamic stories &amp; cinematic backdrop are ready.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-[#CBD5E1]/50 hover:text-white p-1 rounded-lg transition"
              title="Dismiss"
            >
              <FaTimes size={13} />
            </button>
          </div>

          <div className="relative z-10 mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#CBD5E1]/70 hover:text-white transition cursor-pointer"
            >
              Later
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleApplyUpdate}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00F2FE] via-[#1D4ED8] to-[#10B981] text-xs font-black text-white shadow-md shadow-[#00F2FE]/25 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <FaSyncAlt className={`text-[11px] ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Updating...' : 'Update & Reload'}</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
