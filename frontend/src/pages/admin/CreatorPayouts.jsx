// frontend/src/pages/admin/CreatorPayouts.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';

export default function CreatorPayouts() {
  const [items, setItems] = useState([]);
  useEffect(()=>{ API.get('/payouts').then(r=>setItems(r.data)) },[]);

  const markPaid = async (id) => {
    await API.post(`/payouts/${id}/paid`);
    setItems(items.map(it => it._id===id ? {...it, status:'paid'} : it));
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h3 className="text-xl font-semibold mb-3">Creator payouts</h3>
      <div className="space-y-2">
        {items.map(i=>(
          <div key={i._id} className={`card p-3 ${i.status==='paid'?'opacity-60':''}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{i.creator?.name}</div>
                <div className="text-sm text-gray-500">₹{i.amount} • {i.method}</div>
              </div>
              <div>
                {i.status!=='paid' && <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={()=>markPaid(i._id)}>Mark paid</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
