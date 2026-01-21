// frontend/src/components/auth/GoogleLoginButton.jsx
import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FaGoogle } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/authSlice'; 
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';

export default function GoogleLoginButton() {
  const dispatch = useDispatch();
  const { add: addToast } = useToast();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await API.post('/auth/google-login', { 
            token: tokenResponse.access_token 
        });
        
        // 🔥 FIX: Handle unified response format (res.data.data) or fallback
        const payload = res.data.data || res.data;
        const { token, refreshToken, user } = payload;
        
        if (!user || !user._id) {
            throw new Error("Invalid user data received");
        }
        
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('meId', user._id);
        
        dispatch(setUser(user));
        
        addToast(`Welcome back, ${user.name}!`, { type: 'success' });
        
        // Hard redirect to clear any stale state
        setTimeout(() => {
            window.location.href = '/'; 
        }, 500);

      } catch (error) {
        console.error('Google Login Error', error);
        addToast('Login failed. Please try again.', { type: 'error' });
      }
    },
    onError: () => {
        addToast('Google popup closed or failed.', { type: 'error' });
    }
  });

  return (
    <button
      type="button" 
      onClick={() => login()}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-[20px] bg-[#E0E5EC] dark:bg-[#1A1B1E] shadow-neu-flat dark:shadow-neu-dark-flat hover:shadow-neu-pressed dark:hover:shadow-neu-dark-pressed text-slate-700 dark:text-slate-200 transition-all active:scale-95 border border-white/40 dark:border-white/5 group"
    >
      <FaGoogle className="text-red-500 group-hover:scale-110 transition-transform drop-shadow-md" />
      <span className="font-bold text-sm">Continue with Google</span>
    </button>
  );
}