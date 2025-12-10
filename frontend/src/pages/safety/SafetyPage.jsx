import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaShieldAlt, FaBan, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function SafetyPage() {
  const [activeTab, setActiveTab] = useState('reports');
  
  // Dummy data - replace with API calls if you build the full blocking system backend
  const blockedUsers = [
    { id: 1, name: 'Spam Bot 3000', date: '2025-10-01' },
  ];
  
  const myReports = [
    { id: 1, type: 'Post', reason: 'Harassment', status: 'resolved', date: '2025-11-12' },
    { id: 2, type: 'User', reason: 'Fake Profile', status: 'pending', date: '2025-12-01' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-8 text-white mb-8 shadow-xl">
        <FaShieldAlt className="text-5xl mb-4 opacity-80" />
        <h1 className="text-3xl font-bold">Safety Center</h1>
        <p className="opacity-90">Manage your block list and view the status of your reports.</p>
      </div>

      <div className="flex gap-4 border-b dark:border-gray-700 mb-6">
        <button onClick={() => setActiveTab('reports')} className={`pb-2 px-4 font-medium ${activeTab==='reports' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-500'}`}>My Reports</button>
        <button onClick={() => setActiveTab('blocked')} className={`pb-2 px-4 font-medium ${activeTab==='blocked' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-500'}`}>Blocked Users</button>
      </div>

      {activeTab === 'reports' ? (
        <div className="space-y-4">
          {myReports.map(r => (
            <div key={r.id} className="card p-4 flex items-center justify-between border-l-4 border-l-indigo-500">
              <div>
                <div className="font-bold text-lg">{r.reason}</div>
                <div className="text-sm text-gray-500">Reported a {r.type} on {r.date}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${r.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {r.status}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {blockedUsers.map(u => (
            <div key={u.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gray-200 p-2 rounded-full"><FaBan className="text-red-500" /></div>
                <div className="font-bold">{u.name}</div>
              </div>
              <button className="text-sm text-red-500 font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50">Unblock</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}