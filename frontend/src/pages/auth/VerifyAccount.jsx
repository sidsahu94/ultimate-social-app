// frontend/src/pages/auth/VerifyAccount.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/ToastProvider';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/authSlice';
import { FaKey, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function VerifyAccount() {
  const { state } = useLocation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { add } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const email = state?.email;
  const isLogin = state?.isLogin; // Flag to differentiate flow text

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return add("Please enter a 6-digit code", { type: "info" });
    
    setLoading(true);
    try {
      // Calls the unified backend endpoint which handles both verification and 2FA
      const res = await API.post('/auth/verify-otp', { email, otp });
      
      const { token, refreshToken, user } = res.data;
      
      // Store Session
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('meId', user._id);
      
      // Update State
      dispatch(setUser(user));
      
      add(isLogin ? 'Welcome back!' : 'Account verified! Welcome.', { type: 'success' });
      navigate('/', { replace: true });
      
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      add(msg, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#E0E5EC] dark:bg-[#1A1B1E] text-center p-4">
              <div className="neu-card p-8">
                  <p className="text-gray-500 mb-4">No email provided. Session expired.</p>
                  <Link to="/login" className="btn-neon">Go to Login</Link>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E0E5EC] dark:bg-[#1A1B1E] p-4 transition-colors duration-500">
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="neu-card w-full max-w-md p-8 relative overflow-hidden"
      >
        <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-full bg-[#E0E5EC] dark:bg-[#1A1B1E] shadow-neu-flat dark:shadow-neu-dark-flat text-primary mb-4">
                <FaShieldAlt size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {isLogin ? "Two-Factor Auth" : "Verify Account"}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
                Enter the 6-digit code sent to <br/> 
                <span className="font-bold text-primary">{email}</span>
            </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="relative group">
            <FaKey className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              inputMode="numeric"
              required
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="neu-input pl-12 text-center font-mono text-2xl tracking-[0.5em] font-bold text-slate-700 dark:text-slate-200"
              maxLength={6}
              autoFocus
            />
          </div>
          
          <button 
            disabled={loading} 
            className="btn-neon w-full flex justify-center items-center py-3 text-lg"
          >
            {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <Link to="/login" className="text-xs font-bold text-gray-400 hover:text-primary transition">
                Back to Login
            </Link>
        </div>
      </motion.div>
    </div>
  );
}