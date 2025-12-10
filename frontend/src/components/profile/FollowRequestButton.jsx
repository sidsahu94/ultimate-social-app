// frontend/src/components/profile/FollowRequestButton.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';

export default function FollowRequestButton({ userId, onChange }) {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await API.get(`/users/${userId}`);
        if (mounted) setStatus(r.data.isFollowing ? 'following' : (r.data.isMe ? 'me' : 'not_following'));
      } catch (e) {}
    })();
    return () => mounted = false;
  }, [userId]);

  const toggle = async () => {
    try {
      const r = await API.post(`/users/${userId}/follow`);
      setStatus(r.data.following ? 'following' : 'not_following');
      onChange && onChange();
    } catch (e) { alert('Failed'); }
  };

  return (
    <button onClick={toggle} className={`px-4 py-2 rounded ${status === 'following' ? 'bg-white border' : 'bg-indigo-600 text-white'}`}>
      {status === 'me' ? 'You' : (status === 'following' ? 'Following' : 'Follow')}
    </button>
  );
}
