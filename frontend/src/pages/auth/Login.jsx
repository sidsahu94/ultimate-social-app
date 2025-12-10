// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/slices/authSlice';
import { Link, Navigate } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton'; // Ensure this component exists

const Login = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  if (user) return <Navigate to="/" />;

  const submit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black transition-all duration-1000">
      
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
                autoComplete="email" /* Fixes Autocomplete Warning */
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
            </div>
            <div>
              <input
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-gray-500 transition hover:bg-white/10"
                placeholder="Password"
                type="password"
                name="password"
                autoComplete="current-password" /* Fixes Autocomplete Warning */
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
              />
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