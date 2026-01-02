import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateAuthUser } from '../../redux/slices/authSlice';
import { FaLock, FaUserShield, FaTrash, FaMoon, FaUserFriends, FaSearch, FaCheck, FaGoogle, FaBell, FaToggleOn, FaToggleOff, FaUserCircle, FaSave, FaArrowLeft } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeProvider';
import { Link } from 'react-router-dom';

export default function SettingsPage() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const { add } = useToast();
  const { toggle: toggleTheme } = useTheme();

  // Settings State
  const [notifSettings, setNotifSettings] = useState({
      likes: true, comments: true, follows: true, messages: true
  });
  const [status, setStatus] = useState('');
  const [pass, setPass] = useState({ current: '', new: '' });
  const [privacy, setPrivacy] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Close Friends
  const [showCF, setShowCF] = useState(false);
  const [cfList, setCfList] = useState([]); 
  const [cfQuery, setCfQuery] = useState('');
  const [cfResults, setCfResults] = useState([]);

  // Load Initial Data
  useEffect(() => {
    if (user) {
        if (user.notificationSettings) setNotifSettings(user.notificationSettings);
        if (user.userStatus) setStatus(user.userStatus);
        setPrivacy(user.privateProfile || false);
    }
    
    // Fetch fresh CF list
    API.get('/users/me').then(r => {
        if (r.data.closeFriends) setCfList(r.data.closeFriends);
    }).catch(() => {});
  }, [user]);

  // --- Handlers ---

  const toggleNotif = async (key) => {
      const newState = { ...notifSettings, [key]: !notifSettings[key] };
      setNotifSettings(newState); // Optimistic UI
      try {
          await API.put('/users/settings/notifications', newState);
          dispatch(updateAuthUser({ notificationSettings: newState }));
      } catch (e) {
          setNotifSettings(prev => ({ ...prev, [key]: !prev[key] })); // Revert
          add("Failed to update settings", { type: 'error' });
      }
  };

  const saveStatus = async () => {
      setLoadingStatus(true);
      try {
          await API.put('/users/status', { status });
          dispatch(updateAuthUser({ userStatus: status }));
          add("Status updated!", { type: 'success' });
      } catch (e) {
          add("Failed to update status", { type: 'error' });
      } finally { setLoadingStatus(false); }
  };

  const handlePrivacy = async () => {
    try {
      const newVal = !privacy;
      setPrivacy(newVal);
      const fd = new FormData(); fd.append('isPrivate', newVal);
      await API.put(`/users/${user._id}`, fd);
      add(`Profile is now ${newVal ? 'Private' : 'Public'}`, { type: 'info' });
      dispatch(updateAuthUser({ privateProfile: newVal }));
    } catch (e) { 
        setPrivacy(!privacy); 
        add("Failed to change privacy", { type: 'error' }); 
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

  // Close Friends Logic
  const toggleCF = async (targetUser) => {
    try {
      const isAdded = Boolean(cfList.find(u => u._id === targetUser._id));
      let newList = isAdded ? cfList.filter(u => u._id !== targetUser._id) : [...cfList, targetUser];
      setCfList(newList);
      await API.put('/users/close-friends', { userIds: newList.map(u => u._id) });
    } catch (err) { add("Failed to update Close Friends", { type: 'error' }); }
  };

  const searchCF = async (q) => {
    setCfQuery(q);
    if (!q || q.length <= 2) { setCfResults([]); return; }
    try {
      const r = await API.get(`/users/search?q=${encodeURIComponent(q)}`);
      setCfResults(r.data.users || []);
    } catch (e) {}
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure? This cannot be undone.")) return;
    try {
      await API.delete('/users/me');
      dispatch(logout()); 
      window.location.href = '/login';
    } catch (e) { add("Failed to delete account", { type: 'error' }); }
  };

  const isGoogleUser = !!user?.googleId; 

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
          <Link to={`/profile/${user?._id}`} className="md:hidden text-gray-500"><FaArrowLeft /></Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings & Privacy</h1>
      </div>

      {/* --- 1. Custom Status --- */}
      <div className="card p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg"><FaUserCircle size={20} /></div>
              <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">Custom Status</h3>
                  <p className="text-xs text-gray-500">What are you doing right now?</p>
              </div>
          </div>
          <div className="flex gap-2">
              <input 
                  value={status} 
                  onChange={e => setStatus(e.target.value)} 
                  placeholder="e.g. Working, Traveling ✈️" 
                  className="flex-1 p-3 rounded-xl border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 outline-none transition"
              />
              <button onClick={saveStatus} disabled={loadingStatus} className="bg-green-600 text-white px-4 rounded-xl font-bold hover:bg-green-700 transition flex items-center gap-2">
                  <FaSave /> {loadingStatus ? '...' : 'Save'}
              </button>
          </div>
      </div>

      {/* --- 2. Notification Preferences --- */}
      <div className="card p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><FaBell size={20} /></div>
          <div>
            <div className="font-bold text-gray-800 dark:text-gray-200">Notifications</div>
            <div className="text-xs text-gray-500">Manage your alerts</div>
          </div>
        </div>

        <div className="space-y-3">
            {Object.keys(notifSettings).map(key => (
                <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-xl transition cursor-pointer" onClick={() => toggleNotif(key)}>
                    <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{key}</span>
                    <div className={`text-2xl transition-colors ${notifSettings[key] ? 'text-green-500' : 'text-gray-300'}`}>
                        {notifSettings[key] ? <FaToggleOn /> : <FaToggleOff />}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- 3. Privacy --- */}
      <div className="card p-5 flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><FaUserShield /></div>
          <div>
            <div className="font-bold text-gray-800 dark:text-gray-200">Private Account</div>
            <div className="text-xs text-gray-500">Only followers can see your posts</div>
          </div>
        </div>
        <div onClick={handlePrivacy} className={`w-12 h-6 rounded-full cursor-pointer transition-colors p-1 ${privacy ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${privacy ? 'translate-x-6' : ''}`} />
        </div>
      </div>

      {/* --- 4. Close Friends --- */}
      <div className="card p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg"><FaUserFriends /></div>
            <div>
              <div className="font-bold text-gray-800 dark:text-gray-200">Close Friends</div>
              <div className="text-xs text-gray-500">{cfList.length} people</div>
            </div>
          </div>
          <button onClick={() => setShowCF(!showCF)} className="text-indigo-600 font-bold text-sm bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">Manage</button>
        </div>

        {showCF && (
          <div className="mt-4 border-t dark:border-gray-700 pt-4 animate-fade-in">
            <div className="relative mb-3">
              <input
                className="w-full p-2.5 pl-10 border rounded-xl bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Search to add..."
                value={cfQuery}
                onChange={e => searchCF(e.target.value)}
              />
              <div className="absolute left-3 top-3 text-gray-400"><FaSearch /></div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
              {(cfQuery && cfQuery.length > 2 ? cfResults : cfList).map(u => (
                <div key={u._id} onClick={() => toggleCF(u)} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer rounded-lg transition">
                  <div className="flex items-center gap-2">
                    <img src={u.avatar || '/default-avatar.png'} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                    <span className="text-sm font-medium dark:text-gray-200">{u.name}</span>
                  </div>
                  {cfList.find(s => s._id === u._id) && <FaCheck className="text-green-500" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- 5. Theme --- */}
      <div className="card p-5 flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><FaMoon /></div>
          <div>
            <div className="font-bold text-gray-800 dark:text-gray-200">Dark Mode</div>
            <div className="text-xs text-gray-500">Adjust appearance</div>
          </div>
        </div>
        <div onClick={toggleTheme} className="cursor-pointer">
            <FaToggleOn className="text-3xl text-gray-300 dark:text-purple-500 transition-colors" />
        </div>
      </div>

      {/* --- 6. Security (Password / Delete) --- */}
      {!isGoogleUser ? (
        <div className="card p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 rounded-lg"><FaLock /></div>
                <h3 className="font-bold text-gray-800 dark:text-gray-200">Change Password</h3>
            </div>
            <form onSubmit={handlePassword} className="space-y-3">
                <input type="password" placeholder="Current Password" className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600" value={pass.current} onChange={e => setPass({ ...pass, current: e.target.value })} />
                <input type="password" placeholder="New Password" className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600" value={pass.new} onChange={e => setPass({ ...pass, new: e.target.value })} />
                <button disabled={!pass.current || !pass.new} className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition">Update</button>
            </form>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl flex items-center gap-3 text-sm text-blue-800 dark:text-blue-200">
            <FaGoogle /> Signed in with Google. Security managed by Google.
        </div>
      )}

      <div className="pt-4 pb-8">
        <button onClick={handleDeleteAccount} className="w-full py-3 border border-red-200 bg-red-50 dark:bg-red-900/10 text-red-600 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition flex items-center justify-center gap-2">
            <FaTrash /> Delete Account
        </button>
      </div>
    </div>
  );
}