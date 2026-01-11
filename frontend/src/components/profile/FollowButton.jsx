// frontend/src/components/profile/FollowButton.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';

const FollowButton = ({ userId, initialStatus, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const { add: addToast } = useToast();

  // Initialize state
  useEffect(() => {
    // If parent passed status, use it. Otherwise fetch.
    if (initialStatus !== undefined) {
      setIsFollowing(initialStatus);
    } else {
      checkStatus();
    }
  }, [userId, initialStatus]);

  const checkStatus = async () => {
    try {
      const res = await API.get(`/users/${userId}`);
      setIsFollowing(res.data.isFollowing);
    } catch (e) {
      // quiet fail
    }
  };

  const toggle = async (e) => {
    e.preventDefault(); // Stop link clicks if inside a card
    e.stopPropagation();
    
    if (loading) return;
    setLoading(true);

    try {
      const r = await API.post(`/users/${userId}/follow`);
      
      // Update state based on backend response
      const nowFollowing = r.data.following; // Backend returns { following: true/false }
      setIsFollowing(nowFollowing);
      
      if (nowFollowing) {
        addToast("Followed user", { type: 'success' });
      } else {
        addToast("Unfollowed user", { type: 'info' });
      }

      if (onChange) onChange();
    } catch (err) {
      console.error(err);
      addToast(err.userMessage || 'Action failed', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggle} 
      disabled={loading}
      className={`
        px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm
        ${isFollowing 
          ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 border border-transparent' 
          : 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-md'
        }
        ${loading ? 'opacity-70 cursor-wait' : ''}
      `}
    >
      {loading ? '...' : (isFollowing ? 'Following' : 'Follow')}
    </button>
  );
};

export default FollowButton;