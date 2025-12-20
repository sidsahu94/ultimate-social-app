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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-xl font-bold mb-4">Report Content</h3>
        <p className="text-sm text-gray-500 mb-4">Why are you reporting this?</p>

        <div className="space-y-2 mb-6">
          {['Spam or Scam', 'Hate Speech', 'Nudity/Sexual', 'Harassment', 'Misinformation'].map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left p-3 rounded-xl border transition ${reason === r ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={!reason} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold disabled:opacity-50">Submit</button>
        </div>
      </motion.div>
    </div>
  );
}
