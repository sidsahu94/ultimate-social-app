// frontend/src/components/profile/ProfileEditModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/authSlice';
// ✅ FIX: Added FaTimes to the import
import { FaTwitter, FaInstagram, FaLinkedin, FaTimes } from 'react-icons/fa';

const ProfileEditModal = ({ isOpen, onClose, user }) => {
    const dispatch = useDispatch();
    const { add: addToast } = useToast();
    
    const [form, setForm] = useState({ 
        name: '', bio: '', website: '', 
        socialLinks: { twitter: '', instagram: '', linkedin: '' } 
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [saving, setSaving] = useState(false);

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
    }, [user, isOpen]);

    if (!isOpen) return null;

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return;

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('bio', form.bio);
            fd.append('website', form.website);
            
            // Append social links
            fd.append('socialLinks[twitter]', form.socialLinks.twitter);
            fd.append('socialLinks[instagram]', form.socialLinks.instagram);
            fd.append('socialLinks[linkedin]', form.socialLinks.linkedin);

            if (avatarFile) fd.append('avatar', avatarFile);
            if (coverFile) fd.append('coverPhoto', coverFile);
            
            const res = await API.put(`/users/${user._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            
            addToast('Profile saved successfully!', { type: 'success' });
            dispatch(setUser(res.data));
            onClose();
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
                        <label className="flex-1 cursor-pointer bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center text-sm">
                            <div className="font-semibold">Change Avatar</div>
                            <input type="file" accept="image/*" className="hidden" onChange={e=>setAvatarFile(e.target.files?.[0])} />
                            {avatarFile && <span className="text-green-500 text-xs">{avatarFile.name}</span>}
                        </label>
                        <label className="flex-1 cursor-pointer bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center text-sm">
                            <div className="font-semibold">Change Cover</div>
                            <input type="file" accept="image/*" className="hidden" onChange={e=>setCoverFile(e.target.files?.[0])} />
                            {coverFile && <span className="text-green-500 text-xs">{coverFile.name}</span>}
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