// frontend/src/pages/auth/Register.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { motion } from 'framer-motion';
import AppIcon from '../../components/ui/AppIcon';
import { FaUser, FaAt, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function Register() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Username live availability
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking' | 'available' | 'taken' | 'too_short' | null
  const [usernameMessage, setUsernameMessage] = useState('');

  // Password strength
  const [strengthScore, setStrengthScore] = useState(0);

  const { add: addToast } = useToast();
  const nav = useNavigate();

  // Debounced Username Availability Checker
  useEffect(() => {
    const raw = form.username.trim().toLowerCase();
    if (!raw) {
      setUsernameStatus(null);
      setUsernameMessage('');
      return;
    }

    if (raw.length < 3) {
      setUsernameStatus('too_short');
      setUsernameMessage('At least 3 characters');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await API.get(`/auth/check-username?username=${encodeURIComponent(raw)}`);
        if (res.data?.available) {
          setUsernameStatus('available');
          setUsernameMessage(`@${raw} is available!`);
        } else {
          setUsernameStatus('taken');
          setUsernameMessage(`@${raw} is already taken`);
        }
      } catch (err) {
        setUsernameStatus(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.username]);

  // Compute Password Strength
  useEffect(() => {
    const pass = form.password;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    setStrengthScore(score);
  }, [form.password]);

  const submit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      addToast('Please accept the Terms of Service to proceed', { type: 'error' });
      return;
    }
    if (usernameStatus === 'taken') {
      addToast('Please choose an available username', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/register', form);
      addToast('Account created! Please verify your email.', { type: 'success' });
      nav('/verify-account', { state: { email: form.email } });
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0B10] px-4 py-8 font-sans text-[#F7F7FC]">
      {/* Cinematic Ambient Background Mesh */}
      <div className="absolute top-[-15%] left-[-15%] w-[550px] h-[550px] rounded-full bg-[#1D4ED8]/18 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[650px] h-[650px] rounded-full bg-[#0F766E]/14 blur-[180px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#00F2FE]/08 blur-[160px] pointer-events-none" />

      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-[#171A26]/90 backdrop-blur-3xl border border-[#292D40] rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-7 md:p-9"
      >
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3 drop-shadow-[0_0_20px_rgba(0,242,254,0.35)]">
            <AppIcon size={60} />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight text-[#F7F7FC]">
            Join SocialVerse<span className="text-[#00F2FE]"> ∞</span>
          </h1>
          <p className="text-[11px] text-[#A5A9BB] font-sans tracking-[0.2em] uppercase mt-1 font-semibold">
            Beyond Social • Next-Gen Network
          </p>
        </div>

        <div className="space-y-4">
          <GoogleLoginButton />

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-[#292D40]"></div>
            <span className="flex-shrink-0 mx-3 text-[#A5A9BB] text-[10px] font-semibold uppercase tracking-wider">
              Or Register With Email
            </span>
            <div className="flex-grow border-t border-[#292D40]"></div>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {/* Full Name */}
            <div className="relative group">
              <FaUser className="absolute left-4 top-3.5 text-[#A5A9BB] group-focus-within:text-[#00F2FE] transition-colors" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full Name"
                required
                className="w-full bg-[#101321] border border-[#292D40] rounded-[14px] pl-11 pr-4 py-3 focus:outline-none focus:border-[#00F2FE] text-[#F7F7FC] transition placeholder-[#A5A9BB]/60 text-sm"
              />
            </div>

            {/* Username with Live Availability Indicator */}
            <div className="relative group">
              <FaAt className="absolute left-4 top-3.5 text-[#A5A9BB] group-focus-within:text-[#00F2FE] transition-colors" />
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') })
                }
                placeholder="Unique Username"
                required
                className={`w-full bg-[#101321] border rounded-[14px] pl-11 pr-10 py-3 focus:outline-none transition placeholder-[#A5A9BB]/60 text-sm ${
                  usernameStatus === 'available'
                    ? 'border-emerald-500 focus:border-emerald-500'
                    : usernameStatus === 'taken'
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#292D40] focus:border-[#00F2FE]'
                }`}
              />
              <div className="absolute right-3.5 top-3.5">
                {usernameStatus === 'checking' && <Spinner className="w-4 h-4 text-[#00F2FE]" />}
                {usernameStatus === 'available' && <FaCheckCircle className="text-emerald-400" size={16} />}
                {usernameStatus === 'taken' && <FaTimesCircle className="text-red-400" size={16} />}
              </div>
            </div>
            {usernameMessage && (
              <p
                className={`text-[11px] px-1 font-medium ${
                  usernameStatus === 'available' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {usernameMessage}
              </p>
            )}

            {/* Email Address */}
            <div className="relative group">
              <FaEnvelope className="absolute left-4 top-3.5 text-[#A5A9BB] group-focus-within:text-[#00F2FE] transition-colors" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email Address"
                required
                className="w-full bg-[#101321] border border-[#292D40] rounded-[14px] pl-11 pr-4 py-3 focus:outline-none focus:border-[#00F2FE] text-[#F7F7FC] transition placeholder-[#A5A9BB]/60 text-sm"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <FaLock className="absolute left-4 top-3.5 text-[#A5A9BB] group-focus-within:text-[#00F2FE] transition-colors" />
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password (Min 8 chars, 1 uppercase, 1 number)"
                required
                className="w-full bg-[#101321] border border-[#292D40] rounded-[14px] pl-11 pr-11 py-3 focus:outline-none focus:border-[#00F2FE] text-[#F7F7FC] transition placeholder-[#A5A9BB]/60 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-3.5 text-[#A5A9BB] hover:text-[#00F2FE] transition-colors"
              >
                {showPass ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {form.password && (
              <div className="space-y-1 px-1">
                <div className="flex justify-between items-center text-[10px] text-[#A5A9BB]">
                  <span>Password Strength</span>
                  <span className="font-semibold">{strengthLabels[strengthScore - 1] || 'Weak'}</span>
                </div>
                <div className="flex gap-1 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-full flex-1 transition-all duration-300 ${
                        level <= strengthScore ? strengthColors[strengthScore - 1] : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Terms and Conditions Checkbox */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-white/20 text-[#00F2FE] focus:ring-0 bg-[#101321]"
              />
              <span className="text-[11px] text-[#A5A9BB] leading-tight">
                I agree to the SocialVerse{' '}
                <Link to="/support" className="text-[#00F2FE] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/support" className="text-[#00F2FE] hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || (usernameStatus && usernameStatus !== 'available') || !agreeTerms}
              className="w-full py-3.5 px-6 rounded-[14px] bg-gradient-to-r from-[#1D4ED8] via-[#0F766E] to-[#D4AF37] text-white font-bold hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#1D4ED8]/30 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{loading ? <Spinner className="border-current" /> : 'Create SocialVerse Account'}</span>
            </button>
          </form>

          <div className="text-center text-sm text-[#A5A9BB] pt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00F2FE] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
