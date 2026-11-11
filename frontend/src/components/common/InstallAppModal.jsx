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
  IoCheckmarkCircle,
  IoDesktopOutline,
  IoPhonePortraitOutline,
  IoSparklesOutline,
  IoOpenOutline
} from 'react-icons/io5';
import { useTheme } from '../../contexts/ThemeProvider';
import usePWAInstall from '../../hooks/usePWAInstall';
import { playSound } from '../../utils/soundEffects';

export default function InstallAppModal({ isOpen, onClose }) {
  const { currentTheme } = useTheme();
  const { isReady, installApp, isInstalled } = usePWAInstall();

  const [platform, setPlatform] = useState('desktop');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  // 1-Click Desktop Shortcut Generator & Downloader
  const handleDownloadDesktopShortcut = () => {
    try {
      playSound('install');
      const appUrl = window.location.origin;
      const urlContent = `[InternetShortcut]\r\nURL=${appUrl}\r\nIconIndex=0\r\nIconFile=${appUrl}/favicon.ico\r\nHotKey=0\r\n[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,11\r\n`;
      const blob = new Blob([urlContent], { type: 'application/internet-shortcut;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'SocialVerse.url';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (e) {
      console.error('Desktop shortcut creation failed:', e);
    }
  };

  // Primary 1-Click Action: tries native PWA prompt first; if not ready, gives instant shortcut download
  const handlePrimaryInstall = async () => {
    playSound('install');
    if (isReady) {
      const res = await installApp();
      if (res) {
        onClose();
        return;
      }
    }
    // If PWA prompt is not supported by current browser session, trigger 1-click desktop download directly
    if (platform === 'desktop') {
      handleDownloadDesktopShortcut();
    }
  };

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
            boxShadow: `0 24px 60px rgba(0,0,0,0.8), 0 0 45px ${currentTheme.glow}`,
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
          <div className="flex flex-col items-center text-center mt-2 mb-5">
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl p-[2px] shadow-2xl mb-3"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                boxShadow: `0 0 35px ${currentTheme.glow}`,
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

            <h3 className="font-display text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
              Install SocialVerse <span style={{ color: currentTheme.accent }}>∞</span>
            </h3>
            <p className="text-xs text-[#CBD5E1]/80 mt-1">
              Experience the next-generation social ecosystem as a standalone native app.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
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

          {/* Download Success Notice */}
          <AnimatePresence>
            {downloadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 flex items-center gap-2.5 rounded-2xl border border-[#10B981]/50 bg-[#10B981]/20 p-3 text-xs font-semibold text-[#10B981]"
              >
                <IoCheckmarkCircle size={20} className="shrink-0" />
                <span>Desktop shortcut downloaded! Open it from your Downloads folder to launch anytime.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Area: Clear 1-Click Buttons */}
          {isInstalled ? (
            <div className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] font-bold text-xs">
              <IoCheckmarkCircle size={20} />
              <span>SocialVerse is already installed on your device!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* PRIMARY 1-CLICK BUTTON */}
              <button
                type="button"
                onClick={handlePrimaryInstall}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.color}, ${currentTheme.accent})`,
                  boxShadow: `0 0 30px ${currentTheme.glow}`,
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <IoDownloadOutline size={20} className="animate-bounce" />
                <span>
                  {isReady 
                    ? '⚡ Install App Now (1-Click Native)' 
                    : platform === 'desktop' 
                    ? '⬇️ Download Desktop App (1-Click)' 
                    : '📲 Install SocialVerse App'}
                </span>
              </button>

              {/* SECONDARY 1-CLICK ACTION FOR DESKTOP (Always available) */}
              {platform === 'desktop' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadDesktopShortcut}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <IoDesktopOutline size={16} className="text-[#00F2FE]" />
                    <span>Download Desktop Shortcut (.url)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.open(window.location.href, '_blank', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes');
                    }}
                    title="Launch in borderless standalone window"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <IoOpenOutline size={15} />
                    <span>Window</span>
                  </button>
                </div>
              )}

              {/* BROWSER OMNIBOX GUIDE BANNER (Visual & Clear) */}
              {platform === 'desktop' && !isReady && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-xs text-[#CBD5E1]">
                  <div className="flex items-center gap-2 font-bold text-white text-xs mb-1.5">
                    <IoSparklesOutline className="text-cyan-400 text-sm animate-pulse" />
                    <span>Instant Browser Install:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#94A3B8]">
                    In Chrome or Edge, look at the top-right of your address bar and click the{' '}
                    <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 font-bold text-white">
                      ⊕ Install
                    </span>{' '}
                    icon next to the bookmark star for an instant standalone install!
                  </p>
                </div>
              )}

              {/* iOS SAFARI STEP-BY-STEP (Only shown on iOS) */}
              {platform === 'ios' && (
                <div className="space-y-2.5 rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-xs text-[#CBD5E1]">
                  <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                    <IoPhonePortraitOutline className="text-sky-400" />
                    <span>Add to iPhone / iPad Home Screen:</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">1</span>
                    <span>Tap the <IoShareOutline className="inline text-base text-[#38BDF8]" /> Share button in Safari toolbar.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">2</span>
                    <span>Scroll down and tap <span className="font-semibold text-white">"Add to Home Screen"</span> <IoAddCircleOutline className="inline text-base text-[#10B981]" />.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">3</span>
                    <span>Tap <span className="font-semibold text-white">"Add"</span> in the top-right corner.</span>
                  </div>
                </div>
              )}
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
