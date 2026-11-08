import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophoneSlash, FaPhoneSlash, FaVideo } from 'react-icons/fa';

export default function ActiveCallOverlay({ peerName, isMuted, isVideoOn, onEndCall }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
      >
        <div className="relative flex items-center gap-6 px-6 py-4 rounded-full bg-[#070B14]/95 backdrop-blur-2xl border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.85)]">
          
          {!isMuted && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-6 w-12 h-12 bg-[#14B8A6]/40 rounded-full -z-10"
            />
          )}

          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#00F2FE] shadow-[0_0_15px_rgba(100,223,223,0.4)]">
              <img src="/default-avatar.png" alt="Peer" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col pr-4">
              <span className="text-[#F7F7FC] font-bold text-sm tracking-wide">{peerName}</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#052E24] animate-pulse" />
                <span className="text-[#00F2FE] text-[10px] font-bold tracking-widest uppercase">Live</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-white/10 pl-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3.5 rounded-full transition-all duration-300 ${
                isMuted 
                  ? 'bg-[#052E24] text-white shadow-[0_0_15px_rgba(139,0,24,0.5)]' 
                  : 'bg-[#0A111E] hover:bg-white/10 text-[#F7F7FC] border border-white/10'
              }`}
            >
              <FaMicrophoneSlash className="text-lg" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3.5 rounded-full transition-all duration-300 ${
                !isVideoOn 
                  ? 'bg-[#052E24] text-white shadow-[0_0_15px_rgba(139,0,24,0.5)]' 
                  : 'bg-[#0A111E] hover:bg-white/10 text-[#F7F7FC] border border-white/10'
              }`}
            >
              <FaVideo className="text-lg" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEndCall}
              className="p-3.5 rounded-full bg-[#052E24] hover:bg-[#10B981] text-white shadow-[0_8px_20px_rgba(139,0,24,0.5)] transition-all ml-2"
            >
              <FaPhoneSlash className="text-lg" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
