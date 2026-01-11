// frontend/src/components/stories/StoryCreate.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { FaStar } from 'react-icons/fa'; // Assuming you have react-icons

export default function StoryCreate({ onCreated }) {
  const [file, setFile] = useState(null);
  const [isCloseFriends, setIsCloseFriends] = useState(false); // 🔥 NEW State
  const [busy, setBusy] = useState(false);
  const { add } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('media', file);
      // 🔥 NEW: Append privacy setting
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
    <form onSubmit={submit} className="flex flex-col gap-3 p-3 border rounded-xl bg-gray-50 dark:bg-gray-800">
      
      {/* File Input */}
      <input 
        type="file" 
        accept="image/*,video/*" 
        onChange={e=>setFile(e.target.files[0])} 
        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
      />

      <div className="flex items-center justify-between">
        {/* 🔥 NEW: Close Friends Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
                type="checkbox" 
                checked={isCloseFriends} 
                onChange={(e) => setIsCloseFriends(e.target.checked)}
                className="w-4 h-4 accent-green-500"
            />
            <div className={`flex items-center gap-1 text-sm font-semibold ${isCloseFriends ? 'text-green-600' : 'text-gray-500'}`}>
                <FaStar size={12} />
                Close Friends Only
            </div>
        </label>

        <button disabled={!file || busy} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50">
            {busy ? 'Posting...' : 'Add Story'}
        </button>
      </div>
    </form>
  );
}