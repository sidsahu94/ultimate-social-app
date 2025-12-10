// frontend/src/pages/auth/Register.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { add: addToast } = useToast();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post('/auth/register', form);
      addToast('Registration successful! Please login.', { type: 'success', timeout: 4000 });
      setTimeout(() => nav('/login'), 1500);
    } catch (err) {
      setLoading(false);
      addToast(err.userMessage || 'Error creating account', { type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-3xl p-4">
      {/* Glass Container */}
      <div className="w-full max-w-md bg-white/80 dark:bg-black/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-2">Join SocialApp</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Create your space in the universe.</p>
        </div>

        <div className="space-y-4 mb-6">
          <GoogleLoginButton />

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Or Register</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <input
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Full Name"
              className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
              required
            />
            
            <input
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="Email Address"
              type="email"
              className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
              required
            />
            
            <input
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder="Password"
              type="password"
              className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
              required
            />

            <button 
              disabled={loading} 
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              {loading ? <Spinner /> : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;