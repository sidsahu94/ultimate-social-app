// frontend/src/pages/shop/Shop.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';

export default function Shop() {
  const [items, setItems] = useState([]);
  const toast = useToast();

  useEffect(()=>{ API.get('/shop').then(r=>setItems(r.data)) },[]);

  const buy = async (id) => {
    try {
      await API.post(`/shop/${id}/buy`);
      toast.add('Purchased!', { type: 'info' });
    } catch (e) {
      toast.add(e.userMessage || 'Failed to buy', { type:'error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 grid md:grid-cols-3 gap-3">
      {items.map(i => (
        <div className="card p-3" key={i._id}>
          {i.image && <img className="w-full h-40 object-cover rounded mb-2" src={i.image} />}
          <div className="font-semibold">{i.title}</div>
          <div className="text-sm text-gray-600">{i.description}</div>
          <div className="mt-2 flex items-center justify-between">
            <div>₹{i.price}</div>
            <button className="btn-primary" onClick={()=>buy(i._id)}>Buy</button>
          </div>
        </div>
      ))}
    </div>
  );
}
