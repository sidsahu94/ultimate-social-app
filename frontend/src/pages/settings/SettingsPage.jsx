import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { FaLock, FaUserShield, FaTrash, FaMoon, FaUserFriends, FaSearch, FaCheck, FaBolt, FaGoogle } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeProvider';

export default function SettingsPage() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const { add } = useToast();
  const { toggle: toggleTheme } = useTheme();

  const [pass, setPass] = useState({ current: '', new: '' });
  const [privacy, setPrivacy] = useState(user?.privateProfile || false);

  // Close Friends State
  const [showCF, setShowCF] = useState(false);
  const [cfList, setCfList] = useState([]); 
  const [cfQuery, setCfQuery] = useState('');
  const [cfResults, setCfResults] = useState([]);

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // Load settings data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await API.get('/users/me');
        if (!mounted) return;
        const existing = r?.data || {};
        setCfList(Array.isArray(existing.closeFriends) ? existing.closeFriends : []);
        setPrivacy(existing.privateProfile);
      } catch (e) {
        console.warn('Failed to load user settings', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Toggle close friend inclusion
  const toggleCF = async (targetUser) => {
    try {
      const isAdded = Boolean(cfList.find(u => u._id === targetUser._id));
      let newList;
      if (isAdded) {
        newList = cfList.filter(u => u._id !== targetUser._id);
      } else {
        newList = [...cfList, targetUser];
      }
      setCfList(newList);

      await API.put('/users/close-friends', { userIds: newList.map(u => u._id) });
      add(isAdded ? 'Removed from Close Friends' : 'Added to Close Friends', { type: 'info' });
    } catch (err) {
      add(err?.userMessage || 'Failed to update Close Friends', { type: 'error' });
    }
  };

  const searchCF = async (q) => {
    setCfQuery(q);
    if (!q || q.length <= 2) {
      setCfResults([]);
      return;
    }
    try {
      const r = await API.get(`/users/search?q=${encodeURIComponent(q)}`);
      setCfResults(r.data.users || []);
    } catch (e) {}
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/password', pass);
      add("Password updated!", { type: 'success' });
      setPass({ current: '', new: '' });
    } catch (e) {
      add(e.userMessage || "Failed", { type: 'error' });
    }
  };

  const handlePrivacy = async () => {
    try {
      const newVal = !privacy;
      setPrivacy(newVal);
      const fd = new FormData();
      fd.append('isPrivate', newVal);
      await API.put(`/users/${user._id}`, fd);
      add(`Profile is now ${newVal ? 'Private' : 'Public'}`, { type: 'info' });
    } catch (e) { 
        setPrivacy(!privacy); // revert
        add("Failed to change privacy", { type: 'error' }); 
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure? This cannot be undone.")) return;
    try {
      await API.delete('/users/me');
      dispatch(logout()); 
      window.location.href = '/login';
    } catch (e) {
      add("Failed to delete account", { type: 'error' });
    }
  };

  // 🔥 CHECK: Google users usually have a googleId but no password set initially
  // Ideally, the backend 'me' endpoint should return a flag like `hasPassword: true/false`
  // For now, if they have a googleId, we assume they might not have a password unless set.
  const isGoogleUser = !!user?.googleId; 

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* PWA Install Banner */}
      {installPrompt && (
          <div className="card p-5 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-white/20 rounded-lg"><FaBolt /></div>
               <div>
                 <div className="font-bold">Install App</div>
                 <div className="text-xs opacity-90">Add to Home Screen</div>
               </div>
            </div>
            <button onClick={handleInstall} className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-100 transition">
               Install
            </button>
          </div>
      )}

      {/* Appearance */}
      <div className="card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg"><FaMoon className="text-indigo-600 dark:text-indigo-300" /></div>
          <div>
            <div className="font-semibold">Dark Mode</div>
            <div className="text-xs text-gray-500">Toggle theme</div>
          </div>
        </div>
        <button onClick={toggleTheme} className="btn-primary py-1 px-3 text-sm">Toggle</button>
      </div>

      {/* Privacy */}
      <div className="card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg"><FaUserShield className="text-green-600 dark:text-green-300" /></div>
          <div>
            <div className="font-semibold">Private Account</div>
            <div className="text-xs text-gray-500">Only followers can see your posts</div>
          </div>
        </div>
        <div onClick={handlePrivacy} className={`w-12 h-6 rounded-full cursor-pointer transition-colors p-1 ${privacy ? 'bg-green-500' : 'bg-gray-300'}`}>
          <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${privacy ? 'translate-x-6' : ''}`} />
        </div>
      </div>

      {/* Close Friends */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><FaUserFriends /></div>
            <div>
              <div className="font-bold">Close Friends</div>
              <div className="text-xs text-gray-500">{cfList.length} people selected</div>
            </div>
          </div>
          <button onClick={() => setShowCF(!showCF)} className="btn-primary py-1 px-3 text-sm">Manage</button>
        </div>

        {showCF && (
          <div className="mt-4 border-t pt-4 animate-fade-in">
            <div className="relative mb-3">
              <input
                className="w-full p-2 border rounded pr-10 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Search to add..."
                value={cfQuery}
                onChange={e => searchCF(e.target.value)}
              />
              <div className="absolute right-2 top-2 text-gray-400"><FaSearch /></div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
              {(cfQuery && cfQuery.length > 2 ? cfResults : cfList).map(u => (
                <div
                  key={u._id}
                  onClick={() => toggleCF(u)}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded"
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatar || '/default-avatar.png'} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-sm">{u.name}</span>
                  </div>
                  {cfList.find(s => s._id === u._id) ? <FaCheck className="text-green-500" /> : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Password Change - Hidden for Google Users without password capability */}
      {!isGoogleUser ? (
        <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
            <FaLock className="text-gray-400" /> <span className="font-semibold">Change Password</span>
            </div>
            <form onSubmit={handlePassword} className="space-y-3">
            <input
                type="password"
                placeholder="Current Password"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={pass.current}
                onChange={e => setPass({ ...pass, current: e.target.value })}
            />
            <input
                type="password"
                placeholder="New Password"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={pass.new}
                onChange={e => setPass({ ...pass, new: e.target.value })}
            />
            <button disabled={!pass.current || !pass.new} className="w-full bg-black dark:bg-white dark:text-black text-white py-2 rounded font-medium disabled:opacity-50">Update</button>
            </form>
        </div>
      ) : (
        <div className="card p-5 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900">
            <FaGoogle className="text-blue-500" />
            <div className="text-sm text-gray-600 dark:text-gray-300">
                You are logged in via Google. Manage your security settings through your Google Account.
            </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="p-5 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
        <h3 className="text-red-600 font-bold mb-2 flex items-center gap-2"><FaTrash /> Danger Zone</h3>
        <button onClick={handleDeleteAccount} className="text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 transition text-sm font-bold">Delete Account</button>
      </div>
    </div>
  );
}