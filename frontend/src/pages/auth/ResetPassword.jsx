// frontend/src/pages/auth/ResetPassword.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../components/ui/ToastProvider';
import { FaLock, FaKey } from 'react-icons/fa';

export default function ResetPassword() {
  const { state } = useLocation();
  const [form, setForm] = useState({ email: state?.email || '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const { add } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/reset-password', form);
      add('Password reset successful! Please login.', { type: 'success' });
      navigate('/login');
    } catch (err) {
      add(err.userMessage || 'Failed to reset password', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border dark:border-gray-800">
        <h2 className="text-3xl font-black mb-2 dark:text-white">Reset Password</h2>
        <p className="text-gray-500 mb-8">Enter the code sent to your email.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            required
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            placeholder="Email"
            className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
          <div className="relative">
            <FaKey className="absolute left-4 top-4 text-gray-400" />
            <input 
              type="text" 
              required
              value={form.otp}
              onChange={e => setForm({...form, otp: e.target.value})}
              placeholder="OTP Code"
              className="w-full pl-12 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          <div className="relative">
            <FaLock className="absolute left-4 top-4 text-gray-400" />
            <input 
              type="password" 
              required
              value={form.newPassword}
              onChange={e => setForm({...form, newPassword: e.target.value})}
              placeholder="New Password"
              className="w-full pl-12 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          
          <button disabled={loading} className="w-full btn-primary py-3 rounded-xl shadow-lg shadow-indigo-500/30">
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}