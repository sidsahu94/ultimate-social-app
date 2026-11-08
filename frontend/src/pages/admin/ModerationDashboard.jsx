// frontend/src/pages/admin/ModerationDashboard.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaShieldAlt, FaCheck, FaTrash } from 'react-icons/fa';

export default function ModerationDashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await API.get('/report');
        const data = r.data?.data || r.data;
        setReports(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
      try {
        const s = await API.get('/moderation/stats');
        setStats(s.data?.data || s.data || {});
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
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24">
      <div className="mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#10B981] mb-1">
            <FaShieldAlt /> Content Moderation
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
            Moderation Queue<span className="text-[#00F2FE]">.</span>
          </h1>
        </div>
        <div className="text-xs font-mono text-[#CBD5E1] bg-[#070B14] border border-white/10 px-4 py-2 rounded-2xl">
          Open Inquiries: <span className="font-bold text-[#00F2FE]">{stats?.openReports ?? reports.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map(r => (
          <div key={r._id} className="p-5 rounded-3xl border border-white/10 bg-[#070B14]/90 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-sm text-[#F7F7FC] capitalize">{r.reason}</div>
                <div className="text-xs text-[#CBD5E1] mt-1">{r.details || 'Community reported violation'}</div>
                <div className="text-[11px] text-[#A5A9BB] mt-1.5">Flagged by: {r.reporter?.name || 'Anonymous'} • {new Date(r.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</div>
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                <button 
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-[#A5A9BB] hover:text-[#F7F7FC] transition" 
                  onClick={() => resolve(r._id, 'dismissed')}
                >
                  Dismiss
                </button>
                <button 
                  className="px-4 py-2 rounded-xl bg-[#052E24] hover:bg-[#10B981] text-white text-xs font-bold shadow-md transition" 
                  onClick={() => resolve(r._id, 'resolved')}
                >
                  Resolve
                </button>
              </div>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-16 text-xs text-[#A5A9BB] bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl">
            No moderation items currently in review.
          </div>
        )}
      </div>
    </div>
  );
}
