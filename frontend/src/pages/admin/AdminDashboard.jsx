// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaUser, FaFileAlt, FaTrash, FaBan, FaCheck, FaSearch } from 'react-icons/fa';
import { useToast } from '../../components/ui/ToastProvider';
import Spinner from '../../components/common/Spinner';
import UserAvatar from '../../components/ui/UserAvatar';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'posts'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { add } = useToast();

  useEffect(() => {
    loadStats();
    loadData();
  }, [activeTab]);

  const loadStats = () => {
    API.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Backend must implement /admin/users and /admin/posts
      const endpoint = activeTab === 'users' ? '/admin/users' : '/admin/posts';
      const res = await API.get(endpoint);
      setData(res.data);
    } catch (e) {
      add('Failed to load data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This is destructive.")) return;
    try {
      const endpoint = activeTab === 'users' ? `/admin/users/${id}` : `/posts/${id}`; // Reuse standard post delete
      await API.delete(endpoint);
      setData(prev => prev.filter(item => item._id !== id));
      add(`${activeTab === 'users' ? 'User' : 'Post'} deleted`, { type: 'success' });
      loadStats(); // Refresh counters
    } catch (e) {
      add('Action failed', { type: 'error' });
    }
  };

  // Filter local data by search
  const filteredData = data.filter(item => {
      const term = search.toLowerCase();
      if (activeTab === 'users') {
          return item.name?.toLowerCase().includes(term) || item.email?.toLowerCase().includes(term);
      } else {
          return item.content?.toLowerCase().includes(term) || item.user?.name?.toLowerCase().includes(term);
      }
  });

  return (
    <div className="max-w-6xl mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
          <div className="text-gray-500 text-sm font-bold uppercase">Users</div>
          <div className="text-3xl font-black text-indigo-600">{stats?.userCount || '-'}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-gray-700">
          <div className="text-gray-500 text-sm font-bold uppercase">Posts</div>
          <div className="text-3xl font-black text-purple-600">{stats?.postCount || '-'}</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl border-b dark:border-gray-700 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
            <button 
                onClick={() => setActiveTab('users')}
                className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
                <FaUser className="inline mr-2" /> Users
            </button>
            <button 
                onClick={() => setActiveTab('posts')}
                className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'posts' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
                <FaFileAlt className="inline mr-2" /> Posts
            </button>
        </div>
        
        <div className="relative w-full md:w-64">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-10 p-2 rounded-xl bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 outline-none focus:ring-2 ring-indigo-500"
            />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="flex justify-center items-center h-64"><Spinner /></div>
        ) : filteredData.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No data found.</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="p-4">{activeTab === 'users' ? 'User' : 'Author'}</th>
                            <th className="p-4">{activeTab === 'users' ? 'Email / Role' : 'Content'}</th>
                            <th className="p-4">Created</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredData.map(item => (
                            <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar 
                                            src={activeTab === 'users' ? item.avatar : item.user?.avatar} 
                                            name={activeTab === 'users' ? item.name : item.user?.name} 
                                            className="w-10 h-10"
                                        />
                                        <div className="font-bold text-sm">
                                            {activeTab === 'users' ? item.name : item.user?.name || 'Unknown'}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {activeTab === 'users' ? (
                                        <div>
                                            <div className="text-sm">{item.email}</div>
                                            <span className={`text-xs px-2 py-0.5 rounded ${item.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {item.role}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                            {item.content || 'Media only'}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-xs text-gray-500">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(item._id)}
                                        className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition"
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}