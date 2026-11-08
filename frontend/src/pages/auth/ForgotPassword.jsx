// frontend/src/pages/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/ToastProvider';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { add } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/request-reset', { email });
      add('OTP sent to your email (Check console in Dev mode)', { type: 'success' });
      // Pass email to next page state so user doesn't have to retype
      navigate('/reset-password', { state: { email } }); 
    } catch (err) {
      add(err.userMessage || 'Failed to send OTP', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] p-4 font-sans text-[#F7F7FC] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-[#6558F5]/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#9B6DFF]/12 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-[#171A26]/90 backdrop-blur-3xl p-8 md:p-10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[#292D40]">
        <Link to="/login" className="inline-flex items-center gap-2 text-[#A5A9BB] hover:text-[#55E6FF] mb-6 text-sm font-medium transition">
          <FaArrowLeft /> Back to Login
        </Link>
        
        <h2 className="text-3xl font-bold font-display tracking-tight mb-2 text-[#F7F7FC]">Forgot Password?</h2>
        <p className="text-[#A5A9BB] text-sm mb-8">Enter your email to receive a secure reset authorization code.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-4 text-[#A5A9BB]" />
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-12 pr-4 py-3.5 bg-[#101321] border border-[#292D40] rounded-[14px] outline-none focus:border-[#6558F5] focus:ring-1 focus:ring-[#6558F5] text-[#F7F7FC] placeholder-[#A5A9BB]/60 text-sm transition"
            />
          </div>
          
          <button disabled={loading} className="w-full py-3.5 rounded-[14px] bg-[#6558F5] text-white font-semibold hover:bg-[#5548e6] transition shadow-lg shadow-[#6558F5]/35 hover:shadow-[0_0_24px_rgba(101,88,245,0.45)] text-sm cursor-pointer disabled:opacity-70">
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      </div>
    </div>
  );
}