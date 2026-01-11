// frontend/src/pages/settings/SettingsPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateAuthUser, logout } from '../../redux/slices/authSlice';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserCog, FaLock, FaMoon, FaShieldAlt, FaToggleOn, FaToggleOff, 
  FaTrash, FaCamera 
} from 'react-icons/fa';
import UserAvatar from '../../components/ui/UserAvatar';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Spinner from '../../components/common/Spinner';

export default function SettingsPage() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { add } = useToast();

  const [activeTab, setActiveTab] = useState('account'); // account | security | appearance
  const [loading, setLoading] = useState(false);
  
  // Profile Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });

  // Password Form State
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
  
  // Security State
  const [twoFactor, setTwoFactor] = useState(user?.is2FAEnabled || false);

  // --- Handlers ---

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Assuming your backend expects PUT /users/:id for updates
      const { data } = await API.put(`/users/${user._id}`, formData);
      dispatch(updateAuthUser(data));
      add('Profile updated successfully', { type: 'success' });
    } catch (err) {
      add('Failed to update profile', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put('/auth/update-password', passData);
      add('Password changed successfully', { type: 'success' });
      setPassData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      add(err.response?.data?.message || 'Failed to change password', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggle2FA = async () => {
    // Optimistic Update
    const newVal = !twoFactor;
    setTwoFactor(newVal); 

    try {
      await API.put(`/users/${user._id}`, { is2FAEnabled: newVal });
      dispatch(updateAuthUser({ is2FAEnabled: newVal }));
      add(newVal ? "Two-Factor Auth Enabled" : "Two-Factor Auth Disabled", { type: 'info' });
    } catch(e) {
      setTwoFactor(!newVal); // Revert on error
      add("Failed to update 2FA settings", { type: 'error' });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmStr = prompt("Type 'DELETE' to confirm account deletion. This cannot be undone.");
    if (confirmStr !== 'DELETE') return;

    try {
      await API.delete(`/users/${user._id}`);
      dispatch(logout());
      window.location.href = '/login';
    } catch (e) {
      add("Failed to delete account", { type: 'error' });
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: <FaUserCog /> },
    { id: 'security', label: 'Security', icon: <FaShieldAlt /> },
    { id: 'appearance', label: 'Appearance', icon: <FaMoon /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 min-h-screen">
      
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
            <FaUserCog size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Settings</h1>
            <p className="text-gray-500">Manage your profile and preferences</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-4 mb-8 pb-2 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <AnimatePresence mode='wait'>
        
        {/* --- ACCOUNT TAB --- */}
        {activeTab === 'account' && (
          <motion.div 
            key="account"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Avatar Section */}
            <div className="neu-card flex flex-col items-center p-8 bg-white dark:bg-gray-800">
                <div className="relative group cursor-pointer">
                    <UserAvatar src={user.avatar} name={user.name} className="w-24 h-24 border-4 border-white dark:border-gray-700 shadow-xl" />
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                        <FaCamera />
                    </div>
                </div>
                <h2 className="mt-4 text-xl font-bold dark:text-white">{user.name}</h2>
                <span className="text-sm text-gray-400">@{user.username || 'user'}</span>
            </div>

            {/* Edit Profile Form */}
            <div className="neu-card p-6 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
                    Edit Profile
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                            <input 
                                className="neu-input" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                            <input 
                                className="neu-input opacity-70 cursor-not-allowed" 
                                value={formData.email} 
                                disabled
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Bio</label>
                        <textarea 
                            className="neu-input h-24 resize-none" 
                            value={formData.bio} 
                            onChange={e => setFormData({...formData, bio: e.target.value})}
                            placeholder="Tell the world about yourself..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                        <input 
                            className="neu-input" 
                            value={formData.location} 
                            onChange={e => setFormData({...formData, location: e.target.value})}
                            placeholder="City, Country"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button disabled={loading} className="btn-neon px-8 flex items-center gap-2">
                            {loading && <Spinner className="w-4 h-4" />} Save Changes
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Danger Zone */}
            <div className="neu-card p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
                <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Once you delete your account, there is no going back. All your data will be permanently removed.
                </p>
                <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                    <FaTrash /> Delete Account
                </button>
            </div>
          </motion.div>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === 'security' && (
          <motion.div 
            key="security"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
             {/* 2FA Toggle */}
             <div className="neu-card p-6 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl">
                        <FaShieldAlt size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg dark:text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Require an email OTP when logging in from new devices.</p>
                    </div>
                </div>
                <button onClick={toggle2FA} className="text-4xl transition-colors cursor-pointer">
                    {twoFactor ? (
                        <FaToggleOn className="text-green-500 drop-shadow-md" />
                    ) : (
                        <FaToggleOff className="text-gray-300 dark:text-gray-600" />
                    )}
                </button>
             </div>

             {/* Change Password */}
             <div className="neu-card p-6 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
                    <FaLock className="text-indigo-500"/> Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Current Password</label>
                        <input 
                            type="password"
                            className="neu-input" 
                            value={passData.currentPassword} 
                            onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
                        <input 
                            type="password"
                            className="neu-input" 
                            value={passData.newPassword} 
                            onChange={e => setPassData({...passData, newPassword: e.target.value})}
                        />
                    </div>
                    <button disabled={loading} className="btn-neon px-6 mt-4">
                        Update Password
                    </button>
                </form>
             </div>
          </motion.div>
        )}

        {/* --- APPEARANCE TAB --- */}
        {activeTab === 'appearance' && (
          <motion.div 
            key="appearance"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="neu-card p-8 bg-white dark:bg-gray-800 flex flex-col items-center text-center"
          >
             <div className="mb-6">
                 <h2 className="text-2xl font-black mb-2 dark:text-white">Customize Interface</h2>
                 <p className="text-gray-500">Choose a theme that fits your vibe.</p>
             </div>
             
             <div className="flex gap-8">
                 <div className="scale-150">
                    <ThemeToggle />
                 </div>
             </div>
             
             <div className="mt-8 text-sm text-gray-400">
                 Current Version: v2.5.0 (Neumorphic Build)
             </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}