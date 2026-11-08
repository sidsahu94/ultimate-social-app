// frontend/src/pages/posts/DraftsPage.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaEdit, FaTrash, FaStickyNote } from 'react-icons/fa';
import { useToast } from '../../components/ui/ToastProvider';
import Spinner from '../../components/common/Spinner';

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { add } = useToast();

  useEffect(() => { loadDrafts(); }, []);

  const loadDrafts = async () => {
    try {
      const res = await API.get('/posts/drafts');
      const payload = res.data?.data || res.data;
      setDrafts(Array.isArray(payload) ? payload : []);
    } catch (e) {
      console.error(e);
      add("Failed to load drafts", { type: 'error' });
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Delete this draft permanently?")) return;
    try {
        await API.delete(`/posts/${id}`);
        setDrafts(prev => prev.filter(d => d._id !== id));
        add("Draft deleted", { type: 'success' });
    } catch(e) { 
        add("Failed to delete draft", { type: 'error' }); 
    }
  };

  const handlePublish = (draft) => {
      window.dispatchEvent(new CustomEvent('openCreatePost', { 
          detail: { 
              content: draft.content, 
              _id: draft._id, 
              isDraft: true
          } 
      }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 pb-24">
      <div className="mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#F4D49A] mb-1">
            <FaStickyNote /> Working Studio
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
            Unpublished Drafts<span className="text-[#00F2FE]">.</span>
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Spinner /></div>
      ) : (
        <div className="space-y-4">
            {drafts.length === 0 && (
                <div className="text-[#CBD5E1] text-center py-16 bg-[#070B14]/40 rounded-3xl border border-white/10 backdrop-blur-xl text-xs">
                    No drafts saved in your queue.
                </div>
            )}
            
            {drafts.map(draft => (
                <div key={draft._id} className="p-5 flex justify-between items-start bg-[#070B14]/90 border border-white/10 rounded-3xl shadow-xl backdrop-blur-xl transition hover:border-white/20">
                    <div className="flex-1 pr-4">
                        <p className="text-[#F7F7FC] font-medium text-sm whitespace-pre-wrap line-clamp-3 leading-relaxed">
                            {draft.content || "Untitled Draft"}
                        </p>
                        <div className="text-[11px] text-[#A5A9BB] mt-2">
                            Last edited: {new Date(draft.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handlePublish(draft)} 
                            className="p-2.5 bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] rounded-2xl text-white shadow-md hover:opacity-95 transition text-xs"
                            title="Edit / Publish"
                        >
                            <FaEdit />
                        </button>
                        <button 
                            onClick={() => handleDelete(draft._id)} 
                            className="p-2.5 bg-[#052E24]/20 border border-[#052E24]/30 rounded-2xl text-[#F87171] hover:bg-[#052E24]/40 transition text-xs"
                            title="Delete"
                        >
                            <FaTrash />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
