// src/pages/auth/Register.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post('/auth/register', form);
      setMsg('Registered. Check email for OTP. You can now login.');
      setLoading(false);
      setTimeout(()=>nav('/login'), 1200);
    } catch (err) {
      setLoading(false);
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Create account</h2>
        {msg && <div className="mb-2 text-sm">{msg}</div>}
        <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Full name" className="w-full p-2 border rounded mb-2" />
        <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Email" className="w-full p-2 border rounded mb-2" />
        <input value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="Password" type="password" className="w-full p-2 border rounded mb-4" />
        <button disabled={loading} className="w-full bg-green-600 text-white p-2 rounded">{loading ? 'Creating...' : 'Create account'}</button>
      </form>
    </div>
  );
};

export default Register;
