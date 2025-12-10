import React, { useState } from 'react';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { FaLock, FaUserShield, FaTrash, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeProvider';

export default function SettingsPage() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const { add } = useToast();
  const { toggle: toggleTheme } = useTheme();
  
  const [pass, setPass] = useState({ current: '', new: '' });
  const [privacy, setPrivacy] = useState(user?.privateProfile || false);

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
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg"><FaMoon className="text-indigo-600 dark:text-indigo-300"/></div>
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
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg"><FaUserShield className="text-green-600 dark:text-green-300"/></div>
          <div>
            <div className="font-semibold">Private Account</div>
            <div className="text-xs text-gray-500">Only followers can see your posts</div>
          </div>
        </div>
        <div onClick={handlePrivacy} className={`w-12 h-6 rounded-full cursor-pointer transition-colors p-1 ${privacy ? 'bg-green-500' : 'bg-gray-300'}`}>
          <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${privacy ? 'translate-x-6' : ''}`} />
        </div>
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
            onChange={e => setPass({...pass, current: e.target.value})}
          />
          <input 
            type="password" 
            placeholder="New Password" 
            autoComplete="new-password"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            value={pass.new}
            onChange={e => setPass({...pass, new: e.target.value})}
          />
          <button disabled={!pass.current || !pass.new} className="w-full bg-black dark:bg-white dark:text-black text-white py-2 rounded font-medium disabled:opacity-50">Update</button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="p-5 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
        <h3 className="text-red-600 font-bold mb-2 flex items-center gap-2"><FaTrash /> Danger Zone</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Once you delete your account, there is no going back.</p>
        <button onClick={() => { if(confirm("Delete account?")) dispatch(logout()); }} className="text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 transition text-sm font-bold">Delete Account</button>
      </div>
    </div>
  );
}