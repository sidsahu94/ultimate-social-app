import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/slices/authSlice';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector(s => s.auth);
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  // 🔥 FIX: Deep Linking Logic
  // If the user was redirected here from a protected route, 'from' will hold that path.
  // Otherwise, default to '/' (Home).
  const from = location.state?.from?.pathname || "/";

  // Watch for successful login (user state update) and redirect
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const submit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black transition-all duration-1000 p-4">
      
      {/* Glass Card */}
      <div className="w-full max-w-md bg-white/10 dark:bg-black/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-300 text-sm">Enter the ultimate social experience</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 mb-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-5">
          
          {/* Google Login Component */}
          <div className="w-full">
             <GoogleLoginButton />
          </div>
          
          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase font-bold tracking-wider">Or Email</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <input
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-gray-500 transition hover:bg-white/10"
                placeholder="Email address"
                type="email"
                name="email"
                autoComplete="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
            </div>
            
            {/* Password Input with Toggle */}
            <div className="relative">
              <input
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-gray-500 transition hover:bg-white/10 pr-12"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
                <Link 
                    to="/forgot-password" 
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                    Forgot Password?
                </Link>
            </div>

            <button 
              disabled={loading} 
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 flex justify-center items-center gap-2"
            >
              {loading ? <Spinner /> : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;