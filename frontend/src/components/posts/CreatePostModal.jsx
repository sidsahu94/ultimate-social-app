// frontend/src/components/posts/CreatePostModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { useToast } from '../ui/ToastProvider';

const CreatePostModal = ({ isOpen, onClose, onPosted }) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setFiles([]);
      setProgress(0);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFiles = (e) => {
    const f = Array.from(e.target.files || []);
    setFiles(f);
  };

  const submit = async (e) => {
     e.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) {
    add('Please log in to create a post', { type: 'error' });
    return;
  }
    e.preventDefault();
    if (!content.trim() && files.length === 0) {
      return add('Write something or attach media', { type: 'error' });
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('content', content);

      // Append files under a single field name 'media' (backend accepts any, but keep this consistent)
      files.forEach((f) => fd.append('media', f));

      const res = await API.post('/posts', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      });

      add('Post created', { type: 'info' });

      // Emit event (Feed listens) to immediately prepend
      window.dispatchEvent(new CustomEvent('postCreated', { detail: res.data }));

      onPosted && onPosted(res.data);
      onClose && onClose();
    } catch (err) {
      console.error('create post err', err);
      add(err.userMessage || 'Failed to create post', { type: 'error' });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (!loading) onClose(); }} />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl p-5 z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Create post</h3>
          <button onClick={() => { if (!loading) onClose(); }} className="text-gray-600">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share something..." className="w-full p-3 bg-gray-100 dark:bg-gray-900 rounded resize-none outline-none" rows={4} />

          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded">
              Attach
              <input type="file" accept="image/*,video/*" multiple onChange={handleFiles} className="hidden" />
            </label>

            <div className="text-sm text-gray-500">{files.length} files</div>

            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => { setContent(''); setFiles([]); }} disabled={loading} className="px-3 py-1 rounded border">Clear</button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-gradient-to-r from-indigo-600 to-pink-500 text-white">
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          {progress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2">
              <div style={{ width: `${progress}%` }} className="h-2 bg-indigo-600 rounded" />
            </div>
          )}

          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="h-24 bg-gray-50 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center text-xs text-gray-600">
                  <div className="text-center px-1">
                    <div className="font-semibold truncate">{f.name}</div>
                    <div className="text-xs text-gray-400">{Math.round(f.size / 1024)} KB</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;
