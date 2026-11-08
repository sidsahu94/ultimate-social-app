// frontend/src/pages/posts/ScheduledPosts.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { FaCalendarAlt, FaClock, FaPaperclip, FaPaperPlane } from 'react-icons/fa';
import UserAvatar from '../../components/ui/UserAvatar';
import Spinner from '../../components/common/Spinner';

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
      const data = res.data?.data || res.data;
      setList(Array.isArray(data) ? data : []);
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
      await API.post('/posts/scheduled', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      add('Post scheduled successfully!', { type: 'success' });
      setContent(''); setFiles([]); setScheduledAt('');
      load();
    } catch (err) {
      console.error('schedule err', err);
      add(err.userMessage || 'Failed to schedule post', { type: 'error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F2FE] mb-1">
          <FaCalendarAlt /> Automation Scheduler
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
          Scheduled Broadcasts<span className="text-[#00F2FE]">.</span>
        </h1>
        <p className="text-xs text-[#CBD5E1] mt-1">Compose posts and program publication times for autonomous publishing.</p>
      </div>

      <form onSubmit={submit} className="bg-[#070B14]/90 border border-white/10 p-5 md:p-6 rounded-3xl shadow-xl backdrop-blur-xl mb-8">
        <textarea 
          value={content} 
          onChange={(e)=>setContent(e.target.value)} 
          placeholder="Write content to schedule..." 
          className="w-full p-4 rounded-2xl bg-[#0A111E] border border-white/10 text-[#F7F7FC] placeholder-[#A5A9BB] outline-none text-xs focus:border-[#00F2FE]/50 transition mb-3 resize-none leading-relaxed" 
          rows={4} 
        />
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <input 
              type="datetime-local" 
              value={scheduledAt} 
              onChange={(e)=>setScheduledAt(e.target.value)} 
              className="p-2.5 rounded-xl bg-[#0A111E] border border-white/10 text-xs text-[#F7F7FC] outline-none" 
            />
            <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#CBD5E1] hover:text-white flex items-center gap-1.5 transition">
              <FaPaperclip size={11} />
              <span>Attach</span>
              <input type="file" accept="image/*,video/*" multiple onChange={handleFiles} className="hidden" />
            </label>
            {files.length > 0 && <span className="text-xs text-[#00F2FE] font-semibold">{files.length} attached</span>}
          </div>
          
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white text-xs font-bold shadow-md hover:opacity-95 transition flex items-center gap-1.5">
            <FaClock size={11} /> Schedule Post
          </button>
        </div>
      </form>

      <div className="bg-[#070B14]/90 border border-white/10 p-6 rounded-3xl shadow-xl backdrop-blur-xl">
        <h3 className="font-bold text-base text-[#F7F7FC] mb-4">Pending Queue</h3>
        {loading ? <div className="p-8 flex justify-center"><Spinner /></div> : (
          <div className="space-y-3">
            {list.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#A5A9BB]">No scheduled broadcasts in queue.</div>
            ) : list.map(p => (
              <div key={p._id} className="p-4 bg-[#171A26]/80 border border-white/5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <UserAvatar src={p.user?.avatar} name={p.user?.name} className="w-10 h-10 border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-[#F7F7FC]">{p.user?.name}</div>
                      <div className="text-[10px] text-[#00F2FE] font-mono bg-[#0F766E]/20 px-2 py-0.5 rounded-full border border-[#0F766E]/30">
                        {new Date(p.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[#CBD5E1] leading-relaxed line-clamp-3">{p.content}</div>
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
