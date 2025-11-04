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
    if (!content.trim() && media.length === 0) return alert('Write something or add media');
    try {
      setSending(true);
      const fd = new FormData();
      fd.append('content', content);
      media.forEach(m => fd.append('media', m));
      await API.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    <motion.div className="bg-white rounded-lg shadow p-4 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <form onSubmit={submit}>
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share something..." className="w-full p-3 rounded border mb-3 resize-none" rows={3} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer text-sm bg-gray-100 px-3 py-2 rounded">
              Add media
              <input onChange={handleFiles} type="file" accept="image/*,video/*" multiple className="hidden" />
            </label>
            <div className="text-xs text-gray-500">{media.length} files selected</div>
          </div>
          <button disabled={sending} className="bg-indigo-600 text-white px-4 py-2 rounded shadow">
            {sending ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreatePost;
