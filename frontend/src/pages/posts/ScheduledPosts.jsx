// frontend/src/pages/posts/ScheduledPosts.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';

export default function ScheduledPostsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const { add } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('/posts/scheduled');
      setList(res.data || []);
    } catch (err) {
      console.error('load scheduled', err);
      add(err.userMessage || 'Failed to load scheduled posts', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFiles = (e) => setFiles(Array.from(e.target.files || []));

  const submit = async (e) => {
    e.preventDefault();
    if (!scheduledAt) return add('Pick a future time', { type: 'error' });
    try {
      const fd = new FormData();
      fd.append('content', content);
      fd.append('scheduledAt', scheduledAt);
      files.forEach(f => fd.append('media', f));
      const res = await API.post('/posts/scheduled', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      add('Post scheduled', { type: 'info' });
      setContent(''); setFiles([]); setScheduledAt('');
      load();
    } catch (err) {
      console.error('schedule err', err);
      add(err.userMessage || 'Failed to schedule', { type: 'error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-3">Scheduled posts</h2>

      <form onSubmit={submit} className="card p-4 mb-6">
        <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Write a post to schedule..." className="w-full p-2 rounded border mb-2" rows={4} />
        <div className="flex gap-3 items-center mb-3">
          <input type="datetime-local" value={scheduledAt} onChange={(e)=>setScheduledAt(e.target.value)} className="p-2 border rounded" />
          <label className="cursor-pointer px-3 py-2 bg-gray-100 rounded">
            Attach
            <input type="file" accept="image/*,video/*" multiple onChange={handleFiles} className="hidden" />
          </label>
          <div className="text-sm text-gray-500">{files.length} files</div>
          <button className="ml-auto px-4 py-2 rounded bg-indigo-600 text-white">Schedule</button>
        </div>
      </form>

      <div className="card p-4">
        <h3 className="font-semibold mb-2">Upcoming</h3>
        {loading ? <div className="text-gray-500">Loading...</div> : (
          <div className="space-y-3">
            {list.length === 0 ? <div className="text-gray-400">No scheduled posts</div> : list.map(p => (
              <div key={p._id} className="p-3 border rounded">
                <div className="flex items-start gap-3">
                  <img src={p.user?.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <div className="font-medium">{p.user?.name}</div>
                    <div className="text-xs text-gray-400">{new Date(p.scheduledAt).toLocaleString()}</div>
                    <div className="mt-2 text-sm">{p.content}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
