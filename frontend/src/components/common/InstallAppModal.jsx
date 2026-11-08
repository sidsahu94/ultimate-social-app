// frontend/src/components/common/InstallAppModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoClose, 
  IoDownloadOutline, 
  IoShareOutline, 
  IoAddCircleOutline, 
  IoFlashOutline, 
  IoShieldCheckmarkOutline, 
  IoWifiOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import { useTheme } from '../../contexts/ThemeProvider';
import usePWAInstall from '../../hooks/usePWAInstall';

export default function InstallAppModal({ isOpen, onClose }) {
  const { currentTheme } = useTheme();
  const { isReady, installApp, isInstalled } = usePWAInstall();

  const [platform, setPlatform] = useState('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setPlatform('ios');
    } else if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/20 bg-[#070B14] p-6 shadow-2xl backdrop-blur-2xl text-white"
          style={{
            borderColor: currentTheme.border || 'rgba(255, 255, 255, 0.2)',
            boxShadow: `0 24px 60px rgba(0,0,0,0.8), 0 0 40px ${currentTheme.glow}`,
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <IoClose size={22} />
          </button>

          {/* Header with 3D Emblem & Title */}
          <div className="flex flex-col items-center text-center mt-2 mb-6">
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl p-[2px] shadow-2xl mb-3"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                boxShadow: `0 0 30px ${currentTheme.glow}`,
              }}
            >
              <div className="h-full w-full rounded-[14px] bg-[#04070D] flex items-center justify-center overflow-hidden">
                <img
                  src="/socialverse-logo.jpg"
                  alt="SocialVerse"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>

            <h3 className="font-display text-2xl font-black text-white tracking-tight">
              Install SocialVerse <span style={{ color: currentTheme.accent }}>∞</span>
            </h3>
            <p className="text-xs text-[#CBD5E1]/70 mt-1">
              Experience the next generation of social networking as a standalone native app.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col items-center">
              <IoFlashOutline className="text-lg text-[#00F2FE] mb-1" />
              <span className="text-[11px] font-bold text-white">Instant Launch</span>
              <span className="text-[9px] text-[#CBD5E1]/60 mt-0.5">Zero lag 60fps</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col items-center">
              <IoWifiOutline className="text-lg text-[#10B981] mb-1" />
              <span className="text-[11px] font-bold text-white">Offline Ready</span>
              <span className="text-[9px] text-[#CBD5E1]/60 mt-0.5">Read anywhere</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col items-center">
              <IoShieldCheckmarkOutline className="text-lg text-[#F59E0B] mb-1" />
              <span className="text-[11px] font-bold text-white">Encrypted</span>
              <span className="text-[9px] text-[#CBD5E1]/60 mt-0.5">Secure storage</span>
            </div>
          </div>

          {/* Action / Instructions Based on Platform */}
          {isInstalled ? (
            <div className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] font-bold text-xs">
              <IoCheckmarkCircle size={18} />
              <span>SocialVerse App is already installed!</span>
            </div>
          ) : isReady ? (
            <button
              onClick={() => {
                installApp();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                boxShadow: `0 0 25px ${currentTheme.glow}`,
              }}
            >
              <IoDownloadOutline size={18} />
              <span>Install to Home Screen / Desktop</span>
            </button>
          ) : platform === 'ios' ? (
            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-xs text-[#CBD5E1]">
              <div className="font-bold text-white text-xs mb-1">To install on iPhone or iPad:</div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">1</span>
                <span>Tap the <IoShareOutline className="inline text-base text-[#38BDF8]" /> Share button in Safari toolbar.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">2</span>
                <span>Scroll down and select <span className="font-semibold text-white">"Add to Home Screen"</span> <IoAddCircleOutline className="inline text-base text-[#10B981]" />.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">3</span>
                <span>Tap <span className="font-semibold text-white">"Add"</span> in the top-right corner.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-xs text-[#CBD5E1]">
              <div className="font-bold text-white text-xs mb-1">Install from Browser Menu:</div>
              <p>
                Click your browser menu (⋮ or ⋯) and select <span className="font-semibold text-white">"Install SocialVerse"</span> or click the install icon in the URL address bar.
              </p>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-xs text-[#CBD5E1]/60 hover:text-white transition"
            >
              Continue in browser
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
