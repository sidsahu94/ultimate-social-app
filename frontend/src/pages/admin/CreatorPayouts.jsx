// frontend/src/pages/admin/CreatorPayouts.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaMoneyBillWave, FaCheck } from 'react-icons/fa';

export default function CreatorPayouts() {
  const [items, setItems] = useState([]);
  
  useEffect(() => { 
    API.get('/payouts')
      .then(r => {
        const payload = r.data?.data || r.data;
        setItems(Array.isArray(payload) ? payload : []);
      })
      .catch(() => {}); 
  }, []);

  const markPaid = async (id) => {
    await API.post(`/payouts/${id}/paid`);
    setItems(items.map(it => it._id === id ? { ...it, status: 'paid' } : it));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24">
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-1">
          <FaMoneyBillWave /> Financial Dispatches
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
          Creator Disbursements<span className="text-[#00F2FE]">.</span>
        </h1>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16 text-xs text-[#A5A9BB] bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl">
            No pending creator disbursements found.
          </div>
        ) : (
          items.map(i => (
            <div key={i._id} className={`p-5 rounded-3xl border border-white/10 bg-[#070B14]/90 shadow-xl backdrop-blur-xl ${i.status==='paid' ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#F7F7FC]">{i.creator?.name}</div>
                  <div className="text-xs text-[#CBD5E1] mt-0.5">₹{i.amount} • <span className="uppercase text-[#00F2FE] font-mono">{i.method}</span></div>
                </div>
                <div>
                  {i.status !== 'paid' ? (
                    <button 
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white text-xs font-bold shadow-md hover:opacity-95 transition" 
                      onClick={() => markPaid(i._id)}
                    >
                      Authorize Payout
                    </button>
                  ) : (
                    <span className="text-[#00F2FE] font-bold text-xs flex items-center gap-1.5">
                      <FaCheck size={10} /> Disbursed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
