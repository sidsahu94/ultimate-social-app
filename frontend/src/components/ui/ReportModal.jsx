// frontend/src/components/ui/ReportModal.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';

const ReportModal = ({ isOpen, onClose, targetPostId, targetUserId, onReported }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return alert('Select a reason');
    setLoading(true);
    try {
      await API.post('/report', { targetPost: targetPostId, targetUser: targetUserId, reason, details });
      onReported && onReported();
      onClose();
    } catch (err) {
      console.error('report err', err);
      alert(err.userMessage || 'Failed to submit report');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (!loading) onClose(); }} />
      <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md bg-white rounded-xl p-5 z-10">
        <h3 className="text-lg font-semibold mb-2">Report</h3>
        <form onSubmit={submit} className="space-y-3">
          <select value={reason} onChange={(e)=>setReason(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Select reason</option>
            <option value="spam">Spam</option>
            <option value="harassment">Harassment</option>
            <option value="nudity">Nudity / sexual</option>
            <option value="hate">Hate speech</option>
            <option value="other">Other</option>
          </select>
          <textarea value={details} onChange={(e)=>setDetails(e.target.value)} placeholder="Details (optional)" className="w-full p-2 border rounded" rows={4} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
            <button disabled={loading} className="px-3 py-1 rounded bg-indigo-600 text-white">{loading ? 'Sending...' : 'Submit'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReportModal;
