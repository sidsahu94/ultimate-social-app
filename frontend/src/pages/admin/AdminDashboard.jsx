// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    API.get('/admin/stats').then(res => setStats(res.data)).catch(()=>{});
    API.get('/admin/users').then(res => setUsers(res.data)).catch(()=>{});
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">Users: {stats?.userCount ?? '-'}</div>
        <div className="bg-white rounded shadow p-4">Posts: {stats?.postCount ?? '-'}</div>
        <div className="bg-white rounded shadow p-4">Reports: -</div>
      </div>
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-2">Users</h2>
        {users.map(u => (
          <div key={u._id} className="border-b p-2 flex justify-between items-center">
            <div>
              <div className="font-semibold">{u.name}</div>
              <div className="text-sm text-gray-600">{u.email}</div>
            </div>
            <div>
              <button className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
