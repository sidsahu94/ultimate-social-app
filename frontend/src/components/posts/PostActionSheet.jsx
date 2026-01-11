// frontend/src/components/posts/PostActionSheet.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import ReportModal from '../ui/ReportModal';
import EditPostModal from './EditPostModal'; // Ensure this path is correct based on your file structure

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
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }} 
          onClick={e => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden shadow-2xl max-w-md mx-auto"
        >
          <div className="p-4 border-b dark:border-gray-800 flex justify-center">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
          </div>

          <div className="p-2 space-y-1">
            {isMine ? (
              <>
                <button onClick={() => setShowEdit(true)} className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium dark:text-gray-200">
                  <FaEdit className="text-indigo-500" /> Edit Post
                </button>
                <button onClick={handleDelete} className="w-full p-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium text-red-500">
                  <FaTrash /> Delete Post
                </button>
              </>
            ) : (
              <button onClick={() => setShowReport(true)} className="w-full p-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium text-red-500">
                <FaExclamationTriangle /> Report
              </button>
            )}
            
            <div className="h-2 bg-gray-100 dark:bg-gray-800" />
            
            <button onClick={onClose} className="w-full p-4 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
          </div>
        </motion.div>
      </div>

      {/* Nested Modals */}
      {showReport && <ReportModal isOpen={true} onClose={() => { setShowReport(false); onClose(); }} targetPostId={post._id} />}
      
      {showEdit && (
        <EditPostModal 
            isOpen={true} 
            onClose={() => { setShowEdit(false); onClose(); }} 
            post={post}
            onUpdated={(updatedPost) => {
                // Optional: Dispatch event to update local post state if complex
                window.location.reload(); // Simple brute force update for edits
            }} 
        />
      )}
    </>
  );
}