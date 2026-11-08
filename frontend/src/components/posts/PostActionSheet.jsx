// frontend/src/components/posts/PostActionSheet.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import ReportModal from '../ui/ReportModal';
import EditPostModal from './EditPostModal';

export default function PostActionSheet({ post, isMine, onClose }) {
  const { add } = useToast();
  const [showReport, setShowReport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await API.delete(`/posts/${post._id}`);
      add("Post deleted", { type: 'success' });
      window.dispatchEvent(new CustomEvent('postDeleted', { detail: post._id }));
      onClose();
    } catch (e) {
      add("Failed to delete", { type: 'error' });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl" onClick={onClose}>
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }} 
          onClick={e => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-[#070B14]/95 border-t border-white/15 rounded-t-3xl overflow-hidden shadow-2xl max-w-md mx-auto backdrop-blur-2xl"
        >
          <div className="p-3.5 border-b border-white/5 flex justify-center">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>

          <div className="p-2 space-y-1">
            {isMine ? (
              <>
                <button 
                  onClick={() => setShowEdit(true)} 
                  className="w-full p-4 flex items-center gap-3.5 hover:bg-white/5 rounded-2xl transition font-medium text-xs text-[#F7F7FC]"
                >
                  <FaEdit className="text-[#00F2FE]" size={14} /> Edit Broadcast
                </button>
                <button 
                  onClick={handleDelete} 
                  className="w-full p-4 flex items-center gap-3.5 hover:bg-[#052E24]/20 rounded-2xl transition font-medium text-xs text-[#F87171]"
                >
                  <FaTrash size={14} /> Delete Broadcast
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowReport(true)} 
                className="w-full p-4 flex items-center gap-3.5 hover:bg-[#052E24]/20 rounded-2xl transition font-medium text-xs text-[#F87171]"
              >
                <FaExclamationTriangle size={14} /> Report Content
              </button>
            )}
            
            <div className="h-px bg-white/10 my-1" />
            
            <button 
              onClick={onClose} 
              className="w-full p-3.5 font-bold text-xs text-[#A5A9BB] hover:text-[#F7F7FC] hover:bg-white/5 rounded-2xl transition"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>

      {showReport && <ReportModal isOpen={true} onClose={() => { setShowReport(false); onClose(); }} targetPostId={post._id} />}
      
      {showEdit && (
        <EditPostModal 
            isOpen={true} 
            onClose={() => { setShowEdit(false); onClose(); }} 
            post={post}
            onUpdated={() => {
                window.location.reload();
            }} 
        />
      )}
    </>
  );
}
