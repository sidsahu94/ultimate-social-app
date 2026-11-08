// frontend/src/components/posts/EditPostModal.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';
import { FaTimes, FaTrash, FaPlus } from 'react-icons/fa';

export default function EditPostModal({ isOpen, onClose, post, onUpdated }) {
  const [content, setContent] = useState(post?.content || '');
  const [mediaToRemove, setMediaToRemove] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  if (!isOpen) return null;

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
      const fd = new FormData();
      fd.append('content', content);
      newFiles.forEach(f => fd.append('media', f));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-lg p-6 relative rounded-3xl bg-[#070B14]/95 border border-white/15 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
            <h3 className="text-base font-bold text-[#F7F7FC]">Edit Broadcast</h3>
            <button onClick={onClose} className="p-1.5 text-[#A5A9BB] hover:text-[#F7F7FC] rounded-full transition">
                <FaTimes size={14} />
            </button>
        </div>
        
        {/* Content Input */}
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          className="w-full p-3.5 rounded-2xl bg-[#0A111E] border border-white/10 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50 h-32 resize-none mb-4 leading-relaxed transition"
          placeholder="What's on your mind?"
        />

        {/* Existing Images Management */}
        {(activeImages.length > 0 || mediaToRemove.length > 0) && (
            <div className="mb-4">
                <p className="text-[10px] font-bold text-[#A5A9BB] uppercase tracking-wider mb-2">Current Media</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {activeImages.map((img, i) => (
                        <div key={i} className="relative w-20 h-20 flex-shrink-0 group rounded-xl overflow-hidden border border-white/10 bg-black/40">
                            <img src={img} className="w-full h-full object-cover transition" alt="post media" />
                            <button 
                                onClick={() => toggleRemove(img)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#F87171] transition"
                                title="Remove Image"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    ))}
                    {mediaToRemove.length > 0 && (
                        <div className="flex items-center justify-center px-3 text-[10px] font-bold text-[#F87171] bg-[#052E24]/15 rounded-xl border border-[#052E24]/30">
                            {mediaToRemove.length} to remove
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Add New Media */}
        <div className="mb-6">
            <p className="text-[10px] font-bold text-[#A5A9BB] uppercase tracking-wider mb-2">Add Media</p>
            <div className="flex gap-2 overflow-x-auto">
                <label className="w-20 h-20 flex-shrink-0 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#00F2FE]/50 transition text-[#A5A9BB] hover:text-[#00F2FE] bg-[#0A111E]">
                    <FaPlus size={14} />
                    <span className="text-[10px] font-bold mt-1">Add</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>

                {newFiles.map((f, i) => (
                    <div key={i} className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 group">
                        <img src={URL.createObjectURL(f)} className="w-full h-full object-cover opacity-80" alt="preview" />
                        <button 
                            onClick={() => removeNewFile(i)}
                            className="absolute top-1 right-1 bg-[#052E24] text-white p-1 rounded-full shadow-md hover:scale-110 transition"
                        >
                            <FaTimes size={8} />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-xs font-semibold text-[#A5A9BB] hover:text-[#F7F7FC] transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate} 
            disabled={loading} 
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white text-xs font-bold shadow-md hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
