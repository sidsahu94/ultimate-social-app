import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FaGoogle } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/authSlice'; // Use the action from slice
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';

export default function GoogleLoginButton() {
  const dispatch = useDispatch();
  const { add: addToast } = useToast();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // We use the 'token' key to match the updated backend controller
        const res = await API.post('/auth/google-login', { 
            token: tokenResponse.access_token 
        });
        
        const { token, user } = res.data;
        
        // Save to local storage
        localStorage.setItem('token', token);
        localStorage.setItem('meId', user._id);
        
        // Update Redux
        dispatch(setUser(user));
        
        addToast(`Welcome back, ${user.name}!`, { type: 'success' });
        
        // Optional: Force a small delay or reload to ensure socket/state sync
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
      type="button" // Important so it doesn't submit parent forms
      onClick={() => login()}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all group"
    >
      <FaGoogle className="text-red-500 group-hover:scale-110 transition-transform" />
      <span className="font-semibold text-gray-700 dark:text-gray-200">Continue with Google</span>
    </button>
  );
}