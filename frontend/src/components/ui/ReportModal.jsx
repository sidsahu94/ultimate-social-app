// frontend/src/components/ui/ReportModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import API from '../../services/api';
import { useToast } from './ToastProvider';

export default function ReportModal({ isOpen, onClose, targetPostId, targetUserId }) {
  const [reason, setReason] = useState('');
  const { add } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    try {
      await API.post('/report', {
        targetPost: targetPostId,
        targetUser: targetUserId,
        reason
      });
      add('Report submitted. Thank you for keeping our community safe.', { type: 'success' });
      onClose();
    } catch (e) {
      add('Failed to report', { type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#070B14]/95 border border-white/15 rounded-3xl p-6 w-full max-w-sm shadow-2xl backdrop-blur-2xl"
      >
        <h3 className="text-lg font-bold text-[#F7F7FC] mb-1">Report Content</h3>
        <p className="text-xs text-[#CBD5E1] mb-4">Select the primary reason for reporting this artifact:</p>

        <div className="space-y-2 mb-6">
          {['Spam or Scam', 'Hate Speech', 'Nudity/Sexual', 'Harassment', 'Misinformation'].map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left p-3 rounded-2xl border text-xs font-semibold transition ${
                reason === r 
                  ? 'border-[#10B981] bg-[#052E24]/25 text-[#F7F7FC] shadow-[0_0_15px_rgba(185,28,28,0.25)]' 
                  : 'border-white/10 bg-[#0A111E] text-[#CBD5E1] hover:border-white/20'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#A5A9BB] hover:text-[#F7F7FC] transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={!reason} 
            className="flex-1 py-2.5 rounded-xl bg-[#052E24] text-white text-xs font-bold shadow-md hover:bg-[#10B981] transition disabled:opacity-40"
          >
            Submit
          </button>
        </div>
      </motion.div>
    </div>
  );
}
