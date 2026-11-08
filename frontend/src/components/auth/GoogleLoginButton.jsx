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
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-[#070B14]/90 hover:bg-[#0A111E] text-[#F7F7FC] transition-all active:scale-95 border border-white/10 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] group"
    >
      <FaGoogle className="text-[#FF6B8A] group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(255,107,138,0.5)]" />
      <span className="font-semibold text-sm tracking-wide text-[#CBD5E1]">Continue with Google</span>
    </button>
  );
}
