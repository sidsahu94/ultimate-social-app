// frontend/src/components/stories/Stories.jsx
import React, { useEffect, useState } from "react";
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

  const load = async () => {
    try {
      const r = await API.get("/stories");
      setStories(r.data || []);
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
            <div className="relative w-[72px] h-[72px] rounded-full border-2 border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 hover:border-indigo-500 transition-colors">
              <FaPlus className="text-gray-400 group-hover:text-indigo-500 text-xl" />
              <input 
                type="file" 
                accept="image/*,video/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileSelect}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Add Story</span>
          </div>

          {/* Story Rings */}
          {stories.map((story, i) => {
            const avatarUrl = getImageUrl(story.user?.avatar);
            const isMe = story.user?._id === localStorage.getItem('meId');
            
            return (
              <motion.div 
                key={story._id} 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer"
                onClick={() => setViewIndex(i)}
              >
                <div className={`w-[76px] h-[76px] rounded-full p-[2px] shadow-sm hover:scale-105 transition-transform ${isMe ? 'bg-gray-300' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-indigo-600'}`}>
                  <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-gray-900 overflow-hidden">
                    <img 
                      src={avatarUrl} 
                      className="w-full h-full rounded-full object-cover"
                      alt={story.user?.name}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-16 text-center">
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
          onPosted={load} // 🔥 Reloads stories after post
        />
      )}

      <AnimatePresence>
        {viewIndex !== null && (
          <StoryViewer 
            stories={stories} 
            initialIndex={viewIndex} 
            onClose={() => setViewIndex(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Stories;