// frontend/src/components/profile/ProfileEditModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/authSlice';
import { FaTwitter, FaInstagram, FaLinkedin, FaTimes, FaCamera } from 'react-icons/fa';
import { compressImage } from '../../utils/compressor';

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
        setDeleteAvatar(false);
    }, [user, isOpen]);

    useEffect(() => {
        if (!avatarFile) {
            setPreviewAvatar(null);
            return;
        }
        const objectUrl = URL.createObjectURL(avatarFile);
        setPreviewAvatar(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [avatarFile]);

    useEffect(() => {
        if (!coverFile) {
            setPreviewCover(null);
            return;
        }
        const objectUrl = URL.createObjectURL(coverFile);
        setPreviewCover(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [coverFile]);

    if (!isOpen) return null;

    const handleFileChange = (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'avatar') {
            setAvatarFile(file);
            setDeleteAvatar(false);
        } else {
            setCoverFile(file);
        }
    };

    const handleDeleteAvatar = (e) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        setAvatarFile(null);
        setDeleteAvatar(true); 
    };

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
            
            fd.append('website', sanitizeLink(form.website));
            fd.append('socialLinks[twitter]', sanitizeLink(form.socialLinks.twitter));
            fd.append('socialLinks[instagram]', sanitizeLink(form.socialLinks.instagram));
            fd.append('socialLinks[linkedin]', sanitizeLink(form.socialLinks.linkedin));

            if (deleteAvatar) fd.append('deleteAvatar', 'true');

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
            
            dispatch(setUser(res.data)); 
            
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-2xl bg-[#070B14] rounded-3xl p-6 shadow-[0_25px_80px_rgba(0,0,0,0.85)] border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-[#F7F7FC] font-serif">Edit Profile</h3>
                    <button onClick={onClose} disabled={saving} className="text-[#CBD5E1]/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition"><FaTimes /></button>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {/* Basic Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1]/70 mb-1.5 block">Display Name</label>
                            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] outline-none focus:border-[#00F2FE]/50 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1]/70 mb-1.5 block">Website</label>
                            <input value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] outline-none focus:border-[#00F2FE]/50 text-sm" placeholder="https://" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1]/70 mb-1.5 block">Bio</label>
                        <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] outline-none focus:border-[#00F2FE]/50 text-sm resize-none" rows={3} />
                    </div>

                    {/* Social Links Section */}
                    <div className="bg-[#0A111E]/80 border border-white/5 p-4 rounded-2xl space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2 block">Social Channels</label>
                        <div className="flex items-center gap-3">
                            <FaTwitter className="text-[#55E6FF]" />
                            <input value={form.socialLinks.twitter} onChange={e=>handleSocialChange('twitter', e.target.value)} placeholder="Twitter URL" className="flex-1 px-3 py-2 rounded-xl bg-[#070B14] border border-white/10 text-[#F7F7FC] text-sm outline-none focus:border-[#00F2FE]/40" />
                        </div>
                        <div className="flex items-center gap-3">
                            <FaInstagram className="text-[#FF6B8A]" />
                            <input value={form.socialLinks.instagram} onChange={e=>handleSocialChange('instagram', e.target.value)} placeholder="Instagram URL" className="flex-1 px-3 py-2 rounded-xl bg-[#070B14] border border-white/10 text-[#F7F7FC] text-sm outline-none focus:border-[#00F2FE]/40" />
                        </div>
                        <div className="flex items-center gap-3">
                            <FaLinkedin className="text-[#1D4ED8]" />
                            <input value={form.socialLinks.linkedin} onChange={e=>handleSocialChange('linkedin', e.target.value)} placeholder="LinkedIn URL" className="flex-1 px-3 py-2 rounded-xl bg-[#070B14] border border-white/10 text-[#F7F7FC] text-sm outline-none focus:border-[#00F2FE]/40" />
                        </div>
                    </div>
                    
                    {/* Media Uploads */}
                    <div className="flex gap-4 pt-2">
                        {/* Avatar */}
                        <label className="flex-1 cursor-pointer bg-[#0A111E] border border-white/10 p-3 rounded-2xl text-center relative overflow-hidden group h-28 flex flex-col items-center justify-center hover:border-white/20 transition">
                            <div className="font-semibold text-sm z-10 relative flex items-center gap-2 text-[#CBD5E1]"><FaCamera /> Avatar</div>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
                            
                            {(previewAvatar || (user?.avatar && !deleteAvatar)) && (
                                <>
                                    <img src={previewAvatar || user.avatar} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition" alt="preview" />
                                    <div className="absolute bottom-1.5 text-[10px] text-[#00F2FE] font-bold bg-[#04070D]/80 border border-white/10 px-2 py-0.5 rounded-full z-20">
                                        {previewAvatar ? 'Selected' : 'Current'}
                                    </div>
                                    
                                    <button 
                                        type="button"
                                        onClick={handleDeleteAvatar}
                                        className="absolute top-2 right-2 bg-[#052E24] text-white p-1.5 rounded-full z-30 hover:bg-[#10B981] shadow-md transition-transform active:scale-95"
                                        title="Remove Photo"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                </>
                            )}
                            
                            {deleteAvatar && (
                                <div className="absolute inset-0 bg-[#052E24]/30 flex items-center justify-center text-[#FF6B8A] text-xs font-bold">
                                    Removed
                                </div>
                            )}
                        </label>

                        {/* Cover */}
                        <label className="flex-1 cursor-pointer bg-[#0A111E] border border-white/10 p-3 rounded-2xl text-center relative overflow-hidden group h-28 flex flex-col items-center justify-center hover:border-white/20 transition">
                            <div className="font-semibold text-sm z-10 relative flex items-center gap-2 text-[#CBD5E1]"><FaCamera /> Cover</div>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'cover')} />
                            {previewCover && (
                                <>
                                    <img src={previewCover} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition" alt="preview" />
                                    <div className="absolute bottom-1.5 text-[10px] text-[#00F2FE] font-bold bg-[#04070D]/80 border border-white/10 px-2 py-0.5 rounded-full z-20">Selected</div>
                                </>
                            )}
                        </label>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-2xl border border-white/10 text-[#CBD5E1] hover:bg-white/5 transition">Cancel</button>
                        <button disabled={saving} className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white font-bold hover:opacity-90 shadow-lg shadow-blue-900/30 transition">{saving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ProfileEditModal;
