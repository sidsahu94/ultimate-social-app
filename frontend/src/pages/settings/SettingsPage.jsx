// frontend/src/pages/settings/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { FaLock, FaUserShield, FaTrash, FaMoon, FaUserFriends, FaSearch, FaCheck } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeProvider';

export default function SettingsPage() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const { add } = useToast();
  const { toggle: toggleTheme } = useTheme();

  const [pass, setPass] = useState({ current: '', new: '' });
  const [privacy, setPrivacy] = useState(user?.privateProfile || false);

  // --- Close Friends State ---
  const [showCF, setShowCF] = useState(false);
  const [cfList, setCfList] = useState([]); // list of user objects
  const [cfQuery, setCfQuery] = useState('');
  const [cfResults, setCfResults] = useState([]);

  // Load initial close friends
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await API.get('/users/me');
        if (!mounted) return;
        const existing = r?.data || {};
        setCfList(Array.isArray(existing.closeFriends) ? existing.closeFriends : []);
      } catch (e) {
        console.warn('Failed to load user data for close friends', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Toggle close friend inclusion (optimistic)
  const toggleCF = async (targetUser) => {
    try {
      const isAdded = Boolean(cfList.find(u => u._id === targetUser._id));
      let newList;
      if (isAdded) {
        newList = cfList.filter(u => u._id !== targetUser._id);
      } else {
        newList = [...cfList, targetUser];
      }
      // optimistic UI
      setCfList(newList);

      // Persist to backend (send ids only)
      await API.put('/users/close-friends', { userIds: newList.map(u => u._id) });
      add(isAdded ? 'Removed from Close Friends' : 'Added to Close Friends', { type: 'info' });
    } catch (err) {
      // revert UI on error by refetching current list
      add(err?.userMessage || 'Failed to update Close Friends', { type: 'error' });
      try {
        const r = await API.get('/users/me');
        setCfList(r?.data?.closeFriends || []);
      } catch (e) { /* ignore */ }
    }
  };

  // Search for users to add (only when query length > 2)
  const searchCF = async (q) => {
    setCfQuery(q);
    if (!q || q.length <= 2) {
      setCfResults([]);
      return;
    }
    try {
      const r = await API.get(`/users/search?q=${encodeURIComponent(q)}`);
      // defensive read
      const users = (r?.data && Array.isArray(r.data.users)) ? r.data.users : (Array.isArray(r?.data) ? r.data : []);
      setCfResults(users);
    } catch (e) {
      console.warn('Close friends search failed', e);
      setCfResults([]);
    }
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
    } catch (e) { add("Failed", { type: 'error' }); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

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

      {/* Close Friends Section (NEW) */}
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
          <div className="mt-4 border-t pt-4">
            <div className="relative mb-3">
              <input
                className="w-full p-2 border rounded pr-10"
                placeholder="Search to add..."
                value={cfQuery}
                onChange={e => searchCF(e.target.value)}
                aria-label="Search close friends"
              />
              <div className="absolute right-2 top-2 text-gray-400"><FaSearch /></div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2">
              {/* Show Search Results OR Current List */}
              {(cfQuery && cfQuery.length > 2 ? cfResults : cfList).map(u => (
                <div
                  key={u._id}
                  onClick={() => toggleCF(u)}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded"
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatar || '/default-avatar.png'} alt={u.name || 'avatar'} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-sm">{u.name}</span>
                  </div>
                  {cfList.find(s => s._id === u._id) ? <FaCheck className="text-green-500" /> : <div className="w-5" />}
                </div>
              ))}

              {cfQuery && cfQuery.length > 2 && cfResults.length === 0 && (
                <div className="text-xs text-gray-500 p-2">No users found.</div>
              )}

              {!cfQuery && cfList.length === 0 && (
                <div className="text-xs text-gray-500 p-2">No close friends selected yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Password - FIXED ACCESSIBILITY */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <FaLock className="text-gray-400" /> <span className="font-semibold">Change Password</span>
        </div>
        <form onSubmit={handlePassword} className="space-y-3">
          {/* Hidden Username Field for Accessibility */}
          <input type="text" autoComplete="username" className="hidden" readOnly value={user?.email || ''} />

          <input
            type="password"
            placeholder="Current Password"
            autoComplete="current-password"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            value={pass.current}
            onChange={e => setPass({ ...pass, current: e.target.value })}
          />
          <input
            type="password"
            placeholder="New Password"
            autoComplete="new-password"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            value={pass.new}
            onChange={e => setPass({ ...pass, new: e.target.value })}
          />
          <button disabled={!pass.current || !pass.new} className="w-full bg-black dark:bg-white dark:text-black text-white py-2 rounded font-medium disabled:opacity-50">Update</button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="p-5 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
        <h3 className="text-red-600 font-bold mb-2 flex items-center gap-2"><FaTrash /> Danger Zone</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Once you delete your account, there is no going back.</p>
        <button onClick={() => { if (confirm("Delete account?")) dispatch(logout()); }} className="text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 transition text-sm font-bold">Delete Account</button>
      </div>
    </div>
  );
}
