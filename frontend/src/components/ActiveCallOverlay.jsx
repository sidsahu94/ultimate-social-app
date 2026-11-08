import React, { useState, useEffect } from 'react';

export default function ActiveCallOverlay({ peerName = "Connected", isMuted, isVideoOn }) {
  const [duration, setDuration] = useState(0);

  // Timer for call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="absolute top-6 left-6 bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-2xl p-4 rounded-2xl z-30 flex flex-col gap-2 min-w-[160px] transition-all duration-300">
      <div className="flex items-center gap-3">
        {/* Pulsing active indicator */}
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
        <h3 className="text-white font-bold tracking-wide">{peerName}</h3>
      </div>
      
      <div className="text-gray-300 font-mono text-sm tracking-wider">
        {formatTime(duration)}
      </div>

      {/* Status Badges */}
      {(isMuted || !isVideoOn) && (
        <div className="flex flex-wrap gap-2 mt-1">
          {isMuted && (
            <span className="bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded text-xs font-semibold">
              Mic Muted
            </span>
          )}
          {!isVideoOn && (
            <span className="bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded text-xs font-semibold">
              Video Off
            </span>
          )}
        </div>
      )}
    </div>
  );
}