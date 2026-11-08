// frontend/src/components/stories/Stories.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import API from "../../services/api";
import StoryEditor from "./StoryEditor";
import StoryViewer from "./StoryViewer";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus } from "react-icons/fa";
import { getImageUrl } from "../../utils/imageUtils";

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [editorFile, setEditorFile] = useState(null);
  const [viewIndex, setViewIndex] = useState(null);
  const myId = useSelector(s => s.auth?.user?._id) || localStorage.getItem('meId');

  const load = async () => {
    try {
      const r = await API.get("/stories");
      setStories(Array.isArray(r.data) ? r.data : (r.data?.data || []));
    } catch (e) { 
      // Silent fail
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileSelect = (e) => {
    if (e.target.files[0]) setEditorFile(e.target.files[0]);
  };

  return (
    <>
      <div className="mb-6 overflow-x-auto no-scrollbar py-2 px-4 -mx-4 md:mx-0">
        <div className="flex gap-4">
          
          {/* Add Story */}
          <div className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group relative">
            <div className="relative w-[72px] h-[72px] rounded-full border-2 border-dashed border-[rgba(226,232,240,0.25)] flex items-center justify-center bg-[#0A111E] hover:border-[#1D4ED8] transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
              <FaPlus className="text-[#1D4ED8] group-hover:scale-110 group-hover:text-[#00F2FE] transition-all text-base" />
              <input 
                type="file" 
                accept="image/*,video/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileSelect}
              />
            </div>
            <span className="text-[11px] font-semibold text-[#CBD5E1]">Add Story</span>
          </div>

          {/* Story Rings */}
          {stories.map((story, i) => {
            const avatarUrl = getImageUrl(story.user?.avatar);
            const isMe = String(story.user?._id) === String(myId);
            
            return (
              <motion.div 
                key={story._id || i} 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group"
                onClick={() => setViewIndex(i)}
              >
                <div className={`w-[74px] h-[74px] rounded-full p-[2.5px] transition-all duration-300 group-hover:scale-105 ${
                  isMe 
                    ? 'border border-[rgba(226,232,240,0.25)] bg-transparent' 
                    : story.isViewed
                    ? 'border border-white/20 bg-white/5 opacity-70'
                    : story.privacy === 'close_friends'
                    ? 'bg-gradient-to-tr from-[#10B981] via-[#059669] to-[#34D399] shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                    : 'bg-gradient-to-tr from-[#1D4ED8] via-[#052E24] via-[#D4AF37] to-[#00F2FE] shadow-[0_0_16px_rgba(212,140,123,0.35)]'
                }`}>
                  <div className="w-full h-full rounded-full p-[2px] bg-[#04070D] overflow-hidden relative">
                    <img 
                      src={avatarUrl} 
                      className="w-full h-full rounded-full object-cover"
                      alt={story.user?.name}
                    />
                    {story.privacy === 'close_friends' && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10B981] border border-[#04070D] flex items-center justify-center text-[8px] text-white font-bold">
                        ★
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-[#F8FAFC] truncate w-16 text-center">
                  {isMe ? 'Your Story' : story.user?.name?.split(' ')[0]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {editorFile && (
        <StoryEditor 
          file={editorFile} 
          onClose={() => setEditorFile(null)} 
          onPosted={load}
        />
      )}

      <AnimatePresence>
        {viewIndex !== null && (
          <StoryViewer 
            stories={stories} 
            initialIndex={viewIndex} 
            onClose={() => setViewIndex(null)} 
            onDelete={(deletedId) => setStories(prev => prev.filter(s => s._id !== deletedId))}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Stories;
