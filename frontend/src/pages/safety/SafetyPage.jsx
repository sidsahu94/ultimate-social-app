// frontend/src/pages/safety/SafetyPage.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaShieldAlt, FaBan, FaCheckCircle, FaUserShield, FaClock } from 'react-icons/fa';
import { useToast } from '../../components/ui/ToastProvider';
import Spinner from '../../components/common/Spinner';
import UserAvatar from '../../components/ui/UserAvatar';

export default function SafetyPage() {
  const [activeTab, setActiveTab] = useState('reports');
  const [blockedList, setBlockedList] = useState([]);
  const [myReports, setMyReports] = useState([]); 
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  useEffect(() => {
    if (activeTab === 'blocked') loadBlocked();
    if (activeTab === 'reports') loadReports(); 
  }, [activeTab]);

  const loadBlocked = async () => {
    setLoading(true);
    try {
        const res = await API.get('/users/blocked');
        setBlockedList(res.data.data || res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // 🔥 ADDED: Load Reports
  const loadReports = async () => {
    setLoading(true);
    try {
        const res = await API.get('/report/mine');
        setMyReports(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUnblock = async (userId) => {
      try {
          await API.post(`/users/${userId}/block`);
          setBlockedList(prev => prev.filter(u => u._id !== userId));
          add("User unblocked", { type: 'success' });
      } catch (e) {
          add("Failed to unblock", { type: 'error' });
      }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <FaShieldAlt className="absolute right-[-20px] bottom-[-20px] text-9xl opacity-20" />
        <h1 className="text-3xl font-bold relative z-10">Safety Center</h1>
        <p className="opacity-90 relative z-10">Manage your privacy and security settings.</p>
      </div>

      <div className="flex gap-4 border-b dark:border-gray-700 mb-6">
        <button onClick={() => setActiveTab('reports')} className={`pb-2 px-4 font-medium transition ${activeTab==='reports' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-500'}`}>My Reports</button>
        <button onClick={() => setActiveTab('blocked')} className={`pb-2 px-4 font-medium transition ${activeTab==='blocked' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-500'}`}>Blocked Users</button>
      </div>

      {loading ? <div className="text-center py-10"><Spinner /></div> : (
        <>
        {/* --- REPORTS TAB --- */}
        {activeTab === 'reports' && (
            <div className="space-y-4">
                {myReports.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <FaUserShield className="text-4xl mb-2 mx-auto opacity-30"/>
                        <p>No active reports found.</p>
                    </div>
                ) : (
                    myReports.map(rep => (
                        <div key={rep._id} className="card p-4 flex justify-between items-start bg-white dark:bg-gray-800 border-l-4 border-red-500">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-gray-800 dark:text-white capitalize">{rep.reason}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${rep.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                        {rep.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Reported: {rep.targetUser?.name || 'Content'}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <FaClock size={10} /> {new Date(rep.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            {rep.action && rep.action !== 'none' && (
                                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-xs font-medium">
                                    Action taken: <span className="font-bold">{rep.action}</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- BLOCKED TAB --- */}
        {activeTab === 'blocked' && (
            <div className="space-y-4">
              {blockedList.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">You haven't blocked anyone yet.</div>
              ) : (
                blockedList.map(u => (
                    <div key={u._id} className="card p-4 flex items-center justify-between bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <UserAvatar src={u.avatar} name={u.name} className="w-10 h-10" />
                        <div className="font-bold dark:text-gray-200">{u.name}</div>
                    </div>
                    <button 
                        onClick={() => handleUnblock(u._id)}
                        className="text-sm text-red-500 font-bold border border-red-200 dark:border-red-900 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                        Unblock
                    </button>
                    </div>
                ))
              )}
            </div>
        )}
        </>
      )}
    </div>
  );
}