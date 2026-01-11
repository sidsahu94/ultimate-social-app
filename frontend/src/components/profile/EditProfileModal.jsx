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
  const [cover, setCover] = useState(null); // 🔥 NEW
  
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
      if (cover) fd.append('coverImage', cover); // 🔥 NEW

      // Note: Ensure your backend 'upload' middleware handles fields named 'avatar' and 'coverImage'
      // OR update backend to accept 'media' generically and assign based on fieldname.
      // If using the generic 'upload' route we built earlier, you might need two separate calls or update the user controller to handle req.files map.
      // Assuming your usersController.updateProfile handles req.files:

      const res = await API.put(`/users/${user._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      dispatch(updateAuthUser(res.data));
      add("Profile updated", { type: 'success' });
      onClose();
      window.location.reload(); // Refresh to show new images
    } catch (err) {
      add("Update failed", { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* 🔥 Cover Image Input */}
        <div className="h-32 bg-gray-200 dark:bg-gray-700 relative group">
            <img 
                src={cover ? URL.createObjectURL(cover) : (user.coverImage || '/default-cover.jpg')} 
                className="w-full h-full object-cover opacity-80" 
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <FaCamera className="text-white text-2xl" />
                <input type="file" className="hidden" onChange={e => setCover(e.target.files[0])} accept="image/*" />
            </label>
            <button onClick={onClose} className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-1"><FaTimes/></button>
        </div>

        {/* Avatar Input */}
        <div className="px-6 relative">
            <div className="-mt-12 w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden relative group bg-gray-300">
                <img 
                    src={avatar ? URL.createObjectURL(avatar) : user.avatar} 
                    className="w-full h-full object-cover" 
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 cursor-pointer transition">
                    <FaCamera className="text-white" />
                    <input type="file" className="hidden" onChange={e => setAvatar(e.target.files[0])} accept="image/*" />
                </label>
            </div>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
            <input value={name} onChange={e => setName(e.target.value)} className="neu-input" placeholder="Name" />
            <input value={location} onChange={e => setLocation(e.target.value)} className="neu-input" placeholder="Location" />
            <textarea value={bio} onChange={e => setBio(e.target.value)} className="neu-input h-24 resize-none" placeholder="Bio" />
            
            <button disabled={loading} className="btn-primary w-full flex justify-center">
                {loading ? <FaSpinner className="animate-spin" /> : 'Save Profile'}
            </button>
        </form>
      </div>
    </div>
  );
}