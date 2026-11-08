// frontend/src/pages/admin/ReportsPanel.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaFlag } from 'react-icons/fa';

export default function ReportsPanel() {
  const [data, set] = useState([]);

  const load = async () => {
    try {
      const r = await API.get('/extra/reports');
      const payload = r.data?.data || r.data;
      set(Array.isArray(payload) ? payload : []);
    } catch (_) {
      set([]);
    }
  };

  useEffect(() => { load(); }, []);

  const handle = async (id, action) => {
    await API.post(`/extra/reports/${id}/handle`, { action });
    load();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#10B981] mb-1">
          <FaFlag /> Incident Logs
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
          Community Incident Reports<span className="text-[#00F2FE]">.</span>
        </h1>
      </div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-16 text-xs text-[#A5A9BB] bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl">
            No incident reports logged.
          </div>
        ) : (
          data.map(rep => (
            <div key={rep._id} className="p-5 rounded-3xl border border-white/10 bg-[#070B14]/90 shadow-xl backdrop-blur-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-[#F7F7FC]">Reporter: {rep.reporter?.name || 'Anonymous'}</div>
                <div className="text-xs text-[#CBD5E1] mt-1 capitalize">{rep.reason}</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handle(rep._id, 'dismiss')}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-[#A5A9BB] hover:text-[#F7F7FC] transition"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => handle(rep._id, 'close')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white text-xs font-bold shadow-md hover:opacity-95 transition"
                >
                  Close
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
