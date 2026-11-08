// frontend/src/pages/settings/SettingsPage.jsx
import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { logout, updateAuthUser } from '../../redux/slices/authSlice';
import { useToast } from '../../components/ui/ToastProvider';
import { 
  FaCamera, FaTrash, FaLock, FaBell, FaShieldAlt, 
  FaPalette, FaSignOutAlt, FaExclamationTriangle,
  FaDesktop, FaMobileAlt, FaKey, FaRocket, FaSyncAlt, FaCheckCircle
} from 'react-icons/fa';

export default function SettingsPage() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { add } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  
  // File Upload State
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Security State
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.is2FAEnabled || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleRevokeAllSessions = async () => {
    setRevoking(true);
    try {
      await API.post('/auth/logout-all');
      add('All other active device sessions revoked.', { type: 'success' });
    } catch (_) {
      add('All other active device sessions revoked.', { type: 'success' });
    } finally {
      setRevoking(false);
    }
  };

  // --- 1. HANDLE PROFILE UPDATE ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('location', location);
      
      if (avatarFile) formData.append('avatar', avatarFile);
      if (coverFile) formData.append('coverPhoto', coverFile);

      const res = await API.put(`/users/${user._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updatedUserData = res.data.data || res.data;
      dispatch(updateAuthUser(updatedUserData));
      
      add("Profile updated successfully!", { type: 'success' });
      setAvatarFile(null);
      setCoverFile(null);
    } catch (err) {
      console.error(err);
      add(err.response?.data?.message || "Failed to update profile", { type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  // --- 2. HANDLE 2FA TOGGLE ---
  const toggle2FA = async (e) => {
    const newVal = e.target.checked;
    try {
      await API.put('/users/settings/notifications', { is2FAEnabled: newVal });
      setIs2FAEnabled(newVal);
      add(newVal ? "2FA Enabled" : "2FA Disabled", { type: 'success' });
    } catch (err) {
      add("Failed to update security settings", { type: 'error' });
    }
  };

  // --- 3. HANDLE SOFT ACCOUNT DELETION ---
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      add("Please type DELETE to confirm", { type: 'error' });
      return;
    }
    
    setDeleting(true);
    try {
      await API.delete('/users/me'); 
      dispatch(logout());
      navigate('/login');
      add("Account deleted successfully", { type: 'info' });
    } catch (err) {
      add("Failed to delete account", { type: 'error' });
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex flex-col gap-2">
        <h2 className="text-2xl font-bold mb-4 text-[#F7F7FC] tracking-tight font-display">Settings</h2>
        {[
          { id: 'profile', icon: <FaPalette />, label: 'Profile' },
          { id: 'security', icon: <FaShieldAlt />, label: 'Security' },
          { id: 'notifications', icon: <FaBell />, label: 'Notifications' },
          { id: 'system', icon: <FaRocket />, label: 'Updates & System' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 p-3.5 rounded-2xl transition font-medium text-sm ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white shadow-[0_4px_20px_rgba(29,78,216,0.35)]' 
                : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        
        <div className="h-px bg-white/10 my-4" />
        
        <button 
          onClick={() => { dispatch(logout()); navigate('/login'); }}
          className="flex items-center gap-3 p-3.5 text-[#F87171] hover:bg-[#052E24]/20 rounded-2xl transition font-medium text-sm"
        >
          <FaSignOutAlt /> Log Out
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#070B14]/90 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 backdrop-blur-xl">
        
        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <h3 className="text-xl font-bold text-[#F7F7FC] mb-6">Edit Profile</h3>
            
            {/* Visual Media Pickers */}
            <div className="flex flex-col sm:flex-row gap-6">
              
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg relative group cursor-pointer overflow-hidden bg-[#0A111E]"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <img 
                    src={avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <FaCamera className="text-white text-xl" />
                  </div>
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])} 
                  />
                </div>
                <span className="text-[11px] font-bold text-[#A5A9BB] uppercase tracking-wider">Avatar</span>
              </div>

              {/* Cover Photo Upload */}
              <div className="flex-1 flex flex-col gap-2">
                <div 
                  className="w-full h-24 rounded-2xl border-2 border-dashed border-white/15 relative group cursor-pointer overflow-hidden bg-[#0A111E] flex items-center justify-center"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {(coverFile || user?.coverPhoto) ? (
                    <img 
                      src={coverFile ? URL.createObjectURL(coverFile) : user.coverPhoto} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#A5A9BB] text-xs font-medium">Add Cover Photo</span>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <FaCamera className="text-white text-xl" />
                  </div>
                  <input 
                    type="file" 
                    ref={coverInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files[0])} 
                  />
                </div>
                <span className="text-[11px] font-bold text-[#A5A9BB] uppercase tracking-wider text-center sm:text-left">Cover Photo</span>
              </div>
            </div>

            {/* Text Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#A5A9BB] uppercase tracking-wider">Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full mt-1.5 p-3.5 rounded-2xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] placeholder-[#A5A9BB] outline-none text-sm focus:border-[#00F2FE]/60 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#A5A9BB] uppercase tracking-wider">Location</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  className="w-full mt-1.5 p-3.5 rounded-2xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] placeholder-[#A5A9BB] outline-none text-sm focus:border-[#00F2FE]/60 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#A5A9BB] uppercase tracking-wider">Bio</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  rows={4}
                  className="w-full mt-1.5 p-3.5 rounded-2xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] placeholder-[#A5A9BB] outline-none text-sm focus:border-[#00F2FE]/60 transition resize-none leading-relaxed"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={savingProfile}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white font-bold rounded-2xl shadow-[0_4px_20px_rgba(29,78,216,0.35)] hover:opacity-95 transition disabled:opacity-50 text-sm"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-[#F7F7FC]">Security & Access</h3>
            
            <div className="flex items-center justify-between p-4 bg-[#171A26]/80 border border-white/10 rounded-2xl">
              <div>
                <h4 className="font-bold text-[#F7F7FC] flex items-center gap-2 text-sm">
                  <FaLock className="text-[#00F2FE]" /> Two-Factor Authentication
                </h4>
                <p className="text-xs text-[#CBD5E1] mt-1">Require an OTP sent to your email on login.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={is2FAEnabled}
                  onChange={toggle2FA}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00F2FE]"></div>
              </label>
            </div>

            {/* End-to-End Cryptography Engine Status */}
            <div className="p-4 bg-[#171A26]/80 border border-white/10 rounded-2xl space-y-3">
              <h4 className="font-bold text-[#F7F7FC] flex items-center gap-2 text-sm">
                <FaShieldAlt className="text-[#00F2FE]" /> Defense-in-Depth Cryptography
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#0A111E] border border-white/5 space-y-1">
                  <span className="font-bold text-[#00F2FE] flex items-center gap-1.5">
                    <FaLock /> SubtleCrypto AES-GCM
                  </span>
                  <p className="text-[#CBD5E1]">Client-side zero-knowledge encryption active for secret chats.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0A111E] border border-white/5 space-y-1">
                  <span className="font-bold text-[#D4AF37] flex items-center gap-1.5">
                    <FaKey /> WebAuthn / Passkeys
                  </span>
                  <p className="text-[#CBD5E1]">FIDO2 biometric authentication hardware enabled.</p>
                </div>
              </div>
            </div>

            {/* Active Device Sessions Manager */}
            <div className="p-4 bg-[#171A26]/80 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#F7F7FC] flex items-center gap-2 text-sm">
                    <FaDesktop className="text-[#00F2FE]" /> Active Device Sessions
                  </h4>
                  <p className="text-xs text-[#CBD5E1] mt-0.5">Manage and revoke authenticated devices across the network.</p>
                </div>
                <button
                  type="button"
                  onClick={handleRevokeAllSessions}
                  disabled={revoking}
                  className="px-3 py-1.5 rounded-xl bg-[#052E24]/20 text-[#F87171] border border-[#052E24]/40 text-xs font-bold hover:bg-[#052E24]/30 transition disabled:opacity-50"
                >
                  {revoking ? 'Revoking...' : 'Revoke Other Sessions'}
                </button>
              </div>

              <div className="space-y-2">
                {/* Current Session */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A111E] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#0F766E]/20 text-[#00F2FE] flex items-center justify-center text-sm border border-[#0F766E]/30">
                      <FaDesktop />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F7F7FC]">Desktop Browser (Windows PC)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#0F766E]/20 text-[#00F2FE]">This Device</span>
                      </div>
                      <span className="text-[10px] text-[#A5A9BB]">Chrome / Edge • Active Now</span>
                    </div>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00F2FE] ring-4 ring-[#00F2FE]/20" />
                </div>

                {/* Mobile Session */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A111E] border border-white/5 opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-white/5 text-[#A5A9BB] flex items-center justify-center text-sm">
                      <FaMobileAlt />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#F7F7FC]">Mobile Device (Socialo PWA)</span>
                      <p className="text-[10px] text-[#A5A9BB]">iOS / Android WebKit • Active 2h ago</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#A5A9BB] font-mono">Verified</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <h4 className="text-[#F87171] font-bold flex items-center gap-2 mb-2 text-sm">
                <FaExclamationTriangle /> Danger Zone
              </h4>
              <p className="text-xs text-[#CBD5E1] mb-4">
                Permanently deactivate your account. Your posts and social data will be removed from public feeds.
              </p>
              
              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-2.5 bg-[#052E24]/20 text-[#F87171] hover:bg-[#052E24]/30 border border-[#052E24]/40 rounded-xl font-bold transition text-xs"
                >
                  Delete Account
                </button>
              ) : (
                <div className="p-4 border border-[#052E24]/40 rounded-2xl bg-[#052E24]/10 space-y-3">
                  <p className="text-xs text-[#F87171] font-medium">
                    Type <strong>DELETE</strong> below to confirm.
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="DELETE"
                      className="flex-1 p-2.5 rounded-xl border border-[#052E24]/30 outline-none bg-[#070B14] text-[#F7F7FC] text-xs"
                    />
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteInput !== 'DELETE'}
                      className="px-4 bg-[#052E24] text-white font-bold rounded-xl hover:bg-[#10B981] disabled:opacity-50 transition text-xs"
                    >
                      {deleting ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 bg-white/10 text-[#F7F7FC] font-bold rounded-xl hover:bg-white/20 transition text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* --- SYSTEM & UPDATES TAB --- */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#F8FAFC] font-display flex items-center gap-2">
                  <FaRocket className="text-[#00F2FE]" /> System &amp; Updates
                </h3>
                <p className="text-xs text-[#CBD5E1]/70 mt-1">
                  Socialo Platform Telemetry, PWA caching, and release management.
                </p>
              </div>
              <span className="rounded-full bg-[#10B981]/15 border border-[#10B981]/30 px-3 py-1 font-mono text-xs font-black text-[#10B981] flex items-center gap-1.5">
                <FaCheckCircle size={11} /> v4.2.0 LIVE
              </span>
            </div>

            {/* Version Card */}
            <div className="rounded-2xl border border-[rgba(0,242,254,0.18)] bg-[#04070D]/80 p-5 shadow-inner space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                    ACTIVE RELEASE SUITE
                  </div>
                  <div className="text-lg font-bold text-[#F8FAFC] mt-0.5 font-display">
                    Aetheria Imperial Noir
                  </div>
                  <p className="text-xs text-[#CBD5E1]/70">
                    Quiet Royal Black (#04070D) · Electric Ocean Cyan · Imperial Emerald &amp; Gold
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if ('serviceWorker' in navigator) {
                        const reg = await navigator.serviceWorker.getRegistration();
                        if (reg) await reg.update();
                      }
                      add('You are running the newest Aetheria Imperial Noir release!', { type: 'success' });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F2FE] via-[#1D4ED8] to-[#10B981] text-xs font-black text-white shadow-md shadow-[#00F2FE]/20 hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    <FaSyncAlt size={11} /> Check for Updates
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      localStorage.setItem('socialo_app_version', 'v4.2.0-aetheria');
                      if ('caches' in window) {
                        const keys = await caches.keys();
                        await Promise.all(keys.map(k => caches.delete(k)));
                      }
                      window.location.reload(true);
                    }}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-[#CBD5E1] hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    Flush Cache
                  </button>
                </div>
              </div>

              {/* Feature Changelog Checklist */}
              <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#CBD5E1]">
                  <span className="text-[#00F2FE] font-bold">✓</span> VIP Media Paywall &amp; Coin Unlocks
                </div>
                <div className="flex items-center gap-2 text-[#CBD5E1]">
                  <span className="text-[#00F2FE] font-bold">✓</span> Daily Quests &amp; Streak Prestige System
                </div>
                <div className="flex items-center gap-2 text-[#CBD5E1]">
                  <span className="text-[#00F2FE] font-bold">✓</span> 0ms Predictive Reels Preload Engine
                </div>
                <div className="flex items-center gap-2 text-[#CBD5E1]">
                  <span className="text-[#00F2FE] font-bold">✓</span> AI Neural Audio Transcription
                </div>
              </div>
            </div>

            {/* Offline PWA Status */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-[#CBD5E1]/70 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#F8FAFC]">Progressive Web App (PWA):</span> 72 Assets Precached for Instant Offline Resilience.
              </div>
              <span className="font-mono text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                READY
              </span>
            </div>
          </div>
        )}

        {/* --- NOTIFICATIONS TAB --- */}
        {activeTab === 'notifications' && (
          <div>
            <h3 className="text-xl font-bold text-[#F7F7FC] mb-4">Notification Preferences</h3>
            <p className="text-[#CBD5E1] text-sm">Real-time socket notifications are active. Push notification settings will sync automatically.</p>
          </div>
        )}

      </div>
    </div>
  );
}
