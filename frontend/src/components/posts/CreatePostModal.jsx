// frontend/src/components/posts/CreatePostModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaImage, FaVideo, FaPoll, FaSmile, FaGlobeAmericas, FaTimes, FaMagic } from 'react-icons/fa';
import { useToast } from '../ui/ToastProvider';
import { generateCaption } from '../../utils/aiGenerator';
import { compressImage } from '../../utils/compressor'; 

// 🔥 Import Safety Check
import { checkImageSafety } from '../../utils/contentSafety';

const FILTERS = [
  { name: 'Normal', val: '' },
  { name: 'Vintage', val: 'sepia(0.5) contrast(1.2)' },
  { name: 'B&W', val: 'grayscale(1)' },
  { name: 'Vivid', val: 'saturate(2)' },
  { name: 'Cool', val: 'hue-rotate(30deg)' },
  { name: 'Warm', val: 'sepia(0.3) saturate(1.4)' },
];

export default function CreatePostModal({ isOpen, onClose, onPosted, initialData }) {
  const [activeTab, setActiveTab] = useState('post'); 
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Draft State
  const [draftId, setDraftId] = useState(null);
  
  // Poll State
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState(['', '']);

  // Filter State
  const [filter, setFilter] = useState('');

  // Hashtag Autocomplete
  const [tagSuggestions, setTagSuggestions] = useState([]);

  const { add } = useToast();

  // 🔥 EFFECT: Load Initial Data (Drafts/Reposts)
  useEffect(() => {
    if (initialData) {
        setText(initialData.content || '');
        if (initialData.isDraft) setDraftId(initialData._id); // Track draft ID
    } else if (!isOpen) {
        // Reset on close
        setText(''); 
        setFiles([]); 
        setPollQ(''); 
        setPollOpts(['','']); 
        setFilter(''); 
        setTagSuggestions([]); 
        setDraftId(null);
    }
  }, [isOpen, initialData]);

  // 🔥 NEW: Handle File Selection with NSFW Check
  const handleFileSelect = async (e, type) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Only check images for NSFW (Video checking is resource intensive client-side)
    if (type === 'image') {
        setLoading(true); // Show loading state while checking
        try {
            const file = selectedFiles[0]; // Check the first file
            
            // Create an invisible image element to check
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.crossOrigin = 'anonymous';

            // Wrap onload in a promise to await the result
            const isUnsafe = await new Promise((resolve) => {
                img.onload = async () => {
                    try {
                        const result = await checkImageSafety(img);
                        resolve(result);
                    } catch (error) {
                        console.error("NSFW Check Error", error);
                        resolve(false); // Default to safe if model fails
                    }
                };
                img.onerror = () => resolve(false);
            });

            if (isUnsafe) {
                add("Image blocked: Contains inappropriate content.", { type: 'error' });
                e.target.value = ""; // Clear input
                setFiles([]);
            } else {
                setFiles(selectedFiles);
            }
        } catch (err) {
            console.error("File processing error", err);
            // Fallback: Allow file if check fails entirely? Or block? 
            // Here we allow it to avoid UX blocking on bugs
            setFiles(selectedFiles); 
        } finally {
            setLoading(false);
        }
    } else {
        // For Videos, just set the files (Logic for backend video moderation would go here)
        setFiles(selectedFiles);
    }
  };

  // Handle Hashtag Detection
  const handleTextChange = async (e) => {
    const val = e.target.value;
    setText(val);

    const words = val.split(/[\s\n]+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('#') && lastWord.length > 1) {
        const query = lastWord.slice(1);
        try {
            const res = await API.get(`/tags/search?q=${query}`);
            setTagSuggestions(res.data || []);
        } catch(e) { /* silent fail */ }
    } else {
        setTagSuggestions([]);
    }
  };

  const insertTag = (tag) => {
    const words = text.split(/[\s\n]+/);
    words.pop(); 
    const newText = words.join(' ') + ' #' + tag + ' ';
    setText(newText);
    setTagSuggestions([]);
  };

  const handleMagicWrite = async () => {
    setAiLoading(true);
    try {
      const caption = await generateCaption(); 
      setText(prev => (prev ? prev + "\n" + caption : caption));
    } catch(e) {
      add("AI unavailable", { type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (isSaveDraft = false) => {
    setLoading(true);
    try {
      const fd = new FormData();

      if (activeTab === 'poll') {
        if (!pollQ || pollOpts.some(o => !o.trim())) throw new Error("Incomplete poll data");
        await API.post('/polls', { question: pollQ, options: pollOpts });
      } 
      else if (activeTab === 'reel') {
         if (files.length === 0) throw new Error("Video required for Reel");
         fd.append('video', files[0]);
         fd.append('caption', text);
         await API.post('/reels/upload', fd);
      } 
      else {
         // Standard Post
         fd.append('content', text);
         fd.append('isDraft', isSaveDraft); 
         
         for (const f of files) {
             const processed = await compressImage(f);
             fd.append('media', processed);
         }

         await API.post('/posts', fd);
      }

      if (onPosted) onPosted();
      onClose();
      add(isSaveDraft ? 'Draft saved!' : 'Posted successfully!', { type: 'success' });
    } catch(err) {
      console.error(err);
      add(err.response?.data?.message || err.message || "Failed to post", { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
          <h3 className="font-bold text-lg text-center w-full">Create Content</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 absolute right-4"><FaTimes /></button>
        </div>

        <div className="p-4">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {['post', 'reel', 'poll'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-500'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
            <div>
              <div className="font-bold text-sm">You</div>
              <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded cursor-pointer">
                <FaGlobeAmericas /> Public
              </div>
            </div>
          </div>

          {/* --- POLL UI --- */}
          {activeTab === 'poll' ? (
            <div className="space-y-3">
              <input 
                className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-700" 
                placeholder="Ask a question..." 
                value={pollQ} 
                onChange={e=>setPollQ(e.target.value)} 
              />
              {pollOpts.map((o,i)=>(
                <input 
                  key={i} 
                  className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700" 
                  placeholder={`Option ${i+1}`} 
                  value={o} 
                  onChange={e=>{ const newOpts=[...pollOpts]; newOpts[i]=e.target.value; setPollOpts(newOpts); }} 
                />
              ))}
              <button type="button" onClick={()=>setPollOpts([...pollOpts,''])} className="text-sm text-indigo-500 font-bold">+ Add Option</button>
            </div>
          ) : (
            /* --- POST / REEL UI --- */
            <>
              <div className="relative">
                <textarea 
                  value={text}
                  onChange={handleTextChange}
                  placeholder={activeTab === 'reel' ? "Describe your reel..." : "What's on your mind? (Try typing #)"}
                  className="w-full h-24 bg-transparent text-lg resize-none outline-none placeholder-gray-400 dark:text-white"
                />
                
                {/* Autocomplete Dropdown */}
                {tagSuggestions.length > 0 && (
                    <div className="absolute z-10 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-xl p-2 mt-1 left-0 w-64 max-h-40 overflow-y-auto">
                        {tagSuggestions.map(tag => (
                            <button key={tag} onClick={() => insertTag(tag)} className="block w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded text-sm text-indigo-600 font-medium transition">
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}

                <button 
                  onClick={handleMagicWrite}
                  disabled={aiLoading}
                  className="absolute bottom-2 right-2 text-purple-500 bg-purple-50 dark:bg-purple-900/30 p-2 rounded-full hover:scale-110 transition"
                  title="AI Magic Write"
                >
                  <FaMagic className={aiLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {/* Media Preview */}
              {files.length > 0 && (
                <div className="mb-4">
                  <div className="relative h-64 w-full rounded-xl overflow-hidden border bg-black group">
                    <button onClick={() => setFiles([])} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full z-20 hover:bg-red-500 transition"><FaTimes /></button>
                    {files[0].type.includes('video') ? (
                      <video src={URL.createObjectURL(files[0])} className="h-full w-full object-contain" controls />
                    ) : (
                      <img 
                        src={URL.createObjectURL(files[0])} 
                        className="h-full w-full object-contain transition-all duration-300"
                        style={{ filter: filter }}
                        alt="preview"
                      />
                    )}
                  </div>
                  {/* Filters */}
                  {!files[0].type.includes('video') && (
                    <div className="flex gap-3 overflow-x-auto py-3 no-scrollbar">
                      {FILTERS.map(f => (
                        <button key={f.name} onClick={() => setFilter(f.val)} className={`px-4 py-1 rounded-full text-xs font-bold border transition whitespace-nowrap ${filter === f.val ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tools Bar */}
              <div className="flex justify-between items-center border p-3 rounded-xl border-gray-200 dark:border-gray-700 mt-2">
                <span className="text-sm font-medium text-gray-500">
                    {loading ? 'Checking...' : 'Add to your post'}
                </span>
                <div className="flex gap-3 text-xl">
                  {/* Image Upload Input */}
                  <label className={`cursor-pointer text-green-500 hover:bg-green-50 p-2 rounded-full transition ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FaImage />
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        multiple={activeTab!=='reel'} 
                        onChange={e => handleFileSelect(e, 'image')} // 🔥 Updated Handler
                    />
                  </label>
                  
                  {/* Video Upload Input */}
                  <label className={`cursor-pointer text-pink-500 hover:bg-pink-50 p-2 rounded-full transition ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FaVideo />
                    <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={e => handleFileSelect(e, 'video')} // 🔥 Updated Handler
                    />
                  </label>
                  
                  <button className="text-orange-500 hover:bg-orange-50 p-2 rounded-full transition"><FaPoll /></button>
                  <button className="text-yellow-500 hover:bg-yellow-50 p-2 rounded-full transition"><FaSmile /></button>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 mt-6">
            {/* Draft Button (Only for posts) */}
            {activeTab === 'post' && (
                <button 
                    disabled={loading || !text}
                    onClick={() => handleSubmit(true)} 
                    className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                    Save Draft
                </button>
            )}
            
            {/* Post Button */}
            <button 
                disabled={loading || (activeTab==='poll' ? !pollQ : (!text && files.length === 0))}
                onClick={() => handleSubmit(false)}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 transition shadow-lg shadow-indigo-500/30"
            >
                {loading ? 'Processing...' : 'Post'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}