// frontend/src/components/profile/ProfileEditModal.jsx
import React, { useState, useRef } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';

const ProfileEditModal = ({ isOpen, onClose, user }) => {
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', website: user?.website || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm({ name: user?.name || '', bio: user?.bio || '', website: user?.website || '' });
  }, [user]);

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('bio', form.bio);
      fd.append('website', form.website);
      if (avatarFile) fd.append('avatar', avatarFile);
      if (coverFile) fd.append('coverPhoto', coverFile);
      await API.put(`/users/${user._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onClose();
    } catch (err) {
      console.error('save profile err', err);
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl p-6 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit profile</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Full name</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full p-2 border rounded" />
          </div>

          <div>
            <label className="block text-sm mb-1">Bio</label>
            <textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} className="w-full p-2 border rounded" rows={2} />
          </div>

          <div>
            <label className="block text-sm mb-1">Website</label>
            <input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} className="w-full p-2 border rounded" />
          </div>

          <div className="flex gap-3">
            <label className="flex-1">
              <div className="text-sm mb-1">Avatar</div>
              <input type="file" accept="image/*" onChange={e=>setAvatarFile(e.target.files[0])} />
            </label>
            <label className="flex-1">
              <div className="text-sm mb-1">Cover photo</div>
              <input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files[0])} />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileEditModal;
