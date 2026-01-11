// frontend/src/pages/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/ToastProvider';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { add } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/request-reset', { email });
      add('OTP sent to your email (Check console in Dev mode)', { type: 'success' });
      // Pass email to next page state so user doesn't have to retype
      navigate('/reset-password', { state: { email } }); 
    } catch (err) {
      add(err.userMessage || 'Failed to send OTP', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border dark:border-gray-800">
        <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-indigo-500 mb-6 transition">
          <FaArrowLeft /> Back to Login
        </Link>
        
        <h2 className="text-3xl font-black mb-2 dark:text-white">Forgot Password?</h2>
        <p className="text-gray-500 mb-8">Enter your email to receive a reset code.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-4 text-gray-400" />
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-12 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition"
            />
          </div>
          
          <button disabled={loading} className="w-full btn-primary py-3 rounded-xl shadow-lg shadow-indigo-500/30">
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      </div>
    </div>
  );
}