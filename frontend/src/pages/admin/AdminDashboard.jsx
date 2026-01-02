// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaUsers, FaFlag, FaChartBar, FaBan, FaTrash, FaCheck, FaSearch } from 'react-icons/fa';
import { useToast } from '../../components/ui/ToastProvider';
import Spinner from '../../components/common/Spinner';
import UserAvatar from '../../components/ui/UserAvatar';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { add } = useToast();

  useEffect(() => {
    loadStats();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'reports') loadReports();
  }, [activeTab]);

  const loadStats = () => API.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  
  const loadUsers = async () => {
    setLoading(true);
    try { 
        const r = await API.get('/admin/users'); 
        setUsers(r.data); 
    } catch(e) {
        add('Failed to load users', { type: 'error' });
    } finally { 
        setLoading(false); 
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try { 
        const r = await API.get('/admin/reports'); 
        setReports(r.data); 
    } catch(e) {
        add('Failed to load reports', { type: 'error' });
    } finally { 
        setLoading(false); 
    }
  };

  const handleBan = async (userId) => {
    if(!confirm("Toggle ban status for this user?")) return;
    try {
        await API.put(`/admin/users/${userId}/ban`);
        add("User status updated", { type: 'success' });
        // Refresh local state to reflect change immediately
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: u.role === 'banned' ? 'user' : 'banned' } : u));
    } catch(e) { 
        add("Action failed", { type: 'error' }); 
    }
  };

  const resolveReport = async (reportId, action) => {
    try {
        await API.put(`/admin/reports/${reportId}`, { action });
        add(`Report resolved: ${action}`, { type: 'success' });
        // Remove resolved report from list
        setReports(prev => prev.filter(r => r._id !== reportId));
        // Refresh stats
        loadStats();
    } catch(e) { 
        add("Failed to resolve", { type: 'error' }); 
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <h1 className="text-3xl font-black mb-6 text-gray-800 dark:text-white">Admin Command Center</h1>

      {/* Tabs Navigation */}
      <div className="flex gap-4 mb-8 border-b dark:border-gray-700 pb-1 overflow-x-auto">
        {[
            { id: 'overview', icon: <FaChartBar />, label: 'Overview' },
            { id: 'users', icon: <FaUsers />, label: 'Users' },
            { id: 'reports', icon: <FaFlag />, label: 'Reports' }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-bold transition whitespace-nowrap ${activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="card p-6 border-l-4 border-blue-500 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total Users</h3>
                <p className="text-4xl font-black text-gray-800 dark:text-white mt-2">{stats.userCount}</p>
            </div>
            <div className="card p-6 border-l-4 border-green-500 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total Posts</h3>
                <p className="text-4xl font-black text-gray-800 dark:text-white mt-2">{stats.postCount}</p>
            </div>
            <div className="card p-6 border-l-4 border-red-500 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Open Reports</h3>
                <p className="text-4xl font-black text-gray-800 dark:text-white mt-2">{stats.reportCount}</p>
            </div>
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === 'users' && (
        <div className="card bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-fade-in">
            {/* Search Bar */}
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50">
                <FaSearch className="text-gray-400" />
                <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="bg-transparent outline-none w-full text-sm"
                />
            </div>

            {loading ? <div className="p-10 flex justify-center"><Spinner /></div> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {filteredUsers.map(u => (
                                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar src={u.avatar} name={u.name} className="w-8 h-8" />
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">{u.name}</div>
                                                <div className="text-xs text-gray-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {u.role === 'banned' ? (
                                            <span className="text-red-500 font-bold text-xs flex items-center gap-1"><FaBan /> Banned</span>
                                        ) : (
                                            <span className="text-green-500 font-bold text-xs flex items-center gap-1"><FaCheck /> Active</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        {u.role !== 'admin' && (
                                            <button 
                                                onClick={() => handleBan(u._id)} 
                                                className={`p-2 rounded-lg transition ${u.role === 'banned' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                                title={u.role === 'banned' ? "Unban User" : "Ban User"}
                                            >
                                                {u.role === 'banned' ? <FaCheck /> : <FaBan />}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-500">No users found.</div>}
                </div>
            )}
        </div>
      )}

      {/* TAB CONTENT: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-fade-in">
            {loading && <div className="p-10 flex justify-center"><Spinner /></div>}
            
            {!loading && reports.length === 0 && (
                <div className="card p-10 text-center flex flex-col items-center justify-center text-gray-500 bg-white dark:bg-gray-800">
                    <FaCheck className="text-4xl text-green-500 mb-3" />
                    <p className="font-bold">All clean!</p>
                    <p className="text-sm">No open reports found.</p>
                </div>
            )}

            {reports.map(r => (
                <div key={r._id} className="card p-5 bg-white dark:bg-gray-800 border-l-4 border-red-500 shadow-sm rounded-r-xl flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">{r.reason}</span>
                            <span className="text-gray-400 text-xs">• {new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        
                        <p className="text-sm font-medium mb-3">
                            Reported by <span className="font-bold text-gray-800 dark:text-gray-200">{r.reporter?.name || 'Unknown'}</span>
                        </p>
                        
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                            {r.targetPost ? (
                                <div>
                                    <div className="text-xs text-gray-400 mb-1 uppercase font-bold">Post Content:</div>
                                    "{r.targetPost.content || 'Media Content'}"
                                </div>
                            ) : (
                                <div>
                                    <div className="text-xs text-gray-400 mb-1 uppercase font-bold">Target User:</div>
                                    {r.targetUser?.name} ({r.targetUser?.email})
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0">
                        <button 
                            onClick={() => resolveReport(r._id, 'dismiss')} 
                            className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 transition"
                        >
                            Dismiss
                        </button>
                        
                        {r.targetPost && (
                            <button 
                                onClick={() => resolveReport(r._id, 'delete_post')} 
                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                            >
                                <FaTrash /> Delete Post
                            </button>
                        )}
                        
                        {r.targetUser && (
                            <button 
                                onClick={() => resolveReport(r._id, 'ban_user')} 
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition shadow-md"
                            >
                                <FaBan /> Ban User
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}