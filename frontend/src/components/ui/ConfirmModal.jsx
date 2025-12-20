import React from 'react';
import { motion } from 'framer-motion';

export default function ConfirmModal({ isOpen, onCancel, onConfirm, title, description }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center">
        <h3 className="text-xl font-bold mb-2">{title || "Are you sure?"}</h3>
        <p className="text-sm text-gray-500 mb-6">{description || "This action cannot be undone."}</p>
        
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-medium">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}