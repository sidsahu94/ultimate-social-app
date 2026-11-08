// frontend/src/components/common/IncomingCallModal.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhoneAlt, FaPhoneSlash, FaVideo } from 'react-icons/fa';
import socket from '../../services/socket';
import UserAvatar from '../ui/UserAvatar';

export default function IncomingCallModal() {
  const [incomingCall, setIncomingCall] = useState(null);
  const navigate = useNavigate();
  const audioContextRef = useRef(null);
  const ringIntervalRef = useRef(null);

  // Play synthetic telephone ring tone using Web Audio API
  const startRingtone = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioContextRef.current = new AudioContext();

      const playRingBeep = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        const ctx = audioContextRef.current;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.2);
        osc2.stop(ctx.currentTime + 1.2);
      };

      playRingBeep();
      ringIntervalRef.current = setInterval(playRingBeep, 2500);
    } catch (_) {}
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    const handleIncoming = (payload) => {
      if (!payload?.roomId) return;
      setIncomingCall(payload);
      startRingtone();
    };

    const handleCallEnded = () => {
      stopRingtone();
      setIncomingCall(null);
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:rejected', handleCallEnded);

    return () => {
      stopRingtone();
      socket.off('call:incoming', handleIncoming);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:rejected', handleCallEnded);
    };
  }, []);

  const handleAccept = () => {
    if (!incomingCall?.roomId) return;
    const roomId = incomingCall.roomId;
    stopRingtone();
    setIncomingCall(null);
    navigate(`/chat/call/${roomId}`);
  };

  const handleDecline = () => {
    if (incomingCall?.roomId) {
      socket.emit('call:rejected', { roomId: incomingCall.roomId });
    }
    stopRingtone();
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-[32px] border border-white/20 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-8 text-center text-white shadow-2xl overflow-hidden"
          >
            {/* Ambient pulse glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-emerald-500/20 blur-[80px]" />

            {/* Pulsing Avatar Container */}
            <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20" />
              <span className="absolute inline-flex h-24 w-24 rounded-full border border-emerald-400/40" />
              <UserAvatar
                src={incomingCall.from?.avatar}
                name={incomingCall.from?.name || 'Caller'}
                className="relative h-20 w-20 rounded-full border-2 border-emerald-400 shadow-xl"
              />
            </div>

            <div className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
              <FaVideo className="animate-pulse" /> Incoming Video Call
            </div>

            <h3 className="text-2xl font-black text-white truncate px-2">
              {incomingCall.from?.name || 'Someone'}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              is requesting a video session
            </p>

            {/* Action buttons */}
            <div className="mt-8 flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 transition-transform hover:scale-110 active:scale-95"
                >
                  <FaPhoneSlash size={24} />
                </button>
                <span className="text-xs font-semibold text-slate-400">Decline</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleAccept}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-110 active:scale-95 animate-bounce"
                >
                  <FaPhoneAlt size={24} />
                </button>
                <span className="text-xs font-semibold text-emerald-400">Accept</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
