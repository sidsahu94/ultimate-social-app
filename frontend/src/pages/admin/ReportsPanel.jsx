import React, { useState, useEffect } from 'react';
import API from '../../services/api';

export default function ReportsPanel() {
  const [data, set] = useState([]);

  const load = async () => {
    const r = await API.get('/extra/reports');
    set(r.data);
  };

  useEffect(()=>{ load(); }, []);

  const handle = async (id, action) => {
    await API.post(`/extra/reports/${id}/handle`, { action });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="font-bold mb-3">Reports</h2>
      {data.map(rep => (
        <div key={rep._id} className="card p-3 flex justify-between mb-2">
          <div>
            <div className="font-medium">Reporter: {rep.reporter.name}</div>
            <div className="text-xs">{rep.reason}</div>
          </div>
          <div className="flex gap-1">
            <button onClick={()=>handle(rep._id,'dismiss')}>Dismiss</button>
            <button onClick={()=>handle(rep._id,'close')}>Close</button>
          </div>
        </div>
      ))}
    </div>
  );
}
