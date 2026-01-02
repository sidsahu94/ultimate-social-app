import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaEdit, FaTrash, FaStickyNote } from 'react-icons/fa';
import { useToast } from '../../components/ui/ToastProvider';

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { add } = useToast();

  useEffect(() => { loadDrafts(); }, []);

  const loadDrafts = async () => {
    try {
      // Uses the dedicated endpoint we added to backend/routes/posts.js
      const res = await API.get('/posts/drafts');
      setDrafts(res.data || []);
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
      // Trigger the CreatePostModal with the draft's data to allow editing/publishing
      window.dispatchEvent(new CustomEvent('openCreatePost', { 
          detail: { 
              content: draft.content, 
              _id: draft._id, 
              isDraft: true // Flag to tell the modal this is an existing draft
          } 
      }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
        <FaStickyNote className="text-yellow-500" /> Drafts
      </h1>

      {loading ? (
        <div className="text-center p-10 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
            {drafts.length === 0 && (
                <div className="text-gray-500 text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    No drafts saved.
                </div>
            )}
            
            {drafts.map(draft => (
                <div key={draft._id} className="card p-4 flex justify-between items-start bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl shadow-sm transition hover:shadow-md">
                    <div className="flex-1 pr-4">
                        <p className="text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap line-clamp-2">
                            {draft.content || "Untitled Draft"}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Last edited: {new Date(draft.updatedAt).toLocaleString()}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handlePublish(draft)} 
                            className="p-2 bg-white dark:bg-gray-800 rounded-full text-indigo-600 shadow-sm border border-gray-200 dark:border-gray-700 hover:text-indigo-700 hover:shadow-md transition"
                            title="Edit / Publish"
                        >
                            <FaEdit />
                        </button>
                        <button 
                            onClick={() => handleDelete(draft._id)} 
                            className="p-2 bg-white dark:bg-gray-800 rounded-full text-red-500 shadow-sm border border-gray-200 dark:border-gray-700 hover:text-red-700 hover:shadow-md transition"
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