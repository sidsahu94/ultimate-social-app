// frontend/src/components/profile/BlockButton.jsx
import React, { useState } from 'react';
import API from '../../services/api';

export default function BlockButton({ userId, onChange }) {
  const [loading, setLoading] = useState(false);
  const toggle = async () => {
    setLoading(true);
    try {
      await API.post(`/users/${userId}/block`);
      onChange && onChange();
      alert('User blocked / unblocked');
    } catch (e) { alert('Failed'); }
    setLoading(false);
  };
  return <button disabled={loading} onClick={toggle} className="px-3 py-1 rounded border">Block</button>;
}
