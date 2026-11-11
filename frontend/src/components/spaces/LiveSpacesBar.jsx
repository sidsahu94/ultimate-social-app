// frontend/src/components/spaces/LiveSpacesBar.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from '../ui/UserAvatar';
import AudioSpaceModal from './AudioSpaceModal';
import { useToast } from '../ui/ToastProvider';
import { FaBroadcastTower, FaPlus, FaHeadphones, FaTimes } from 'react-icons/fa';

export default function LiveSpacesBar() {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const { add: addToast } = useToast();

  const fetchSpaces = async () => {
    try {
      const res = await API.get('/spaces');
      if (res.data?.data) {
        setSpaces(res.data.data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchSpaces();
    const interval = setInterval(fetchSpaces, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addToast('Please enter a space title', { type: 'error' });
      return;
    }
    setCreating(true);
    try {
      const res = await API.post('/spaces', {
        title: newTitle.trim(),
        topic: newTopic.trim() || 'Creator Talk',
      });
      const created = res.data?.data;
      if (created) {
        setSpaces((prev) => [created, ...prev]);
        setSelectedSpace(created);
        setShowCreateModal(false);
        setNewTitle('');
        setNewTopic('');
        addToast('🎙️ Live Space started!', { type: 'success' });
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to start space', { type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mb-6">
      {/* Spaces Horizontal Row */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
        {/* Create Space Action Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-[18px] bg-gradient-to-r from-[#1D4ED8]/25 via-[#052E24]/20 to-[#00F2FE]/20 border border-[rgba(226,232,240,0.22)] text-[#F8FAFC] hover:border-[#00F2FE] shadow-silverGlass transition-all whitespace-nowrap text-xs font-bold shrink-0 group hover:shadow-[0_0_20px_rgba(100,223,223,0.3)]"
        >
          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#1D4ED8] to-[#00F2FE] text-[#04070D] flex items-center justify-center text-xs group-hover:scale-110 transition shadow-[0_0_12px_rgba(100,223,223,0.6)]">
            <FaPlus size={10} className="text-white" />
          </div>
          <span className="tracking-wide">Start Audio Space</span>
        </button>

        {/* Active Spaces List */}
        {spaces.map((sp) => (
          <motion.button
            key={sp._id}
            onClick={() => setSelectedSpace(sp)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-3.5 py-2 rounded-[20px] bg-[#070B14]/85 backdrop-blur-xl border border-[rgba(226,232,240,0.14)] hover:border-[#00F2FE]/70 shadow-silverGlass transition-all shrink-0 max-w-xs text-left group"
          >
            {/* Host Avatar with animated kinetic story ring */}
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full p-[2px] bg-gradient-to-tr from-[#1D4ED8] via-[#052E24] to-[#D4AF37] animate-pulse">
                <UserAvatar user={sp.host} size="w-full h-full" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#052E24] text-[8px] text-white shadow-[0_0_8px_rgba(139,0,24,0.6)]">
                <FaBroadcastTower />
              </span>
            </div>

            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#10B981] uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-ping" />
                  Live
                </span>
                <span className="text-[10px] text-[#CBD5E1]/70 truncate">• {sp.topic}</span>
              </div>
              <p className="text-xs font-bold text-[#F8FAFC] truncate max-w-[130px] group-hover:text-[#00F2FE] transition-colors">
                {sp.title}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-[#CBD5E1]/60">
                <FaHeadphones size={9} className="text-[#0F766E]" />
                <span>{(sp.listeners?.length || 0) + (sp.speakers?.length || 1)} listening</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Create Space Dialog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-[24px] bg-[#070B14] border border-[rgba(226,232,240,0.18)] p-6 text-[#F8FAFC] shadow-2xl relative overflow-hidden"
          >
            {/* Ambient specular highlight */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#1D4ED8]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[#052E24]/25 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-[rgba(226,232,240,0.1)]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#1D4ED8] to-[#00F2FE] text-white flex items-center justify-center shadow-[0_0_12px_rgba(100,223,223,0.5)]">
                  <FaBroadcastTower />
                </div>
                <h3 className="font-display text-lg font-bold text-[#F8FAFC]">Start a SocialVerse Space</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#CBD5E1]/60 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="relative z-10 mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                  Space Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Late Night Tech & Creators Talk"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-[14px] bg-[#04070D] border border-[rgba(226,232,240,0.15)] px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#CBD5E1]/40 focus:outline-none focus:ring-2 focus:ring-[#00F2FE] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                  Topic / Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI & Future, Music, Design"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full rounded-[14px] bg-[#04070D] border border-[rgba(226,232,240,0.15)] px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#CBD5E1]/40 focus:outline-none focus:ring-2 focus:ring-[#00F2FE] transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-[14px] bg-white/[0.07] hover:bg-white/[0.12] text-xs font-semibold text-[#CBD5E1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-[14px] bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#00F2FE] text-white text-xs font-bold hover:opacity-95 transition shadow-lg shadow-[#1D4ED8]/40 disabled:opacity-60"
                >
                  {creating ? 'Launching Space...' : 'Go Live Now'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Active Space Audio Room Modal */}
      {selectedSpace && (
        <AudioSpaceModal
          space={selectedSpace}
          isOpen={!!selectedSpace}
          onClose={() => setSelectedSpace(null)}
          onSpaceEnded={fetchSpaces}
        />
      )}
    </div>
  );
}
