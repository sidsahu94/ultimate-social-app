import React, { useState } from 'react';
import { FaThumbtack, FaChevronDown, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function PinnedMessage({ messages, onUnpin }) {
  const [isOpen, setIsOpen] = useState(false);

  // If no pins, render nothing (takes 0 space)
  if (!messages || messages.length === 0) return null;

  const latest = messages[messages.length - 1];

  return (
    <div className="w-full z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b dark:border-gray-700 shadow-sm transition-all duration-300">
      
      {/* Collapsed View (Latest Pin) */}
      <div 
          className="flex items-center justify-between p-2 px-3 cursor-pointer text-xs h-10"
          onClick={() => setIsOpen(!isOpen)}
      >
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold min-w-fit">
              <FaThumbtack size={10} />
              <span>Pinned</span>
          </div>
          
          <div className="flex-1 mx-3 truncate text-gray-600 dark:text-gray-300 font-medium border-l-2 border-indigo-200 dark:border-indigo-900 pl-2">
              {latest.content || 'Media Attachment'}
          </div>
          
          <FaChevronDown className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Expanded View (All Pins) */}
      <AnimatePresence>
          {isOpen && (
              <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: 'auto' }} 
                  exit={{ height: 0 }} 
                  className="overflow-hidden bg-gray-50 dark:bg-black/20 border-t dark:border-gray-700"
              >
                  <div className="max-h-32 overflow-y-auto custom-scrollbar">
                    {messages.slice().reverse().map(m => (
                        <div key={m._id} className="p-2 px-3 border-b dark:border-gray-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                            <span className="text-xs truncate flex-1 text-gray-700 dark:text-gray-300">{m.content || 'Media'}</span>
                            {onUnpin && (
                                <button onClick={(e) => { e.stopPropagation(); onUnpin(m._id); }} className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                    <FaTimes size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}