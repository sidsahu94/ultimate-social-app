// frontend/src/components/ui/ConfirmModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function ConfirmModal({ isOpen, onCancel, onConfirm, title, description }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#070B14]/95 border border-white/15 rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center backdrop-blur-2xl"
      >
        <h3 className="text-lg font-bold text-[#F7F7FC] mb-2">{title || "Are you sure?"}</h3>
        <p className="text-xs text-[#CBD5E1] mb-6 leading-relaxed">{description || "This action cannot be undone."}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#A5A9BB] hover:text-[#F7F7FC] transition"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-2.5 rounded-xl bg-[#052E24] hover:bg-[#10B981] text-white text-xs font-bold shadow-md transition"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
