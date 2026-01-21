// frontend/src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/slices/authSlice';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 
import AppIcon from '../../components/ui/AppIcon'; 
import API from '../../services/api'; // Ensure API is imported if used directly
import { setUser } from '../../redux/slices/authSlice'; // Import actions

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector(s => s.auth);
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const submit = async (e) => {
    e.preventDefault();
    try {
        const res = await API.post('/auth/login', form);
        
        if (res.data.requires2FA) {
            navigate('/verify-account', { 
                state: { email: res.data.email, isLogin: true } 
            });
            return;
        }

        const { token, refreshToken, user } = res.data.data || res.data; // Handle updated response structure
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('meId', user._id);
        
        dispatch(setUser(user));
        navigate(from, { replace: true });

    } catch (err) {
        alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-[-1]">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-electric-violet/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-electric-cyan/20 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card w-full max-w-md p-8 relative overflow-hidden z-10"
      >
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-electric-cyan via-electric-violet to-electric-pink" />

        <div className="text-center mb-8">
          <div className="inline-block mb-4 shadow-neon-cyan rounded-2xl">
             <AppIcon size={64} />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Enter the Nexus.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center font-bold"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-6">
           <GoogleLoginButton />

           <div className="relative flex items-center py-2">
             <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
             <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Or continue with</span>
             <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
           </div>

           <form onSubmit={submit} className="space-y-5">
             <div className="group">
               <input
                 className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all text-gray-900 dark:text-white placeholder-gray-400"
                 placeholder="Email address"
                 type="email"
                 value={form.email}
                 onChange={e => setForm({...form, email: e.target.value})}
                 required
               />
             </div>
             
             <div className="relative group">
               <input
                 className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all text-gray-900 dark:text-white placeholder-gray-400 pr-12"
                 placeholder="Password"
                 type={showPass ? "text" : "password"}
                 value={form.password}
                 onChange={e => setForm({...form, password: e.target.value})}
                 required
               />
               <button
                 type="button"
                 onClick={() => setShowPass(!showPass)}
                 className="absolute right-4 top-3.5 text-gray-400 hover:text-electric-cyan transition-colors"
               >
                 {showPass ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
               </button>
             </div>

             <div className="flex justify-end">
                 <Link 
                     to="/forgot-password" 
                     className="text-xs font-bold text-gray-500 hover:text-electric-cyan transition-colors"
                 >
                     Forgot Password?
                 </Link>
             </div>

             <button 
               disabled={loading} 
               className="btn-electric w-full flex justify-center items-center gap-2 h-12 text-lg shadow-lg"
             >
               {loading ? <Spinner className="border-black" /> : 'Sign In'}
             </button>
           </form>

           <div className="text-center text-sm text-gray-500 dark:text-gray-400">
             Don't have an account?{' '}
             <Link to="/register" className="text-electric-cyan font-bold hover:underline">
               Create one
             </Link>
           </div>
        </div>
      </motion.div>
    </div>
  );
}