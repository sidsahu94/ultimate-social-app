// frontend/src/components/posts/EditPostModal.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';
import { FaTimes, FaTrash } from 'react-icons/fa';

export default function EditPostModal({ isOpen, onClose, post, onUpdated }) {
  const [content, setContent] = useState(post?.content || '');
  const [mediaToRemove, setMediaToRemove] = useState([]);
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  if (!isOpen) return null;

  // Calculate which images are currently active (not marked for removal)
  const activeImages = (post?.images || []).filter(img => !mediaToRemove.includes(img));

  const toggleRemove = (imgUrl) => {
    if (mediaToRemove.includes(imgUrl)) {
        // Restore image
        setMediaToRemove(prev => prev.filter(i => i !== imgUrl));
    } else {
        // Mark for deletion
        setMediaToRemove(prev => [...prev, imgUrl]);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Send content and list of images to remove.
      // NOTE: This uses JSON body. If you ever want to add *NEW* files here, 
      // you would need to switch to FormData.
      const payload = { 
          content,
          imagesToRemove: mediaToRemove
      };
      
      const res = await API.put(`/posts/${post._id}`, payload);
      add('Post updated successfully', { type: 'success' });
      
      if (onUpdated) onUpdated(res.data);
      onClose();
    } catch (e) {
      add(e.userMessage || 'Failed to update post', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Edit Post</h3>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                <FaTimes />
            </button>
        </div>
        
        {/* Content Area */}
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          className="w-full h-32 p-3 rounded-lg border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none mb-4 resize-none text-gray-800 dark:text-gray-100"
          placeholder="What's on your mind?"
        />

        {/* Image Management */}
        {activeImages.length > 0 && (
            <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase font-bold tracking-wider">Media</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {activeImages.map((img, i) => (
                        <div key={i} className="relative w-24 h-24 flex-shrink-0 group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <img src={img} className="w-full h-full object-cover transition group-hover:opacity-90" alt="post media" />
                            {/* Delete Button Overlay */}
                            <button 
                                onClick={() => toggleRemove(img)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                                title="Remove Image"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {/* Info Message */}
        {mediaToRemove.length > 0 && (
            <div className="text-xs text-red-500 mt-2 mb-4 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <FaTrash />
                {mediaToRemove.length} image(s) will be deleted upon saving.
            </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate} 
            disabled={loading} 
            className="btn-primary px-6 py-2 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}