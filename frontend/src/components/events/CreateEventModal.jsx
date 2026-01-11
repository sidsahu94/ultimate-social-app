// frontend/src/components/events/CreateEventModal.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaImage, FaSpinner } from 'react-icons/fa';
import { useToast } from '../ui/ToastProvider';

export default function CreateEventModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', date: '', location: '', description: '' });
  const [file, setFile] = useState(null); // 🔥 NEW: File state
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = '';
      
      // 🔥 NEW: Upload Logic
      if (file) {
          const fd = new FormData();
          fd.append('media', file);
          const upRes = await API.post('/extra/upload', fd);
          imageUrl = upRes.data.url;
      }

      await API.post('/apps/events', { ...form, image: imageUrl });
      
      add('Event created successfully!', { type: 'success' });
      onCreated();
      onClose();
      setForm({ title: '', date: '', location: '', description: '' });
      setFile(null);
    } catch (e) {
      add('Failed to create event', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="neu-card w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black text-gray-800 dark:text-white">Host an Event</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><FaTimes /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          
          {/* 🔥 NEW: Image Upload UI */}
          <div className="relative">
            <label className={`
                flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${file ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}
            `}>
                {file ? (
                    <img src={URL.createObjectURL(file)} className="h-full w-full object-cover rounded-xl opacity-80" alt="preview" />
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <FaImage size={24} className="mb-2" />
                        <span className="text-xs font-bold">Add Event Cover</span>
                    </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </label>
            {file && (
                <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); setFile(null); }} 
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:scale-110 transition"
                >
                    <FaTimes size={10} />
                </button>
            )}
          </div>

          <input 
            placeholder="Event Title" 
            className="neu-input"
            value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
          />
          
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FaCalendarAlt className="absolute top-4 left-4 text-gray-400" />
              <input 
                type="datetime-local" 
                className="neu-input pl-10"
                value={form.date} onChange={e => setForm({...form, date: e.target.value})} required
              />
            </div>
          </div>

          <div className="relative">
            <FaMapMarkerAlt className="absolute top-4 left-4 text-gray-400" />
            <input 
              placeholder="Location (e.g. New York)" 
              className="neu-input pl-10"
              value={form.location} onChange={e => setForm({...form, location: e.target.value})} required
            />
          </div>

          <textarea 
            placeholder="Description..." 
            className="neu-input h-24 resize-none"
            value={form.description} onChange={e => setForm({...form, description: e.target.value})}
          />

          <button disabled={loading} className="w-full btn-neon flex items-center justify-center gap-2">
            {loading ? <><FaSpinner className="animate-spin" /> Creating...</> : 'Launch Event'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}