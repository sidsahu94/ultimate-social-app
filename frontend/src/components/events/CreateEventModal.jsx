// frontend/src/components/events/CreateEventModal.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaImage, FaSpinner } from 'react-icons/fa';
import { useToast } from '../ui/ToastProvider';

export default function CreateEventModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', date: '', location: '', description: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = '';
      
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-md p-6 relative rounded-3xl bg-[#070B14]/95 border border-white/15 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-[#F7F7FC]">Host a Community Event</h3>
          <button onClick={onClose} className="text-[#A5A9BB] hover:text-[#F87171] transition"><FaTimes size={16} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          
          {/* Image Upload UI */}
          <div className="relative">
            <label className={`
                flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden
                ${file ? 'border-[#00F2FE] bg-black/30' : 'border-white/20 bg-[#0A111E] hover:border-white/40'}
            `}>
                {file ? (
                    <img src={URL.createObjectURL(file)} className="h-full w-full object-cover opacity-80" alt="preview" />
                ) : (
                    <div className="flex flex-col items-center text-[#A5A9BB]">
                        <FaImage size={24} className="mb-2 text-[#00F2FE]" />
                        <span className="text-xs font-semibold">Upload Event Cover</span>
                    </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </label>
            {file && (
                <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); setFile(null); }} 
                    className="absolute top-2 right-2 bg-[#052E24] text-white p-1.5 rounded-full shadow-md hover:scale-110 transition"
                >
                    <FaTimes size={10} />
                </button>
            )}
          </div>

          <input 
            placeholder="Event Title" 
            className="w-full p-3 rounded-2xl bg-[#0A111E] border border-white/10 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50 transition"
            value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
          />
          
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FaCalendarAlt className="absolute top-3.5 left-4 text-[#A5A9BB]" size={14} />
              <input 
                type="datetime-local" 
                className="w-full p-3 pl-11 rounded-2xl bg-[#0A111E] border border-white/10 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50 transition"
                value={form.date} onChange={e => setForm({...form, date: e.target.value})} required
              />
            </div>
          </div>

          <div className="relative">
            <FaMapMarkerAlt className="absolute top-3.5 left-4 text-[#A5A9BB]" size={14} />
            <input 
              placeholder="Location or Virtual Link" 
              className="w-full p-3 pl-11 rounded-2xl bg-[#0A111E] border border-white/10 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50 transition"
              value={form.location} onChange={e => setForm({...form, location: e.target.value})} required
            />
          </div>

          <textarea 
            placeholder="Event itinerary and description..." 
            className="w-full p-3 rounded-2xl bg-[#0A111E] border border-white/10 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50 transition h-24 resize-none leading-relaxed"
            value={form.description} onChange={e => setForm({...form, description: e.target.value})}
          />

          <button 
            disabled={loading} 
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(29,78,216,0.35)] hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? <><FaSpinner className="animate-spin" /> Launching...</> : 'Publish Event'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
