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
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] p-4 font-sans text-[#F7F7FC] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-[#6558F5]/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#9B6DFF]/12 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-[#171A26]/90 backdrop-blur-3xl p-8 md:p-10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[#292D40]">
        <h2 className="text-3xl font-bold font-display tracking-tight mb-2 text-[#F7F7FC]">Reset Password</h2>
        <p className="text-[#A5A9BB] text-sm mb-8">Enter the verification code sent to your email.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            required
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            placeholder="Email Address"
            className="w-full px-4 py-3.5 bg-[#101321] border border-[#292D40] rounded-[14px] outline-none focus:border-[#6558F5] focus:ring-1 focus:ring-[#6558F5] text-[#F7F7FC] placeholder-[#A5A9BB]/60 text-sm transition"
          />
          <div className="relative">
            <FaKey className="absolute left-4 top-4 text-[#A5A9BB]" />
            <input 
              type="text" 
              required
              value={form.otp}
              onChange={e => setForm({...form, otp: e.target.value})}
              placeholder="OTP Code"
              className="w-full pl-12 pr-4 py-3.5 bg-[#101321] border border-[#292D40] rounded-[14px] outline-none focus:border-[#6558F5] focus:ring-1 focus:ring-[#6558F5] text-[#F7F7FC] placeholder-[#A5A9BB]/60 text-sm transition"
            />
          </div>
          <div className="relative">
            <FaLock className="absolute left-4 top-4 text-[#A5A9BB]" />
            <input 
              type="password" 
              required
              value={form.newPassword}
              onChange={e => setForm({...form, newPassword: e.target.value})}
              placeholder="New Password"
              className="w-full pl-12 pr-4 py-3.5 bg-[#101321] border border-[#292D40] rounded-[14px] outline-none focus:border-[#6558F5] focus:ring-1 focus:ring-[#6558F5] text-[#F7F7FC] placeholder-[#A5A9BB]/60 text-sm transition"
            />
          </div>
          
          <button disabled={loading} className="w-full py-3.5 rounded-[14px] bg-[#6558F5] text-white font-semibold hover:bg-[#5548e6] transition shadow-lg shadow-[#6558F5]/35 hover:shadow-[0_0_24px_rgba(101,88,245,0.45)] text-sm cursor-pointer disabled:opacity-70">
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}