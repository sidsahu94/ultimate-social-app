// frontend/src/pages/admin/ModerationDashboard.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';

export default function ModerationDashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await API.get('/report');
        setReports(r.data || []);
      } catch (e) { console.error(e); }
      try {
        const s = await API.get('/api/mod/stats');
        setStats(s.data || {});
      } catch (e) {}
    };
    load();
  }, []);

  const resolve = async (id, action) => {
    try {
      await API.put(`/report/${id}`, { status: action, handledBy: 'system' });
      setReports(prev => prev.map(p => p._id === id ? { ...p, status: action } : p));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Moderation</h2>
      <div className="mb-4">
        <div>Open reports: {stats?.openReports ?? '-'}</div>
      </div>
      <div className="space-y-3">
        {reports.map(r => (
          <div key={r._id} className="card p-3">
            <div className="flex items-center gap-4">
              <div>
                <div className="font-semibold">{r.reason}</div>
                <div className="text-sm text-gray-500">{r.details}</div>
                <div className="text-xs text-gray-400">Reporter: {r.reporter?.name} • {new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="ml-auto flex gap-2">
                <button className="px-3 py-1 rounded border" onClick={()=>resolve(r._id,'dismissed')}>Dismiss</button>
                <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={()=>resolve(r._id,'resolved')}>Resolve</button>
              </div>
            </div>
          </div>
        ))}
        {reports.length === 0 && <div className="text-gray-500">No reports</div>}
      </div>
    </div>
  );
}
