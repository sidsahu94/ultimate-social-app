// frontend/src/components/profile/CreateHighlightModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCamera, FaMagic } from 'react-icons/fa';
import { useToast } from '../ui/ToastProvider';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
];

const PRESET_RINGS = [
  'from-[#FF6B8A] via-[#9B6DFF] to-[#00F2FE]',
  'from-[#00F2FE] via-[#1D4ED8] to-[#10B981]',
  'from-[#F59E0B] via-[#EF4444] to-[#D4AF37]',
  'from-[#10B981] via-[#052E24] to-[#D4AF37]',
  'from-[#8B5CF6] via-[#EC4899] to-[#FF6B8A]',
];

export default function CreateHighlightModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0]);
  const [selectedRing, setSelectedRing] = useState(PRESET_RINGS[0]);
  const { add: addToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Please enter a highlight title', { type: 'error' });
      return;
    }

    const newHighlight = {
      id: `hl_${Date.now()}`,
      title: title.trim(),
      type: 'image',
      img: selectedCover,
      ring: selectedRing,
      stories: [
        {
          url: selectedCover,
          caption: `${title.trim()} • Curated Highlight Story`,
          timestamp: 'Just now',
        },
      ],
    };

    if (onCreated) onCreated(newHighlight);
    addToast(`Highlight "${title}" added to profile!`, { type: 'success' });
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="relative w-full max-w-md rounded-[28px] border border-white/15 bg-[#070B14] p-6 text-[#F8FAFC] shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2">
            <FaMagic className="text-[#00F2FE] text-base" />
            <h3 className="font-display font-bold text-lg">New Story Highlight</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white transition cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Highlight Title */}
          <div>
            <label className="block text-[11px] font-bold text-[#CBD5E1]/70 uppercase tracking-wider mb-1.5">
              Highlight Name
            </label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="e.g. Keynotes, Tokyo, Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#04070D] px-3.5 py-2.5 text-xs text-white placeholder-[#CBD5E1]/40 focus:border-[#00F2FE] focus:outline-none"
            />
          </div>

          {/* Select Cover */}
          <div>
            <label className="block text-[11px] font-bold text-[#CBD5E1]/70 uppercase tracking-wider mb-2">
              Select Cover Artwork
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COVERS.map((cover, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCover(cover)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    selectedCover === cover ? 'border-[#00F2FE] scale-105 shadow-md' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={cover} alt="preset cover" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Select Spectrum Ring */}
          <div>
            <label className="block text-[11px] font-bold text-[#CBD5E1]/70 uppercase tracking-wider mb-2">
              Spectrum Ring Style
            </label>
            <div className="flex items-center gap-3">
              {PRESET_RINGS.map((ring, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedRing(ring)}
                  className={`w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr ${ring} transition cursor-pointer ${
                    selectedRing === ring ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-[#070B14]" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/5 py-2.5 text-xs font-bold text-[#CBD5E1] hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#00F2FE] py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-95 transition cursor-pointer"
            >
              Add to Profile
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
