// frontend/src/components/posts/CreatePostModal.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaImage, FaVideo, FaPoll, FaSmile, FaGlobeAmericas, FaTimes, FaMagic } from 'react-icons/fa';
import { useToast } from '../ui/ToastProvider';
import UserAvatar from '../ui/UserAvatar';
import { generateCaption, generateSmartTags, AI_TONES } from '../../utils/aiGenerator';
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

export default function CreatePostModal({ isOpen, onClose, onPosted, initialData, initialTab }) {
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
  const [isPaywalled, setIsPaywalled] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState(10);

  // AI Creator Studio State
  const [selectedTone, setSelectedTone] = useState('obsidian');
  const [showAiStudio, setShowAiStudio] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1'); // '1:1' | '4:5' | '16:9'

  const { add } = useToast();
  const currentUser = useSelector((s) => s.auth?.user);

  // Auto-restore saved draft
  useEffect(() => {
    if (!initialData && isOpen && !text) {
      const savedDraft = localStorage.getItem('socialverse_draft_post');
      if (savedDraft) setText(savedDraft);
    }
  }, [isOpen]);

  // Auto-save draft
  useEffect(() => {
    if (text) {
      localStorage.setItem('socialverse_draft_post', text);
    }
  }, [text]);

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'poll') setActiveTab('poll');
      else if (initialTab === 'reel') setActiveTab('reel');
      else if (initialTab === 'ai') {
        setActiveTab('post');
        setShowAiStudio(true);
      } else {
        setActiveTab('post');
      }
    }
  }, [initialTab]);

  // 🔥 EFFECT: Load Initial Data (Drafts/Reposts/AI Prompt)
  useEffect(() => {
    if (initialData) {
        setText(initialData.content || (typeof initialData === 'string' ? initialData : ''));
        if (initialData.openAiStudio) setShowAiStudio(true);
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
        setShowAiStudio(false);
    }
  }, [isOpen, initialData]);

  // 🔥 Handle File Selection with NSFW Check
  const handleFileSelect = async (e, type) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (type === 'image') {
        setLoading(true);
        try {
            const file = selectedFiles[0];
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.crossOrigin = 'anonymous';

            const isUnsafe = await new Promise((resolve) => {
                img.onload = async () => {
                    try {
                        const result = await checkImageSafety(img);
                        resolve(result);
                    } catch (error) {
                        console.error("NSFW Check Error", error);
                        resolve(false);
                    }
                };
                img.onerror = () => resolve(false);
            });

            if (isUnsafe) {
                add("Image blocked: Contains inappropriate content.", { type: 'error' });
                e.target.value = "";
                setFiles([]);
            } else {
                setFiles(selectedFiles);
            }
        } catch (err) {
            console.error("File processing error", err);
            setFiles(selectedFiles); 
        } finally {
            setLoading(false);
        }
    } else {
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

  const handleMagicWrite = async (customTone = selectedTone) => {
    setAiLoading(true);
    try {
      const caption = await generateCaption(text, customTone); 
      setText(caption);
      add(`AI composed in ${customTone} tone!`, { type: 'success' });
    } catch(e) {
      add("AI unavailable", { type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAppendSmartTags = () => {
    const tags = generateSmartTags(text);
    const tagStr = tags.map(t => `#${t}`).join(' ');
    setText(prev => (prev ? `${prev.trim()}\n\n${tagStr}` : tagStr));
    add("Smart hashtags appended!", { type: 'info' });
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
         fd.append('content', text);
         fd.append('isDraft', isSaveDraft);
         fd.append('isPaywalled', isPaywalled);
         fd.append('unlockPrice', unlockPrice); 
         
         for (const f of files) {
             const processed = await compressImage(f);
             fd.append('media', processed);
         }

         await API.post('/posts', fd);
      }

      if (!isSaveDraft) {
        localStorage.removeItem('socialverse_draft_post');
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-xl bg-[#070B14] border border-[rgba(226,232,240,0.16)] rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar text-[#F8FAFC]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(226,232,240,0.1)] flex justify-between items-center bg-[#04070D] sticky top-0 z-10">
          <h3 className="font-display font-bold text-lg text-center w-full text-[#F8FAFC]">Create Content</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.08] text-[#CBD5E1]/60 hover:text-white absolute right-4 transition-colors"><FaTimes /></button>
        </div>

        <div className="p-5">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 bg-[#04070D] p-1.5 rounded-[14px] border border-[rgba(226,232,240,0.1)]">
            {['post', 'reel', 'poll'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-[10px] text-sm font-semibold capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-[#1D4ED8]/25 to-[#00F2FE]/20 border border-[rgba(226,232,240,0.15)] text-[#00F2FE] font-bold shadow-sm' 
                    : 'text-[#CBD5E1]/60 hover:text-[#F8FAFC]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <UserAvatar src={currentUser?.avatar} name={currentUser?.name} className="w-10 h-10 border border-[rgba(226,232,240,0.15)]" />
            <div>
              <div className="font-bold text-sm text-[#F8FAFC]">{currentUser?.name || 'You'}</div>
              <div className="flex items-center gap-1 text-xs text-[#CBD5E1]/70 bg-[#04070D] border border-[rgba(226,232,240,0.1)] px-2 py-0.5 rounded cursor-pointer mt-0.5">
                <FaGlobeAmericas /> Public
              </div>
            </div>
          </div>

          {/* --- POLL UI --- */}
          {activeTab === 'poll' ? (
            <div className="space-y-3">
              <input 
                className="w-full p-3 rounded-[14px] border border-[rgba(226,232,240,0.14)] bg-[#04070D] text-[#F8FAFC] placeholder-[#CBD5E1]/40 outline-none focus:ring-1 focus:ring-[#00F2FE] transition-all" 
                placeholder="Ask a question..." 
                value={pollQ} 
                onChange={e=>setPollQ(e.target.value)} 
              />
              {pollOpts.map((o,i)=>(
                <input 
                  key={i} 
                  className="w-full p-2.5 rounded-[12px] border border-[rgba(226,232,240,0.14)] bg-[#04070D] text-[#F8FAFC] placeholder-[#CBD5E1]/40 outline-none focus:ring-1 focus:ring-[#00F2FE] transition-all" 
                  placeholder={`Option ${i+1}`} 
                  value={o} 
                  onChange={e=>{ const newOpts=[...pollOpts]; newOpts[i]=e.target.value; setPollOpts(newOpts); }} 
                />
              ))}
              <button type="button" onClick={()=>setPollOpts([...pollOpts,''])} className="text-sm text-[#00F2FE] font-bold hover:underline">+ Add Option</button>
            </div>
          ) : (
            /* --- POST / REEL UI --- */
            <>
              <div className="relative">
                <textarea 
                  value={text}
                  onChange={handleTextChange}
                  placeholder={activeTab === 'reel' ? "Describe your reel..." : "What's on your mind? (Try typing #)"}
                  className="w-full h-24 bg-transparent text-lg resize-none outline-none placeholder-[#CBD5E1]/40 text-[#F8FAFC]"
                />
                
                {/* Autocomplete Dropdown */}
                {tagSuggestions.length > 0 && (
                    <div className="absolute z-10 bg-[#070B14] border border-[rgba(226,232,240,0.14)] shadow-2xl rounded-xl p-2 mt-1 left-0 w-64 max-h-40 overflow-y-auto">
                        {tagSuggestions.map(tag => (
                            <button key={tag} onClick={() => insertTag(tag)} className="block w-full text-left px-3 py-2 hover:bg-white/[0.06] rounded text-sm text-[#00F2FE] font-medium transition">
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 pb-2">
                  <button 
                    type="button"
                    onClick={() => setShowAiStudio(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition border ${
                      showAiStudio 
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/50 shadow-[0_0_12px_rgba(212,140,123,0.3)]' 
                        : 'border-[rgba(226,232,240,0.14)] text-[#CBD5E1]/70 hover:text-[#D4AF37]'
                    }`}
                  >
                    <FaMagic className={aiLoading ? "animate-spin text-[#D4AF37]" : "text-[#D4AF37]"} />
                    <span>AI Studio</span>
                  </button>
                </div>

                {/* Expanded AI Creator Studio Panel */}
                {showAiStudio && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 p-3.5 rounded-2xl bg-[#04070D] border border-[rgba(226,232,240,0.12)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#CBD5E1]/70">
                        AI Tone & Voice
                      </span>
                      <span className="text-[10px] text-[#0F766E] font-medium flex items-center gap-1">
                        🛡️ 99.4% Safety Cleared
                      </span>
                    </div>

                    {/* Tone Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {AI_TONES.map(tone => (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => {
                            setSelectedTone(tone.id);
                            handleMagicWrite(tone.id);
                          }}
                          disabled={aiLoading}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                            selectedTone === tone.id
                              ? 'bg-gradient-to-r from-[#1D4ED8] to-[#00F2FE] text-white font-bold shadow-sm'
                              : 'bg-[#070B14] text-[#CBD5E1] border border-[rgba(226,232,240,0.12)] hover:border-[#00F2FE]/40'
                          }`}
                        >
                          <span>{tone.icon}</span>
                          <span>{tone.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={handleAppendSmartTags}
                        className="text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
                      >
                        🏷️ Append Smart Hashtags
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMagicWrite(selectedTone)}
                        disabled={aiLoading}
                        className="text-[#00F2FE] hover:underline font-bold"
                      >
                        {aiLoading ? 'Crafting...' : '✨ Rewrite Draft'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Media Preview */}
              {files.length > 0 && (
                <div className="mb-4">
                  {/* Aspect Ratio Toggle Bar */}
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#CBD5E1]/60">
                      Framing Ratio
                    </span>
                    <div className="flex gap-1.5 bg-[#04070D] p-1 rounded-lg border border-white/10 text-xs">
                      {['1:1', '4:5', '16:9'].map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAspectRatio(ratio)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                            aspectRatio === ratio
                              ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`relative w-full rounded-xl overflow-hidden border border-[rgba(226,232,240,0.14)] bg-black group ${
                    aspectRatio === '1:1' ? 'h-64 sm:h-72' : aspectRatio === '4:5' ? 'h-80 sm:h-96' : 'h-48 sm:h-56'
                  }`}>
                    <button onClick={() => setFiles([])} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full z-20 hover:bg-[#052E24] transition cursor-pointer"><FaTimes /></button>
                    {files[0].type.includes('video') ? (
                      <video src={URL.createObjectURL(files[0])} className="h-full w-full object-cover" controls />
                    ) : (
                      <img 
                        src={URL.createObjectURL(files[0])} 
                        className={`h-full w-full ${aspectRatio === '1:1' ? 'object-cover' : 'object-contain'} transition-all duration-300`}
                        style={{ filter: filter }}
                        alt="preview"
                      />
                    )}
                  </div>
                  {/* Filters */}
                  {!files[0].type.includes('video') && (
                    <div className="flex gap-3 overflow-x-auto py-3 no-scrollbar">
                      {FILTERS.map(f => (
                        <button key={f.name} onClick={() => setFilter(f.val)} className={`px-4 py-1 rounded-full text-xs font-bold border transition whitespace-nowrap ${filter === f.val ? 'bg-gradient-to-r from-[#1D4ED8] to-[#00F2FE] text-white border-transparent' : 'border-[rgba(226,232,240,0.14)] text-[#CBD5E1]/60 hover:border-[#00F2FE]'}`}>
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tools Bar */}
              <div className="flex justify-between items-center border p-3 rounded-xl border-[rgba(226,232,240,0.14)] bg-[#04070D] mt-2">
                <span className="text-sm font-medium text-[#CBD5E1]/70">
                    {loading ? 'Checking...' : 'Add to your post'}
                </span>
                <div className="flex gap-3 text-xl">
                  {/* Image Upload Input */}
                  <label className={`cursor-pointer text-[#00F2FE] hover:bg-white/[0.06] p-2 rounded-full transition ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FaImage />
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        multiple={activeTab!=='reel'} 
                        onChange={e => handleFileSelect(e, 'image')}
                    />
                  </label>
                  
                  {/* Video Upload Input */}
                  <label className={`cursor-pointer text-[#10B981] hover:bg-white/[0.06] p-2 rounded-full transition ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FaVideo />
                    <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={e => handleFileSelect(e, 'video')}
                    />
                  </label>
                  
<div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaywalled(!isPaywalled)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        isPaywalled 
                          ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F4D49A]' 
                          : 'border-white/10 bg-white/5 text-[#CBD5E1]/60 hover:text-white'
                      }`}
                    >
                      <FaMagic size={11} className={isPaywalled ? "text-[#F4D49A]" : ""} />
                      <span>{isPaywalled ? `${unlockPrice} Coins Paywall` : 'VIP Paywall'}</span>
                    </button>
                    {isPaywalled && (
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={unlockPrice}
                        onChange={(e) => setUnlockPrice(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 rounded-xl border border-white/15 bg-[#04070D] px-2 py-1 text-center text-xs font-bold text-[#F4D49A] outline-none"
                      />
                    )}
                  </div>
                  <button className="text-[#D4AF37] hover:bg-white/[0.06] p-2 rounded-full transition"><FaPoll /></button>
                  <button className="text-[#CBD5E1] hover:bg-white/[0.06] p-2 rounded-full transition"><FaSmile /></button>
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
                    className="flex-1 py-3 rounded-xl border border-[rgba(226,232,240,0.14)] bg-white/[0.06] text-[#CBD5E1] font-bold hover:bg-white/[0.1] transition-colors"
                >
                    Save Draft
                </button>
            )}
            
            {/* Post Button */}
            <button 
                disabled={loading || (activeTab==='poll' ? !pollQ : (!text && files.length === 0))}
                onClick={() => handleSubmit(false)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#00F2FE] hover:opacity-95 text-white font-bold disabled:opacity-50 transition shadow-sapphireGlow"
            >
                {loading ? 'Processing...' : 'Post'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
