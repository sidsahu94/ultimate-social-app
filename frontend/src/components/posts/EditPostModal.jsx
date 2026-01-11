// frontend/src/components/posts/EditPostModal.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';
import { FaTimes, FaTrash, FaImage, FaPlus } from 'react-icons/fa';

export default function EditPostModal({ isOpen, onClose, post, onUpdated }) {
  const [content, setContent] = useState(post?.content || '');
  const [mediaToRemove, setMediaToRemove] = useState([]);
  const [newFiles, setNewFiles] = useState([]); // 🔥 NEW: Track new uploads
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  if (!isOpen) return null;

  // Filter out images marked for deletion from view
  const activeImages = (post?.images || []).filter(img => !mediaToRemove.includes(img));

  const toggleRemove = (imgUrl) => {
    if (mediaToRemove.includes(imgUrl)) {
        setMediaToRemove(prev => prev.filter(i => i !== imgUrl));
    } else {
        setMediaToRemove(prev => [...prev, imgUrl]);
    }
  };

  const handleFileChange = (e) => {
      if (e.target.files) {
          setNewFiles(prev => [...prev, ...Array.from(e.target.files)]);
      }
  };

  const removeNewFile = (index) => {
      setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // 🔥 FIX: Use FormData to support file uploads during edit
      const fd = new FormData();
      fd.append('content', content);
      
      // Append new media
      newFiles.forEach(f => fd.append('media', f));
      
      // Append removed media list (Backend should handle array parsing)
      // Note: Typically requires backend to parse `req.body.imagesToRemove`
      mediaToRemove.forEach(url => fd.append('imagesToRemove', url));

      await API.put(`/posts/${post._id}`, fd, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      add('Post updated successfully', { type: 'success' });
      if (onUpdated) onUpdated();
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
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="neu-card w-full max-w-lg p-6 relative"
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-gray-700">
            <h3 className="text-lg font-black text-gray-800 dark:text-white">Edit Post</h3>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                <FaTimes />
            </button>
        </div>
        
        {/* Content Input */}
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          className="neu-input h-32 resize-none mb-4"
          placeholder="What's on your mind?"
        />

        {/* Existing Images Management */}
        {(activeImages.length > 0 || mediaToRemove.length > 0) && (
            <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Current Media</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {activeImages.map((img, i) => (
                        <div key={i} className="relative w-20 h-20 flex-shrink-0 group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <img src={img} className="w-full h-full object-cover transition" alt="post media" />
                            <button 
                                onClick={() => toggleRemove(img)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                                title="Remove Image"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                    {/* Visual placeholder for deleted items (optional, could just hide them) */}
                    {mediaToRemove.length > 0 && (
                        <div className="flex items-center justify-center px-3 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900">
                            {mediaToRemove.length} removed
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Add New Media */}
        <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Add New Media</p>
            <div className="flex gap-2 overflow-x-auto">
                {/* Upload Button */}
                <label className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition text-gray-400 hover:text-primary bg-gray-50 dark:bg-gray-800">
                    <FaPlus />
                    <span className="text-[10px] font-bold mt-1">Add</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>

                {/* New Files Preview */}
                {newFiles.map((f, i) => (
                    <div key={i} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group">
                        <img src={URL.createObjectURL(f)} className="w-full h-full object-cover opacity-80" alt="preview" />
                        <button 
                            onClick={() => removeNewFile(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:scale-110 transition"
                        >
                            <FaTimes size={10} />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate} 
            disabled={loading} 
            className="btn-neon px-6 flex items-center gap-2"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}