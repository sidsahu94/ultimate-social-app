// frontend/src/components/ui/ConfirmModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

const ConfirmModal = ({ isOpen, title = 'Are you sure?', description = '', confirmLabel = 'Yes, delete', cancelLabel = 'Cancel', loading = false, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (!loading) onCancel && onCancel(); }} />
      <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-5 z-10 modal-accent">
        <div className="flex items-start gap-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description ? <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p> : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => onCancel && onCancel()} disabled={loading} className="px-4 py-2 rounded border">
            {cancelLabel}
          </button>
          <button onClick={() => onConfirm && onConfirm()} disabled={loading} className="px-4 py-2 rounded bg-gradient-to-r from-indigo-600 to-pink-500 text-white">
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmModal;
