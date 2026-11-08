// frontend/src/pages/stories/StoriesPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaPlus, FaClock, FaImage, FaStar } from 'react-icons/fa';
import API from '../../services/api';
import UserAvatar from '../../components/ui/UserAvatar';
import StoryEditor from '../../components/stories/StoryEditor';
import StoryViewer from '../../components/stories/StoryViewer';
import Spinner from '../../components/common/Spinner';
import { getImageUrl } from '../../utils/imageUtils';

const DEMO_STORIES = [
  {
    _id: 'story_demo_1',
    user: { _id: 'demo_user_1', name: 'Elena Rostova', username: 'elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
    mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    caption: 'Golden hour reflections by the Mediterranean 🌅✨',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    privacy: 'close_friends',
    viewersCount: 28,
    reactionsCount: 14
  },
  {
    _id: 'story_demo_2',
    user: { _id: 'demo_user_2', name: 'Marcus Thorne', username: 'marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
    caption: 'Midnight neon rehearsal in London ⚡🎧',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    privacy: 'public',
    viewersCount: 42,
    reactionsCount: 19
  },
  {
    _id: 'story_demo_3',
    user: { _id: 'demo_user_3', name: 'Aria Chen', username: 'aria', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' },
    mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
    caption: 'Behind the scenes at Tokyo Cyber Week 🗼🎆',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    privacy: 'public',
    viewersCount: 65,
    reactionsCount: 31
  }
];

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorFile, setEditorFile] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(null);
  const fileInputRef = useRef(null);

  const currentUser = useSelector((s) => s.auth?.user);
  const myId = currentUser?._id;

  const loadStories = async () => {
    setLoading(true);
    try {
      const res = await API.get('/stories');
      const payload = res.data?.data || res.data || [];
      setStories(Array.isArray(payload) && payload.length > 0 ? payload : DEMO_STORIES);
    } catch (err) {
      console.warn('Failed to load stories:', err);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditorFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:pb-12 min-h-screen">
      {/* Header Banner */}
      <div className="relative mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-[#070B14]/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37]">
              <FaFire className="text-[#FF6B8A] animate-pulse" /> Ephemeral Chronicles
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-[#F7F7FC]">
              Socialo Stories<span className="text-[#00F2FE]">.</span>
            </h1>
            <p className="mt-1 text-xs text-[#CBD5E1] max-w-lg leading-relaxed">
              Share authentic glimpses of your day with your community. Stories disappear after 24 hours.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] px-6 py-3.5 text-xs font-bold text-white shadow-[0_4px_25px_rgba(29,78,216,0.35)] transition-transform hover:scale-105 active:scale-95"
            >
              <FaPlus /> Create Story
            </button>
          </div>
        </div>
      </div>

      {/* Stories Gallery */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 p-16 text-center bg-[#070B14]/40 backdrop-blur-xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#052E24]/15 text-2xl text-[#FF6B8A]">
            <FaImage />
          </div>
          <h3 className="text-xl font-black text-[#F7F7FC]">
            No active stories yet
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#CBD5E1]">
            Be the first to share a moment! Post a photo or clip for your friends to experience.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
          >
            <FaPlus /> Share Story
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {/* Add story card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex aspect-[9/16] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-white/15 bg-[#070B14]/80 p-4 text-center transition-all hover:border-[#00F2FE]/40 hover:bg-[#0A111E] shadow-xl"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xl text-[#00F2FE] transition-transform group-hover:scale-110">
              <FaPlus />
            </div>
            <span className="text-xs font-bold text-[#F7F7FC]">
              Add Your Story
            </span>
            <span className="mt-1 text-[10px] text-[#A5A9BB]">
              Photo or clip
            </span>
          </div>

          {/* User Stories */}
          {stories.map((story, idx) => {
            const isMe = String(story.user?._id || story.user) === String(myId);
            const mediaUrl = getImageUrl(story.mediaUrl || story.media || story.user?.avatar);
            const isVideo = story.mediaUrl?.match(/\.(mp4|webm|mov)$/i);

            return (
              <motion.div
                key={story._id || idx}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewerIndex(idx)}
                className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-[24px] border border-white/10 bg-[#04070D] shadow-xl transition-all duration-300 hover:border-white/25 hover:shadow-[0_8px_30px_rgba(29,78,216,0.25)]"
              >
                {/* Media background */}
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={story.user?.name || 'Story'}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50" />

                {/* Top header: user avatar */}
                <div className="absolute left-3 top-3 right-3 flex items-center gap-2 z-10">
                  <div className="rounded-full p-[2px] bg-gradient-to-tr from-[#1D4ED8] via-[#052E24] to-[#D4AF37]">
                    <UserAvatar
                      src={story.user?.avatar}
                      name={story.user?.name}
                      className="h-8 w-8 rounded-full border border-black"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#F7F7FC] drop-shadow">
                      {isMe ? 'You' : story.user?.name}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-[#CBD5E1]">
                      <FaClock size={9} />
                      <span>{new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {story.privacy === 'close_friends' && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F766E] text-[10px] text-white" title="Close Friends">
                      <FaStar size={9} />
                    </span>
                  )}
                </div>

                {/* Bottom caption */}
                {story.caption && (
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <p
                      className="line-clamp-2 text-xs font-medium text-[#F7F7FC] drop-shadow-md"
                      style={{ color: story.color || '#ffffff' }}
                    >
                      {story.caption}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Story Editor Modal */}
      {editorFile && (
        <StoryEditor
          file={editorFile}
          onClose={() => setEditorFile(null)}
          onPosted={loadStories}
        />
      )}

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {viewerIndex !== null && (
          <StoryViewer
            stories={stories}
            initialIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
            onDelete={(deletedId) => {
              setStories((prev) => prev.filter((s) => s._id !== deletedId));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
