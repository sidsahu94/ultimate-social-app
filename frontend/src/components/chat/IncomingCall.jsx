import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaTimes, FaPhone } from 'react-icons/fa';
import socket from '../../services/socket';
import { useNavigate } from 'react-router-dom';

export default function IncomingCall() {
  const [call, setCall] = useState(null);
  const nav = useNavigate();
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/ringtone.mp3');
    audioRef.current.loop = true;

    const stopRingtone = () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };

    const onIncoming = (data) => {
      setCall(data);
      audioRef.current?.play().catch(() => {});
    };

    const onEnd = () => {
      setCall(null);
      stopRingtone();
    };

    socket.on('call:incoming', onIncoming);
    socket.on('call:ended', onEnd);
    socket.on('call:rejected', onEnd);

    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:ended', onEnd);
      socket.off('call:rejected', onEnd);
      stopRingtone();
    };
  }, []);

  const accept = () => {
    if (!call) return;
    audioRef.current?.pause();
    nav(`/chat/call/${call.roomId}`);
    setCall(null);
  };

  const reject = () => {
    if (call) socket.emit('call:rejected', { roomId: call.roomId });
    setCall(null);
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed left-1/2 top-4 z-[100] flex w-[95%] max-w-sm -translate-x-1/2 items-center justify-between rounded-[24px] border border-white/10 bg-[#0f1318]/95 p-4 text-white shadow-2xl backdrop-blur-md ring-2 ring-[#c89b5c]/40"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={call.from?.avatar || '/default-avatar.png'}
                className="h-12 w-12 rounded-full border-2 border-emerald-500 object-cover"
                alt="Caller"
              />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 animate-ping" />
            </div>
            <div>
              <div className="text-lg font-bold leading-tight">{call.from?.name || 'Unknown'}</div>
              <div className="flex items-center gap-1 text-xs text-[#e1bf8e]">
                <FaVideo size={10} /> Incoming video call…
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reject}
              className="grid h-10 w-10 place-items-center rounded-full bg-rose-500 shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 active:scale-95"
            >
              <FaTimes />
            </button>
            <button
              onClick={accept}
              className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 active:scale-95"
            >
              <FaPhone className="rotate-90" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}