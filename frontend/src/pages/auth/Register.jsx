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

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { add: addToast } = useToast();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post('/auth/register', form);
      addToast('OTP sent! Please verify your email.', { type: 'success' });
      // 🔥 FIX: Redirect to Verify Account page with email in state
      nav('/verify-account', { state: { email: form.email } });
    } catch (err) {
      setLoading(false);
      addToast(err.userMessage || 'Error creating account', { type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E0E5EC] dark:bg-[#1A1B1E] p-6 transition-colors duration-500">
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="neu-card w-full max-w-md relative overflow-hidden flex flex-col gap-6"
      >
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent shadow-neon-blue" />

        {/* Header Section */}
        <div className="text-center mt-4">
          <div className="inline-block p-4 rounded-[20px] shadow-neu-flat dark:shadow-neu-dark-flat mb-4 bg-[#E0E5EC] dark:bg-[#1A1B1E] border border-white/40 dark:border-white/5">
             <AppIcon size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
            JOIN US
          </h1>
          <p className="text-slate-500 text-sm font-medium">Create your space in the universe.</p>
        </div>

        {/* Google Login */}
        <div className="w-full">
           <GoogleLoginButton />
        </div>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Or Register</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1 relative">
            <input
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Full Name"
              className="neu-input pl-12"
              required
            />
            <FaUser className="absolute left-4 top-4 text-gray-400" />
          </div>
          
          <div className="space-y-1 relative">
            <input
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="Email Address"
              type="email"
              className="neu-input pl-12"
              required
            />
            <FaEnvelope className="absolute left-4 top-4 text-gray-400" />
          </div>
          
          <div className="space-y-1 relative">
            <input
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder="Password"
              type={showPass ? "text" : "password"}
              className="neu-input pl-12 pr-12"
              required
            />
            <FaLock className="absolute left-4 top-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-primary transition-colors cursor-pointer"
            >
              {showPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          <button 
            disabled={loading} 
            className="btn-neon w-full flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner /> : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:text-secondary transition">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;