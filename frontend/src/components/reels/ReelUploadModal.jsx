// frontend/src/components/reels/ReelUploadModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

export default function ReelUploadModal({ file, onClose, onConfirm, uploading, progress }) {
  const [caption, setCaption] = useState('');

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold">New Reel</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>

        {/* Preview */}
        <div className="bg-black aspect-[9/16] relative flex items-center justify-center overflow-hidden">
          <video 
            src={URL.createObjectURL(file)} 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Footer / Input */}
        <div className="p-4 space-y-4">
          <input 
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none"
            autoFocus
          />
          
          {uploading ? (
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-500">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </div>
          ) : (
            <button 
                onClick={() => onConfirm(caption)} 
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
                <FaPaperPlane /> Share Reel
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}