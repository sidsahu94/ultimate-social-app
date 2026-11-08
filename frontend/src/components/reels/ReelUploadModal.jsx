// frontend/src/components/reels/ReelUploadModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

export default function ReelUploadModal({ file, onClose, onConfirm, uploading, progress }) {
  const [caption, setCaption] = useState('');

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#070B14]/95 border border-white/15 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#171A26]/40">
          <h3 className="font-bold text-[#F7F7FC] text-sm tracking-wide">Publish Cinematic Reel</h3>
          <button onClick={onClose} className="p-1 rounded-full text-[#A5A9BB] hover:text-[#F7F7FC] transition">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-black aspect-[9/16] relative flex items-center justify-center overflow-hidden border-b border-white/10">
          <video 
            src={URL.createObjectURL(file)} 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Footer / Input */}
        <div className="p-5 space-y-4 bg-[#070B14]">
          <input 
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write a cinematic caption..."
            className="w-full p-3.5 rounded-2xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] placeholder-[#A5A9BB] outline-none text-xs focus:border-[#00F2FE]/50 transition"
            autoFocus
          />
          
          {uploading ? (
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#00F2FE]">
                    <span>Broadcasting to Feed...</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#1D4ED8] via-[#0F766E] to-[#00F2FE] transition-all duration-300" 
                      style={{ width: `${progress}%` }} 
                    />
                </div>
            </div>
          ) : (
            <button 
                onClick={() => onConfirm(caption)} 
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_4px_20px_rgba(29,78,216,0.35)] transition-all active:scale-95"
            >
                <FaPaperPlane /> Share Reel
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
