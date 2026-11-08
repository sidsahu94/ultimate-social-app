// frontend/src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaShieldAlt, FaKey } from 'react-icons/fa';
import AppIcon from '../../components/ui/AppIcon';
import API from '../../services/api';
import { setUser } from '../../redux/slices/authSlice';
import { useToast } from '../../components/ui/ToastProvider';
import AdminCyberGateway from '../../components/common/AdminCyberGateway';
import { playCyberClick } from '../../utils/soundEffects';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((s) => s.auth);
  const { add: addToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Global secret shortcut listener: Ctrl + Shift + A or Ctrl + Alt + A
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
          (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        playCyberClick();
        setShowAdminPortal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fillDemo = (email, password) => {
    playCyberClick();
    setForm({ email, password });
    addToast(`Filled creator credentials for ${email}`, { type: 'info' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await API.post('/auth/login', form);
      const requires2FA = res.data?.requires2FA || res.data?.data?.requires2FA;
      const targetEmail = res.data?.email || res.data?.data?.email || form.email;

      if (requires2FA) {
        navigate('/verify-account', {
          state: { email: targetEmail, isLogin: true }
        });
        return;
      }

      const payload = res.data?.data || res.data;
      const { token, refreshToken, user: authUser } = payload || {};
      if (token) localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (authUser?._id) localStorage.setItem('meId', authUser._id);

      if (authUser) dispatch(setUser(authUser));
      addToast('Signed in successfully! Welcome back.', { type: 'success' });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      addToast(msg, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#04070D] px-4 font-sans text-[#F7F7FC]">
      {/* Specular Ambient Glow Mesh */}
      <div className="pointer-events-none absolute top-[-15%] left-[-10%] h-[550px] w-[550px] rounded-full bg-[#1D4ED8]/18 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#052E24]/16 blur-[180px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-[#00F2FE]/08 blur-[170px]" />

      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-[28px] border border-[rgba(226,232,240,0.16)] bg-[#070B14]/90 p-8 md:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-3xl ring-1 ring-white/10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-3 drop-shadow-[0_0_25px_rgba(29,78,216,0.4)]">
            <AppIcon size={64} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#F7F7FC]">
            Welcome to SocialVerse<span className="text-[#38BDF8]"> ∞</span>
          </h1>
          <p className="text-[11px] text-[#CBD5E1]/80 font-sans tracking-[0.25em] uppercase mt-1.5 font-semibold">
            BEYOND SOCIAL &bull; NEXT-GEN NETWORK
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3 bg-[#052E24]/20 border border-[#10B981]/40 rounded-[14px] text-rose-300 text-sm text-center font-medium shadow-inner"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-5">
          {/* Public 1-Click Creator Demo Experience */}
          <div className="rounded-[18px] border border-white/10 bg-[#04070D]/80 p-3.5 text-center shadow-silverGlass">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-[#CBD5E1]/70 mb-2">
              ⚡ Instant Creator Access
            </span>
            <button
              type="button"
              onClick={() => fillDemo('user@socialapp.com', 'password123')}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-gradient-to-r from-[#1D4ED8]/20 via-[#052E24]/15 to-[#D4AF37]/20 py-2.5 text-xs font-bold text-[#F8FAFC] shadow-sm transition hover:border-[#00F2FE] hover:shadow-[0_0_20px_rgba(100,223,223,0.3)] active:scale-98"
            >
              <span>👤 Elena Vance (Digital Creator)</span>
            </button>
          </div>

          <GoogleLoginButton />

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink-0 mx-3 text-[#CBD5E1]/60 text-[10px] font-semibold uppercase tracking-wider">
              Or continue with email
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="relative group">
              <input
                type="email"
                placeholder="Email Address"
                autoComplete="username"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-[#04070D] border border-white/15 rounded-[14px] px-4 py-3.5 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] text-[#F7F7FC] transition placeholder-[#CBD5E1]/40 text-sm"
              />
            </div>

            <div className="relative group">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full bg-[#04070D] border border-white/15 rounded-[14px] pl-4 pr-11 py-3.5 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] text-[#F7F7FC] transition placeholder-[#CBD5E1]/40 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-3.5 text-[#CBD5E1]/60 hover:text-[#00F2FE] transition-colors"
              >
                {showPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[#CBD5E1]/70 hover:text-[#00F2FE] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full py-3.5 px-6 rounded-[14px] bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white font-bold hover:opacity-95 active:scale-[0.99] transition shadow-[0_4px_25px_rgba(29,78,216,0.35)] flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>
                {loading || isSubmitting ? (
                  <Spinner className="border-current" />
                ) : (
                  'Sign In to Socialo'
                )}
              </span>
            </button>
          </form>

          <div className="text-center text-sm text-[#CBD5E1]/70">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#00F2FE] font-semibold hover:underline">
              Create one
            </Link>
          </div>

          {/* Concealed High-Tech Architect Enclave Access Trigger */}
          <div className="pt-3 border-t border-white/5 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => {
                playCyberClick();
                setShowAdminPortal(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-widest text-[#CBD5E1]/50 hover:text-[#00F2FE] hover:bg-white/5 transition-all group"
            >
              <FaShieldAlt className="text-[#10B981] group-hover:text-[#00F2FE] transition-colors" />
              <span>Architect Gateway [Ctrl+Shift+A]</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Cybernetic High-Tech Admin Gateway Modal */}
      <AdminCyberGateway
        isOpen={showAdminPortal}
        onClose={() => setShowAdminPortal(false)}
      />
    </div>
  );
}
