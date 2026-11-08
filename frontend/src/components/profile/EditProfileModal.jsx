// frontend/src/components/profile/EditProfileModal.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { FaCamera, FaTimes, FaSpinner } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { updateAuthUser } from '../../redux/slices/authSlice';

export default function EditProfileModal({ isOpen, onClose, user }) {
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null); 
  
  const [loading, setLoading] = useState(false);
  const { add } = useToast();
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('bio', bio);
      fd.append('location', location);
      if (avatar) fd.append('avatar', avatar);
      if (cover) fd.append('coverPhoto', cover); 

      const res = await API.put(`/users/${user._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      dispatch(updateAuthUser(res.data));
      add("Profile updated", { type: 'success' });
      onClose();
      window.location.reload(); 
    } catch (err) {
      add("Update failed", { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-[32px] overflow-hidden relative bg-[#070B14] backdrop-blur-2xl border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,.85)]">
        
        {/* Cover Image Input */}
        <div className="h-40 bg-gradient-to-r from-[#052E24]/40 via-[#1D4ED8]/30 to-[#0F766E]/40 relative group">
            <img 
                src={cover ? URL.createObjectURL(cover) : (user.coverPhoto || user.coverImage || '/default-cover.jpg')} 
                className="w-full h-full object-cover opacity-75" 
                alt="cover"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <FaCamera className="text-white text-2xl" />
                <input type="file" className="hidden" onChange={e => setCover(e.target.files[0])} accept="image/*" />
            </label>
            <button onClick={onClose} className="absolute top-3 right-3 text-[#CBD5E1] bg-black/60 hover:bg-black/80 rounded-full p-2 transition"><FaTimes size={12}/></button>
        </div>

        {/* Avatar Input */}
        <div className="px-6 relative">
            <div className="-mt-14 w-28 h-28 rounded-full border-4 border-[#070B14] overflow-hidden relative group bg-[#0A111E] shadow-xl">
                <img 
                    src={avatar ? URL.createObjectURL(avatar) : user.avatar} 
                    className="w-full h-full object-cover" 
                    alt="avatar"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition">
                    <FaCamera className="text-white" />
                    <input type="file" className="hidden" onChange={e => setAvatar(e.target.files[0])} accept="image/*" />
                </label>
            </div>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] placeholder-[#CBD5E1]/40 outline-none focus:border-[#00F2FE]/50 text-sm" placeholder="Name" />
            <input value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] placeholder-[#CBD5E1]/40 outline-none focus:border-[#00F2FE]/50 text-sm" placeholder="Location" />
            <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] placeholder-[#CBD5E1]/40 outline-none focus:border-[#00F2FE]/50 text-sm h-24 resize-none" placeholder="Bio" />
            
            <button disabled={loading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white font-bold tracking-wide shadow-lg shadow-blue-900/40 hover:opacity-90 flex items-center justify-center gap-2 transition">
                {loading ? <FaSpinner className="animate-spin" /> : 'Save Profile'}
            </button>
        </form>
      </div>
    </div>
  );
}
