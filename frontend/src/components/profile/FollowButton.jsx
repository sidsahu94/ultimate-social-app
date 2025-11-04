// frontend/src/components/profile/FollowButton.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const FollowButton = ({ userId, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // best-effort: check if current user follows this user by fetching /users/:id (backend returns followers)
    const check = async () => {
      try {
        const res = await API.get(`/users/${userId}`);
        const followers = res.data.followers || [];
        const meId = (localStorage.getItem('meId') || null); // optionally set meId on login
        // fallback: if meId not available, server-side 'isFollowing' would be best.
        setIsFollowing(!!(followers.find(f => f === meId)));
      } catch (err) {
        // ignore
      }
    };
    check();
  }, [userId]);

  const toggle = async () => {
    try {
      setLoading(true);
      await API.post(`/users/${userId}/follow`);
      setIsFollowing(s => !s);
      onChange && onChange();
    } catch (err) {
      console.error('follow err', err);
      alert(err.response?.data?.message || 'Failed to toggle follow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={toggle} disabled={loading} className={`px-4 py-2 rounded ${isFollowing ? 'bg-white border' : 'bg-indigo-600 text-white'}`}>
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
};

export default FollowButton;
