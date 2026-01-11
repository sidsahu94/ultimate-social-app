// frontend/src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/slices/authSlice';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { motion } from 'framer-motion';
// 🔥 FIX: Added FaGoogle to imports here to prevent reference errors if used directly
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa'; 
import AppIcon from '../../components/ui/AppIcon'; 

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector(s => s.auth);
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  // Deep link redirect logic
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const submit = async (e) => {
    e.preventDefault();
    // We manually dispatch API call here instead of Redux thunk 
    // to handle the special 2FA flow logic locally first
    try {
        const res = await API.post('/auth/login', form);
        
        // 🔥 NEW: Check for 2FA
        if (res.data.requires2FA) {
            navigate('/verify-account', { 
                state: { email: res.data.email, isLogin: true } // Pass flag
            });
            return;
        }

        // Normal Success
        const { token, refreshToken, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('meId', user._id);
        dispatch(setUser(user));
        navigate(from, { replace: true });

    } catch (err) {
        // Handle error manually since we skipped thunk
        const msg = err.response?.data?.message || 'Login failed';
        // You might need a local error state or dispatch a failure action to show it
        alert(msg); // Or set local error state
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary-glow to-transparent shadow-neon-cyan" />

        {/* Header Section */}
        <div className="text-center mt-4">
          <div className="inline-block p-4 rounded-[20px] shadow-neu-flat dark:shadow-neu-dark-flat mb-4 bg-[#E0E5EC] dark:bg-[#1A1B1E] border border-white/40 dark:border-white/5">
             <AppIcon size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
            WELCOME BACK
          </h1>
          <p className="text-slate-500 text-sm font-medium">Log in to the future.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm text-center font-bold animate-pulse">
            {error}
          </div>
        )}

        {/* Google Login (Styled) */}
        <div className="w-full">
           <GoogleLoginButton />
        </div>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Or Email</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1">
            <input
              className="neu-input"
              placeholder="Email address"
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          </div>
          
          <div className="space-y-1 relative">
            <input
              className="neu-input pr-12"
              placeholder="Password"
              type={showPass ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-primary transition-colors cursor-pointer"
            >
              {showPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          <div className="flex justify-end">
              <Link 
                  to="/forgot-password" 
                  className="text-xs font-bold text-primary hover:text-secondary transition"
              >
                  Forgot Password?
              </Link>
          </div>

          <button 
            disabled={loading} 
            className="btn-neon w-full flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner /> : 'ENTER SYSTEM'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          New here? <Link to="/register" className="text-primary font-bold hover:text-secondary transition">Create Account</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;