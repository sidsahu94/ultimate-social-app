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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-[-1]">
        <div className="absolute top-[10%] right-[20%] w-[500px] h-[500px] bg-electric-pink/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] bg-electric-blue/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        className="glass-card w-full max-w-md p-8 relative overflow-hidden z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-electric-pink via-electric-violet to-electric-cyan" />

        <div className="text-center mb-8">
          <div className="inline-block mb-4">
             <AppIcon size={56} />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Join the Network
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Begin your journey today.
          </p>
        </div>

        <div className="space-y-6">
           <GoogleLoginButton />

           <div className="relative flex items-center py-2">
             <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
             <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Or Register</span>
             <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
           </div>

           <form onSubmit={submit} className="space-y-4">
             <div className="relative group">
               <FaUser className="absolute left-4 top-4 text-gray-400 group-focus-within:text-electric-cyan transition-colors" />
               <input
                 value={form.name}
                 onChange={e => setForm({...form, name: e.target.value})}
                 placeholder="Full Name"
                 className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all dark:text-white"
                 required
               />
             </div>
             
             <div className="relative group">
               <FaEnvelope className="absolute left-4 top-4 text-gray-400 group-focus-within:text-electric-cyan transition-colors" />
               <input
                 value={form.email}
                 onChange={e => setForm({...form, email: e.target.value})}
                 placeholder="Email Address"
                 type="email"
                 className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all dark:text-white"
                 required
               />
             </div>
             
             <div className="relative group">
               <FaLock className="absolute left-4 top-4 text-gray-400 group-focus-within:text-electric-cyan transition-colors" />
               <input
                 value={form.password}
                 onChange={e => setForm({...form, password: e.target.value})}
                 placeholder="Password"
                 type={showPass ? "text" : "password"}
                 className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-12 py-3 outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all dark:text-white"
                 required
               />
               <button
                 type="button"
                 onClick={() => setShowPass(!showPass)}
                 className="absolute right-4 top-3.5 text-gray-400 hover:text-electric-cyan transition-colors"
               >
                 {showPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
               </button>
             </div>

             <button 
               disabled={loading} 
               className="btn-electric w-full flex justify-center items-center gap-2 h-12 text-lg shadow-lg mt-2"
             >
               {loading ? <Spinner className="border-black" /> : 'Create Account'}
             </button>
           </form>

           <div className="text-center text-sm text-gray-500 dark:text-gray-400">
             Already have an account? <Link to="/login" className="text-electric-cyan font-bold hover:underline">Sign in</Link>
           </div>
        </div>
      </motion.div>
    </div>
  );
}