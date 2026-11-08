// frontend/src/components/profile/FollowButton.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';

const FollowButton = ({ userId, initialStatus, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const { add: addToast } = useToast();

  useEffect(() => {
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
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    setLoading(true);

    try {
      const r = await API.post(`/users/${userId}/follow`);
      const nowFollowing = r.data.following;
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
        px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 shadow-sm
        ${isFollowing 
          ? 'bg-[#0A111E] text-[#CBD5E1] border border-white/10 hover:border-[#052E24]/40 hover:bg-[#052E24]/20 hover:text-[#FF6B8A]' 
          : 'bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white hover:opacity-90 shadow-md shadow-blue-900/30 border border-white/10'
        }
        ${loading ? 'opacity-70 cursor-wait' : ''}
      `}
    >
      {loading ? '...' : (isFollowing ? 'Following' : 'Follow')}
    </button>
  );
};

export default FollowButton;
