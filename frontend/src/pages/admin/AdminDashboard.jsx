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
  // 🔥 FIX: Add filter state for reports
  const [reportFilter, setReportFilter] = useState('open'); // 'open' | 'resolved'
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { add } = useToast();

  useEffect(() => {
    loadStats();
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'reports') loadReports();
  }, [activeTab, reportFilter]); // Reload when filter changes

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
        // 🔥 FIX: Pass status param to API
        const r = await API.get(`/admin/reports?status=${reportFilter}`); 
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
        // Refresh local state
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: u.role === 'banned' ? 'user' : 'banned' } : u));
    } catch(e) { 
        add("Action failed", { type: 'error' }); 
    }
  };

  const resolveReport = async (reportId, action) => {
    try {
        await API.put(`/admin/reports/${reportId}`, { action });
        add(`Report processed: ${action}`, { type: 'success' });
        
        // If viewing open reports, remove resolved one from list
        if (reportFilter === 'open') {
            setReports(prev => prev.filter(r => r._id !== reportId));
        }
        loadStats();
    } catch(e) { 
        add("Failed to resolve", { type: 'error' }); 
    }
  };

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

      {/* OVERVIEW */}
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

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="card bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-fade-in">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50">
                <FaSearch className="text-gray-400" />
                <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="bg-transparent outline-none w-full text-sm dark:text-white"
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
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {filteredUsers.map(u => (
                                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                    <td className="p-4 flex items-center gap-3">
                                        <UserAvatar src={u.avatar} name={u.name} className="w-8 h-8" />
                                        <div>
                                            <div className="font-bold dark:text-white">{u.name}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">{u.role}</td>
                                    <td className="p-4">
                                        {u.role === 'banned' 
                                            ? <span className="text-red-500 font-bold flex items-center gap-1"><FaBan /> Banned</span> 
                                            : <span className="text-green-500 font-bold flex items-center gap-1"><FaCheck /> Active</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        {u.role !== 'admin' && (
                                            <button onClick={() => handleBan(u._id)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                                {u.role === 'banned' ? <FaCheck /> : <FaBan />}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-fade-in">
            {/* 🔥 FIX: Filter Toggle Buttons */}
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => setReportFilter('open')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${reportFilter === 'open' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                    Open
                </button>
                <button 
                    onClick={() => setReportFilter('resolved')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${reportFilter === 'resolved' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                    Resolved / History
                </button>
            </div>

            {loading && <div className="p-10 flex justify-center"><Spinner /></div>}
            
            {!loading && reports.length === 0 && (
                <div className="card p-10 text-center flex flex-col items-center justify-center text-gray-500 bg-white dark:bg-gray-800">
                    <FaCheck className="text-4xl text-green-500 mb-3" />
                    <p>No reports found in this category.</p>
                </div>
            )}

            {reports.map(r => (
                <div key={r._id} className={`card p-5 bg-white dark:bg-gray-800 border-l-4 shadow-sm rounded-r-xl flex flex-col md:flex-row justify-between gap-6 ${r.status === 'open' ? 'border-red-500' : 'border-green-500 opacity-80'}`}>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${r.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{r.reason}</span>
                            <span className="text-gray-400 text-xs">• {new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        
                        <p className="text-sm font-medium mb-3">
                            Reported by <span className="font-bold text-gray-800 dark:text-gray-200">{r.reporter?.name || 'Unknown'}</span>
                        </p>
                        
                        {r.status !== 'open' && r.handledBy && (
                             <p className="text-xs text-green-600 mb-2 font-bold">Resolved by: {r.handledBy.name}</p>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                            {r.targetPost ? (
                                <div><div className="text-xs text-gray-400 mb-1 uppercase font-bold">Post Content:</div> "{r.targetPost.content || 'Media'}"</div>
                            ) : (
                                <div><div className="text-xs text-gray-400 mb-1 uppercase font-bold">Target User:</div> {r.targetUser?.name} ({r.targetUser?.email})</div>
                            )}
                        </div>
                    </div>

                    {r.status === 'open' && (
                        <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0">
                            <button onClick={() => resolveReport(r._id, 'dismiss')} className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 transition">Dismiss</button>
                            
                            {r.targetPost && (
                                <button onClick={() => resolveReport(r._id, 'delete_post')} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition">
                                    <FaTrash /> Delete Post
                                </button>
                            )}
                            
                            {r.targetUser && (
                                <button onClick={() => resolveReport(r._id, 'ban_user')} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition shadow-md">
                                    <FaBan /> Ban User
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}
    </div>
  );
}