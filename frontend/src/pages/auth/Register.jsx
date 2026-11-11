// frontend/src/pages/auth/Register.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { motion } from 'framer-motion';
import AppIcon from '../../components/ui/AppIcon';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { add: addToast } = useToast();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0B10] px-4 font-sans text-[#F7F7FC]">
      
      {/* Cinematic Ambient Background Mesh */}
      <div className="absolute top-[-15%] left-[-15%] w-[550px] h-[550px] rounded-full bg-[#6558F5]/18 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[650px] h-[650px] rounded-full bg-[#9B6DFF]/14 blur-[180px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#55E6FF]/08 blur-[160px] pointer-events-none" />

      <motion.div 
        initial={{ y: 24, opacity: 0, scale: 0.96 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-[#171A26]/90 backdrop-blur-3xl border border-[#292D40] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-3 drop-shadow-[0_0_20px_rgba(101,88,245,0.35)]">
             <AppIcon size={64} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#F7F7FC]">
            Join SocialVerse<span className="text-[#38BDF8]"> ∞</span>
          </h1>
          <p className="text-[11px] text-[#A5A9BB] font-sans tracking-[0.25em] uppercase mt-1 font-semibold">
            Beyond Social • Next-Gen Network
          </p>
        </div>

        <div className="space-y-5">
           <GoogleLoginButton />

           <div className="relative flex items-center py-1">
             <div className="flex-grow border-t border-[#292D40]"></div>
             <span className="flex-shrink-0 mx-3 text-[#A5A9BB] text-[10px] font-semibold uppercase tracking-wider">Or Register</span>
             <div className="flex-grow border-t border-[#292D40]"></div>
           </div>

           <form onSubmit={submit} className="space-y-4">
             <div className="relative group">
               <FaUser className="absolute left-4 top-4 text-[#A5A9BB] group-focus-within:text-[#55E6FF] transition-colors" />
               <input
                 type="text"
                 value={form.name}
                 onChange={e => setForm({...form, name: e.target.value})}
                 placeholder="Full Name"
                 required
                 className="w-full bg-[#101321] border border-[#292D40] rounded-[14px] pl-11 pr-4 py-3.5 focus:outline-none focus:border-[#6558F5] focus:ring-1 focus:ring-[#6558F5] text-[#F7F7FC] transition placeholder-[#A5A9BB]/60 text-sm"
               />
             </div>
             
             <div className="relative group">
               <FaEnvelope className="absolute left-4 top-4 text-[#A5A9BB] group-focus-within:text-[#55E6FF] transition-colors" />
               <input
                 type="email"
                 value={form.email}
                 onChange={e => setForm({...form, email: e.target.value})}
                 placeholder="Email Address"
                 required
                 className="w-full bg-[#101321] border border-[#292D40] rounded-[14px] pl-11 pr-4 py-3.5 focus:outline-none focus:border-[#6558F5] focus:ring-1 focus:ring-[#6558F5] text-[#F7F7FC] transition placeholder-[#A5A9BB]/60 text-sm"
               />
             </div>
             
             <div className="relative group">
               <FaLock className="absolute left-4 top-4 text-[#A5A9BB] group-focus-within:text-[#55E6FF] transition-colors" />
               <input
                 type={showPass ? "text" : "password"}
                 value={form.password}
                 onChange={e => setForm({...form, password: e.target.value})}
                 placeholder="Password"
                 required
                 className="w-full bg-[#101321] border border-[#292D40] rounded-[14px] pl-11 pr-11 py-3.5 focus:outline-none focus:border-[#6558F5] focus:ring-1 focus:ring-[#6558F5] text-[#F7F7FC] transition placeholder-[#A5A9BB]/60 text-sm"
               />
               <button
                 type="button"
                 onClick={() => setShowPass(!showPass)}
                 className="absolute right-3.5 top-3.5 text-[#A5A9BB] hover:text-[#55E6FF] transition-colors"
               >
                 {showPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
               </button>
             </div>

             <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-[14px] bg-[#6558F5] text-white font-semibold hover:bg-[#5548e6] active:scale-[0.99] transition shadow-lg shadow-[#6558F5]/35 hover:shadow-[0_0_24px_rgba(101,88,245,0.45)] flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? <Spinner className="border-current" /> : 'Create SocialVerse Account'}</span>
              </button>
           </form>

           <div className="text-center text-sm text-[#A5A9BB]">
             Already have an account? <Link to="/login" className="text-[#55E6FF] font-semibold hover:underline">Sign in</Link>
           </div>
        </div>
      </motion.div>
    </div>
  );
}