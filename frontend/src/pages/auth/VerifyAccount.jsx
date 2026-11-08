// frontend/src/pages/auth/VerifyAccount.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/ui/ToastProvider';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/authSlice';
import { FaKey, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function VerifyAccount() {
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const { add } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get email/code from URL (Magic Link) or Navigation State (Manual Entry)
  const email = searchParams.get('email') || state?.email;
  const urlCode = searchParams.get('code');
  const isLogin = state?.isLogin;

  const [otp, setOtp] = useState(urlCode || '');
  const [loading, setLoading] = useState(false);

  // Auto-submit if opened via Magic Link
  useEffect(() => {
    if (urlCode && urlCode.length === 6 && email) {
        setOtp(urlCode);
        handleVerify(null, urlCode); // Auto trigger
    }
  }, [urlCode, email]);

  const handleVerify = async (e, codeOverride) => {
    e?.preventDefault();
    const codeToSubmit = codeOverride || otp;
    
    if (!codeToSubmit || codeToSubmit.length !== 6) {
        return add("Please enter a 6-digit code", { type: "info" });
    }
    
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email, otp: codeToSubmit });
      
      // Handle the response (unified format)
      const payload = res.data.data || res.data;
      const { token, refreshToken, user } = payload;
      
      if (!token || !user) throw new Error("Invalid response from server");

      // 1. Store Session
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('meId', user._id);
      
      // 2. Update Redux State
      dispatch(setUser(user));
      
      add(isLogin ? 'Welcome back!' : 'Account verified! Welcome.', { type: 'success' });
      
      // 3. Force Redirect to Home
      // Using window.location to ensure a full refresh and socket reconnection
      setTimeout(() => {
          window.location.href = '/'; 
      }, 500);
      
    } catch (err) {
      console.error("Verification error:", err);
      const msg = err.response?.data?.message || 'Verification failed';
      add(msg, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] text-center p-4">
              <div className="bg-[#171A26] border border-[#292D40] rounded-[24px] p-8 max-w-sm">
                  <p className="text-[#A5A9BB] mb-4">No email provided. Session expired.</p>
                  <Link to="/login" className="btn-primary">Go to Login</Link>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] p-4 font-sans text-[#F7F7FC] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-[#6558F5]/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#55E6FF]/10 blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-[#171A26]/90 backdrop-blur-3xl border border-[#292D40] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8 md:p-10 text-center"
      >
        <div className="mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-[#101321] border border-[#292D40] text-[#55E6FF] shadow-[0_0_25px_rgba(85,230,255,0.25)] mb-4">
                <FaShieldAlt size={32} />
            </div>
            <h2 className="text-3xl font-bold font-display tracking-tight text-[#F7F7FC]">
                {isLogin ? "Two-Factor Auth" : "Verify Account"}
            </h2>
            <p className="text-[#A5A9BB] text-sm mt-2">
                Enter the 6-digit code sent to <br/> 
                <span className="font-semibold text-[#55E6FF]">{email}</span>
            </p>
        </div>

        <form onSubmit={(e) => handleVerify(e)} className="space-y-6">
          <div className="relative group">
            <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A5A9BB] group-focus-within:text-[#55E6FF] transition-colors" />
            <input 
              type="text" 
              inputMode="numeric"
              required
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="w-full bg-[#101321] border border-[#292D40] rounded-[16px] pl-12 pr-4 py-4 text-center font-mono text-2xl tracking-[0.45em] font-bold text-[#F7F7FC] focus:outline-none focus:border-[#6558F5] focus:ring-1 focus:ring-[#6558F5] transition"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
            />
          </div>
          
          <button 
            disabled={loading} 
            className="w-full py-4 rounded-[14px] bg-[#6558F5] text-white font-semibold hover:bg-[#5548e6] transition shadow-lg shadow-[#6558F5]/35 hover:shadow-[0_0_24px_rgba(101,88,245,0.45)] text-base flex justify-center items-center cursor-pointer disabled:opacity-70"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <Link to="/login" className="text-xs font-semibold text-[#A5A9BB] hover:text-[#55E6FF] transition">
                Back to Login
            </Link>
        </div>
      </motion.div>
    </div>
  );
}