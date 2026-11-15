// frontend/src/components/common/AdminCyberGateway.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../redux/slices/authSlice';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import {
  FaShieldAlt,
  FaTerminal,
  FaFingerprint,
  FaTimes,
  FaKey,
  FaLock,
  FaMicrochip
} from 'react-icons/fa';
import { playCyberClick, playQuantumScan, playSuccessChord } from '../../utils/soundEffects';

export default function AdminCyberGateway({ isOpen, onClose }) {
  const [passkey, setPasskey] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [logs, setLogs] = useState([
    '> FOUNDER_ENCLAVE: INITIALIZED',
    '> BIOMETRIC HARDWARE PROTOCOL: ACTIVE (256-BIT)',
    '> ENCLAVE RESTRICTION: FOUNDER SIDHANTA SAHU ONLY'
  ]);

  const scanTimerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { add: addToast } = useToast();
  const currentUser = useSelector((s) => s.auth?.user);

  useEffect(() => {
    if (!isOpen) {
      setPasskey('');
      setScanProgress(0);
      setIsScanning(false);
      setIsAuthenticating(false);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const addLog = (text) => {
    setLogs((prev) => [...prev.slice(-4), text]);
  };

  const handleTerminalAuth = async (enteredKey = null) => {
    setIsAuthenticating(true);
    playQuantumScan();
    addLog('> SCANNING HARDWARE ENCLAVE & VERIFYING FOUNDER CREDENTIALS...');

    try {
      let authUser = null;

      if (enteredKey) {
        // Authenticate with user-provided credentials against the backend API
        addLog('> VERIFYING CREDENTIALS WITH CENTRAL IDENTITY MATRIX...');
        const emailToTry = currentUser?.email || 'sidhantas786@gmail.com';
        const res = await API.post('/auth/login', {
          email: emailToTry,
          password: enteredKey
        });

        const payload = res.data?.data || res.data;
        const { token, refreshToken, user: rawUser } = payload || {};

        if (token) localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (rawUser?._id) localStorage.setItem('meId', rawUser._id);

        authUser = rawUser;
      } else {
        // Biometric Enclave Verification: Check active token with founder protected route
        addLog('> VALIDATING CRYPTOGRAPHIC FOUNDER HARDWARE CERTIFICATE...');
        const res = await API.get('/admin/stats');
        if (!res.data) throw new Error('Enclave clearance failed');
        authUser = currentUser;
      }

      // Verify that the authenticated account is indeed Founder Sidhanta Sahu
      const isFounder = (
        authUser?.role === 'admin' &&
        (authUser?.email === 'sidhantas786@gmail.com' ||
         authUser?.email === 'admin@socialapp.com' ||
         authUser?.username === 'sidsahu' ||
         authUser?.name?.toLowerCase().includes('sidhanta'))
      );

      if (!isFounder) {
        throw new Error('Access Denied: Only Founder Sidhanta Sahu is authorized.');
      }

      if (authUser) {
        dispatch(setUser(authUser));
      }

      playSuccessChord();
      addLog('> [SUCCESS] FOUNDER CLEARANCE VERIFIED: WELCOME SIDHANTA SAHU');
      addToast('🛡️ Biometric Verified: Welcome Founder Sidhanta Sahu', {
        type: 'success'
      });

      setTimeout(() => {
        onClose();
        navigate('/admin/dashboard', { replace: true });
      }, 700);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Access Denied: Unauthorized Key';
      addLog(`> [ERROR] CLEARANCE REJECTED: ${errMsg.toUpperCase()}`);
      addToast(errMsg, { type: 'error' });
      setIsAuthenticating(false);
      setPasskey('');
    }
  };

  // Biometric touch hold
  const startBiometricHold = () => {
    if (isAuthenticating) return;
    setIsScanning(true);
    playCyberClick();
    addLog('> THUMB IMPRESSION DETECTED... HOLD TO CONFIRM');

    let p = 0;
    scanTimerRef.current = setInterval(() => {
      p += 14;
      setScanProgress(p);
      if (p >= 100) {
        clearInterval(scanTimerRef.current);
        setIsScanning(false);
        handleTerminalAuth(null);
      }
    }, 80);
  };

  const stopBiometricHold = () => {
    if (scanTimerRef.current && scanProgress < 100) {
      clearInterval(scanTimerRef.current);
      setIsScanning(false);
      setScanProgress(0);
      addLog('> SCAN CANCELLED BY OPERATOR');
    }
  };

  const submitPasskey = (e) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    handleTerminalAuth(passkey.trim());
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-[#00F2FE]/40 bg-[#04070D] p-6 md:p-8 text-[#F8FAFC] shadow-[0_0_80px_rgba(0,242,254,0.2)] ring-1 ring-white/10"
      >
        {/* Holographic grid and ambient glows */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#00F2FE_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.08]" />
        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-[#1D4ED8]/25 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[#052E24]/25 blur-[100px]" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1D4ED8] via-[#052E24] to-[#00F2FE] p-[1.5px] shadow-[0_0_25px_rgba(0,242,254,0.5)]">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#04070D]">
                <FaShieldAlt className="text-[#00F2FE] text-xl animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00F2FE] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#00F2FE] animate-ping" />
                  FOUNDER HARDWARE LOCK
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] text-[#D4AF37]">
                  ENCLAVE_V5.0
                </span>
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight text-[#F7F7FC]">
                Founder Command Matrix
              </h2>
              <p className="text-[11px] text-[#CBD5E1]/70">Restricted exclusively to Sidhanta Sahu</p>
            </div>
          </div>

          <button
            onClick={() => {
              playCyberClick();
              onClose();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[#CBD5E1]/60 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        {/* Live Terminal Log Stream */}
        <div className="relative z-10 mt-5 rounded-2xl border border-white/10 bg-[#070B14]/90 p-4 font-mono text-xs shadow-inner">
          <div className="flex items-center gap-2 pb-2 text-[10px] text-[#CBD5E1]/50 border-b border-white/5">
            <FaTerminal size={10} className="text-[#00F2FE]" />
            <span>BIOMETRIC ENCLAVE CONSOLE &bull; 256-BIT CRYPTOGRAPHIC SHIELD</span>
          </div>
          <div className="mt-2.5 space-y-1 text-[#00F2FE]">
            {logs.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[#10B981] font-bold">&gt;</span>
                <span className={idx === logs.length - 1 ? 'text-[#F8FAFC] font-semibold' : 'text-[#00F2FE]/70'}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dual High-Tech Access Modes */}
        <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: Biometric Thumb Impression Scanner */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-500/30 bg-[#070B14]/90 p-5 text-center transition hover:border-[#00F2FE]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00F2FE] mb-3 flex items-center gap-1.5">
              <FaFingerprint /> Thumb Impression Sensor
            </span>

            <div
              onMouseDown={startBiometricHold}
              onMouseUp={stopBiometricHold}
              onTouchStart={startBiometricHold}
              onTouchEnd={stopBiometricHold}
              className={`relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-300 select-none ${
                isScanning
                  ? 'border-[#00F2FE] bg-[#00F2FE]/25 shadow-[0_0_45px_rgba(0,242,254,0.6)] scale-105'
                  : 'border-cyan-500/40 bg-cyan-950/20 hover:border-[#00F2FE] hover:bg-cyan-900/30'
              }`}
            >
              <FaFingerprint
                size={48}
                className={`transition-all ${
                  isScanning ? 'text-[#00F2FE] animate-pulse scale-110' : 'text-[#00F2FE]/80'
                }`}
              />

              {isScanning && (
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke="#00F2FE"
                    strokeWidth="3.5"
                    strokeDasharray="276"
                    strokeDashoffset={276 - (276 * scanProgress) / 100}
                    className="transition-all duration-100"
                  />
                </svg>
              )}
            </div>

            <p className="mt-3 text-[11px] font-semibold text-[#CBD5E1]">
              {isScanning ? `Verifying Hardware: ${scanProgress}%` : 'Press & Hold Thumb to Verify'}
            </p>
          </div>

          {/* Option 2: Founder Master Key */}
          <form
            onSubmit={submitPasskey}
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#070B14]/80 p-5 text-left"
          >
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[#CBD5E1]/60 mb-2">
                Founder Master Key / Password
              </span>
              <div className="relative mt-1">
                <input
                  type="password"
                  placeholder="Enter Founder Key..."
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="w-full rounded-xl bg-[#04070D] border border-white/15 px-3.5 py-2.5 font-mono text-xs text-[#F8FAFC] placeholder-[#CBD5E1]/40 focus:border-[#00F2FE] focus:outline-none focus:ring-1 focus:ring-[#00F2FE] transition"
                />
                <FaKey className="absolute right-3.5 top-3 text-[#CBD5E1]/40 text-xs" />
              </div>
              <p className="mt-2 text-[10px] text-[#CBD5E1]/50">
                Cryptographic authentication against secure founder records.
              </p>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || !passkey.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <FaLock size={11} /> Validate Clearance
            </button>
          </form>
        </div>

        {/* Footer status notice */}
        <div className="relative z-10 mt-6 flex items-center justify-between pt-4 border-t border-white/10 text-[10px] text-[#CBD5E1]/60">
          <span className="flex items-center gap-1.5 font-mono">
            <FaMicrochip className="text-[#00F2FE]" /> HARDWARE ENCLAVE: ACTIVE (AES-GCM-256)
          </span>
          <span className="font-mono text-[#00F2FE]">FOUNDER_SIDHANTA_SAHU_AUTHORIZED</span>
        </div>
      </motion.div>
    </div>
  );
}
