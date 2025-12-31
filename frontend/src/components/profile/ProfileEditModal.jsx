// frontend/src/components/profile/ProfileEditModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/authSlice';
import { FaTwitter, FaInstagram, FaLinkedin, FaTimes, FaCamera } from 'react-icons/fa';
import { compressImage } from '../../utils/compressor'; // 🔥 Fix: Import Compression

const ProfileEditModal = ({ isOpen, onClose, user, onUpdate }) => {
    const dispatch = useDispatch();
    const { add: addToast } = useToast();
    
    const [form, setForm] = useState({ 
        name: '', bio: '', website: '', 
        socialLinks: { twitter: '', instagram: '', linkedin: '' } 
    });
    
    // File States
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    
    // Preview States
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const [previewCover, setPreviewCover] = useState(null);
    
    const [deleteAvatar, setDeleteAvatar] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initialize Data
    useEffect(() => {
        if(user) {
            setForm({ 
                name: user.name || '', 
                bio: user.bio || '', 
                website: user.website || '',
                socialLinks: {
                    twitter: user.socialLinks?.twitter || '',
                    instagram: user.socialLinks?.instagram || '',
                    linkedin: user.socialLinks?.linkedin || ''
                }
            });
        }
        setAvatarFile(null);
        setCoverFile(null);
        setPreviewAvatar(null);
        setPreviewCover(null);
        setDeleteAvatar(false);
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'avatar') {
            setAvatarFile(file);
            setPreviewAvatar(URL.createObjectURL(file));
            setDeleteAvatar(false);
        } else {
            setCoverFile(file);
            setPreviewCover(URL.createObjectURL(file));
        }
    };

    const handleDeleteAvatar = (e) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        setAvatarFile(null);
        setPreviewAvatar(null); 
        setDeleteAvatar(true); 
    };

    // 🔥 Fix: Link Sanitizer
    const sanitizeLink = (url) => {
        if (!url) return '';
        const trimmed = url.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
        return `https://${trimmed}`;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return;

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('bio', form.bio);
            
            // 🔥 Fix: Apply sanitization
            fd.append('website', sanitizeLink(form.website));
            fd.append('socialLinks[twitter]', sanitizeLink(form.socialLinks.twitter));
            fd.append('socialLinks[instagram]', sanitizeLink(form.socialLinks.instagram));
            fd.append('socialLinks[linkedin]', sanitizeLink(form.socialLinks.linkedin));

            if (deleteAvatar) fd.append('deleteAvatar', 'true');

            // 🔥 Fix: Compress images
            if (avatarFile) {
                const compressed = await compressImage(avatarFile);
                fd.append('avatar', compressed);
            }
            if (coverFile) {
                const compressed = await compressImage(coverFile);
                fd.append('coverPhoto', compressed);
            }
            
            const res = await API.put(`/users/${user._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            
            addToast('Profile saved successfully!', { type: 'success' });
            
            // Update Redux
            dispatch(setUser(res.data)); 
            
            // 🔥 Fix: Update Parent State
            if (onUpdate) {
                onUpdate(res.data);
            } else {
                onClose();
            }
        } catch (err) {
            console.error('save profile err', err);
            addToast(err.userMessage || 'Failed to save profile', { type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSocialChange = (platform, value) => {
        setForm(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [platform]: value }
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4 border-b dark:border-gray-700 pb-3">
                    <h3 className="text-lg font-bold">Edit Profile</h3>
                    <button onClick={onClose} disabled={saving} className="text-gray-500 hover:text-red-500"><FaTimes /></button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500">Display Name</label>
                            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500">Website</label>
                            <input value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600" placeholder="https://" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500">Bio</label>
                        <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600" rows={3} />
                    </div>

                    {/* Social Links Section */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl space-y-3">
                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Social Links</label>
                        <div className="flex items-center gap-3">
                            <FaTwitter className="text-blue-400" />
                            <input value={form.socialLinks.twitter} onChange={e=>handleSocialChange('twitter', e.target.value)} placeholder="Twitter URL" className="flex-1 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
                        </div>
                        <div className="flex items-center gap-3">
                            <FaInstagram className="text-pink-500" />
                            <input value={form.socialLinks.instagram} onChange={e=>handleSocialChange('instagram', e.target.value)} placeholder="Instagram URL" className="flex-1 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
                        </div>
                        <div className="flex items-center gap-3">
                            <FaLinkedin className="text-blue-700" />
                            <input value={form.socialLinks.linkedin} onChange={e=>handleSocialChange('linkedin', e.target.value)} placeholder="LinkedIn URL" className="flex-1 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
                        </div>
                    </div>
                    
                    {/* Media Uploads */}
                    <div className="flex gap-4 pt-2">
                        {/* Avatar */}
                        <label className="flex-1 cursor-pointer bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center relative overflow-hidden group h-24 flex flex-col items-center justify-center">
                            <div className="font-semibold text-sm z-10 relative flex items-center gap-2"><FaCamera /> Avatar</div>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
                            
                            {(previewAvatar || (user.avatar && !deleteAvatar)) && (
                                <>
                                    <img src={previewAvatar || user.avatar} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition" alt="preview" />
                                    <div className="absolute bottom-1 text-[10px] text-green-600 font-bold bg-white/80 px-2 rounded z-20">
                                        {previewAvatar ? 'Selected' : 'Current'}
                                    </div>
                                    
                                    <button 
                                        type="button"
                                        onClick={handleDeleteAvatar}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full z-30 hover:bg-red-600 shadow-md transition-transform active:scale-95"
                                        title="Remove Photo"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                </>
                            )}
                            
                            {deleteAvatar && (
                                <div className="absolute inset-0 bg-red-100/50 flex items-center justify-center text-red-500 text-xs font-bold">
                                    Removed
                                </div>
                            )}
                        </label>

                        {/* Cover */}
                        <label className="flex-1 cursor-pointer bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center relative overflow-hidden group h-24 flex flex-col items-center justify-center">
                            <div className="font-semibold text-sm z-10 relative flex items-center gap-2"><FaCamera /> Cover</div>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'cover')} />
                            {previewCover && (
                                <>
                                    <img src={previewCover} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition" alt="preview" />
                                    <div className="absolute bottom-1 text-[10px] text-green-600 font-bold bg-white/80 px-2 rounded z-20">Selected</div>
                                </>
                            )}
                        </label>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-3 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                        <button disabled={saving} className="btn-primary px-6">{saving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ProfileEditModal;