// frontend/src/pages/profile/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import PostGrid from '../../components/profile/PostGrid';
import FollowButton from '../../components/profile/FollowButton';
import ProfileEditModal from '../../components/profile/ProfileEditModal';
import CreatePostModal from '../../components/posts/CreatePostModal';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const load = async () => {
    try {
      const resU = await API.get(`/users/${id}`);
      setUser(resU.data);
    } catch (err) {
      console.error('load user err', err);
    }
    try {
      const resP = await API.get(`/posts/user/${id}`);
      setPosts(resP.data || []);
    } catch (err) {
      console.error('load posts err', err);
    }
  };

useEffect(() => {
  load();
  const handleOpen = () => setOpenCreate(true);
  window.addEventListener('openCreatePost', handleOpen);
  return () => window.removeEventListener('openCreatePost', handleOpen);
}, [id]);


  if (!user) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Cover */}
      <div className="profile-hero mb-6 rounded-lg overflow-hidden">
        <img src={user.coverPhoto || '/default-cover.jpg'} alt="cover" className="w-full h-40 object-cover" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative">
          <img src={user.avatar || '/default-avatar.png'} alt="avatar" className="w-40 h-40 rounded-full object-cover border-4 border-white shadow" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <div className="text-sm text-gray-500">@{(user.email || '').split('@')[0]}</div>

            <div className="ml-auto flex items-center gap-3">
              <button onClick={() => setOpenCreate(true)} className="px-4 py-2 rounded border bg-white hover:shadow">Create</button>

              {/* If this is your profile, show edit; else follow & message */}
              {user.isMe ? (
                <button onClick={() => setEditing(true)} className="px-4 py-2 rounded border bg-white hover:shadow">Edit profile</button>
              ) : (
                <>
                  <FollowButton userId={id} onChange={load} />
                  <button onClick={() => nav('/chat')} className="px-4 py-2 rounded border bg-white">Message</button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 mb-2">
            <div className="text-sm"><span className="font-semibold">{posts?.length ?? 0}</span> posts</div>
            <div className="text-sm"><span className="font-semibold">{user.followers?.length ?? 0}</span> followers</div>
            <div className="text-sm"><span className="font-semibold">{user.following?.length ?? 0}</span> following</div>
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300">
            <div className="font-medium">{user.bio}</div>
            {user.website && <a className="text-indigo-600" href={user.website} target="_blank" rel="noreferrer">{user.website}</a>}
          </div>
        </div>
      </div>

      {/* Story Highlights (simple) */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto">
        {/* example highlights */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <img src="/default-avatar.png" alt="hl" className="w-full h-full object-cover" />
            </div>
            <div className="text-xs mt-1">Highlights</div>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="mb-8">
        <PostGrid posts={posts} />
      </div>

      <ProfileEditModal isOpen={editing} onClose={() => { setEditing(false); load(); }} user={user} />
      <CreatePostModal isOpen={openCreate} onClose={() => { setOpenCreate(false); load(); }} onPosted={() => load()} />
    </div>
  );
};

export default ProfilePage;
