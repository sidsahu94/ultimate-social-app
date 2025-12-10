import React, { useEffect, useState } from 'react';
import API from '../../services/api';

export default function RequestsPage() {
  const [reqs, setReqs] = useState([]);

  const load = async () => {
    const r = await API.get('/users/follow-requests');
    setReqs(r.data);
  };

  useEffect(()=>{ load(); }, []);

  const accept = async (id) => {
    await API.post(`/users/accept-request/${id}`);
    load();
  };

  const decline = async (id) => {
    await API.post(`/users/decline-request/${id}`);
    load();
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h3 className="font-bold mb-2">Follow Requests</h3>
      {reqs.map(r => (
        <div key={r._id} className="card p-3 flex items-center justify-between mb-2">
          <div>{r.from.name}</div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={()=>accept(r._id)}>Accept</button>
            <button className="btn-error" onClick={()=>decline(r._id)}>Decline</button>
          </div>
        </div>
      ))}
    </div>
  )
}
