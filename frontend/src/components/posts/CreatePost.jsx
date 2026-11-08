// frontend/src/components/posts/CreatePost.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { useDispatch } from 'react-redux';
import { fetchFeed } from '../../redux/slices/postSlice';
import { motion } from 'framer-motion';

const CreatePost = () => {
  const dispatch = useDispatch();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [sending, setSending] = useState(false);

  const handleFiles = (e) => {
    setMedia(Array.from(e.target.files || []));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!content.trim() && media.length === 0) {
      alert('Write something or add media');
      return;
    }

    try {
      setSending(true);

      const fd = new FormData();
      fd.append('content', content);
      media.forEach((m) => fd.append('media', m));

      await API.post('/posts', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setContent('');
      setMedia([]);
      dispatch(fetchFeed());
    } catch (err) {
      console.error('create post err', err);
      alert(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      className="mb-4 rounded-2xl bg-[#070B14]/85 backdrop-blur-xl border border-[rgba(226,232,240,0.14)] p-4 shadow-silverGlass text-[#F8FAFC]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <form onSubmit={submit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share a moment with the world…"
          className="mb-3 w-full resize-none rounded-xl bg-[#04070D] border border-[rgba(226,232,240,0.12)] p-3 text-sm text-[#F8FAFC] placeholder-[#CBD5E1]/40 outline-none focus:ring-1 focus:ring-[#00F2FE] transition-all"
          rows={3}
        />
        <div className="flex items-center justify-between gap-3">
          <label className="cursor-pointer rounded-xl bg-white/[0.06] border border-[rgba(226,232,240,0.12)] px-3.5 py-2 text-xs font-semibold text-[#CBD5E1] hover:text-[#00F2FE] transition-colors">
            Add media
            <input
              onChange={handleFiles}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
          </label>

          <div className="text-xs text-[#CBD5E1]/60 font-mono">{media.length} files selected</div>

          <button
            disabled={sending}
            className="rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#00F2FE] px-5 py-2 text-xs font-bold text-white shadow-sapphireGlow disabled:opacity-50 transition-all hover:opacity-95"
          >
            {sending ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreatePost;
