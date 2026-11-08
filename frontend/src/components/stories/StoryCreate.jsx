// frontend/src/components/stories/StoryCreate.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { FaStar } from 'react-icons/fa';

export default function StoryCreate({ onCreated }) {
  const [file, setFile] = useState(null);
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [busy, setBusy] = useState(false);
  const { add } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('media', file);
      fd.append('privacy', isCloseFriends ? 'close_friends' : 'public');
      
      await API.post('/stories', fd, { headers: { 'Content-Type':'multipart/form-data' } });
      add('Story posted', { type:'info' });
      setFile(null);
      setIsCloseFriends(false);
      onCreated && onCreated();
    } catch (err) {
      add(err.userMessage || 'Failed', { type:'error' });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-4 border border-white/10 rounded-2xl bg-[#070B14] backdrop-blur-xl shadow-lg">
      
      {/* File Input */}
      <input 
        type="file" 
        accept="image/*,video/*" 
        onChange={e=>setFile(e.target.files[0])} 
        className="text-xs text-[#CBD5E1]/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-white/10 file:text-xs file:font-semibold file:bg-[#1D4ED8]/20 file:text-[#00F2FE] hover:file:bg-[#1D4ED8]/30 transition"
      />

      <div className="flex items-center justify-between pt-1">
        {/* Close Friends Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
                type="checkbox" 
                checked={isCloseFriends} 
                onChange={(e) => setIsCloseFriends(e.target.checked)}
                className="w-4 h-4 accent-[#14B8A6] rounded"
            />
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isCloseFriends ? 'text-[#14B8A6]' : 'text-[#CBD5E1]/70'}`}>
                <FaStar size={12} className={isCloseFriends ? 'text-[#14B8A6]' : 'text-[#CBD5E1]/40'} />
                Close Friends Only
            </div>
        </label>

        <button disabled={!file || busy} className="bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-40 transition">
            {busy ? 'Posting...' : 'Add Story'}
        </button>
      </div>
    </form>
  );
}
