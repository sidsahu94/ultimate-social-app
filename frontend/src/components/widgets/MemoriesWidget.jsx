import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';

export default function MemoriesWidget() {
  const [memory, setMemory] = useState(null);

  useEffect(() => {
    API.get('/social/memories').then(r => {
      if(r.data && r.data.length > 0) setMemory(r.data[0]);
    }).catch(()=>{});
  }, []);

  if(!memory) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-0 overflow-hidden mb-6 border-l-4 border-l-indigo-500">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
        On This Day
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
            <span>{new Date(memory.createdAt).getFullYear()}</span> • <span>You shared a memory</span>
        </div>
        <p className="text-sm italic text-gray-700 dark:text-gray-300">"{memory.content}"</p>
        {memory.images?.[0] && (
            <img src={memory.images[0]} className="mt-3 rounded-lg h-32 w-full object-cover" />
        )}
      </div>
    </motion.div>
  );
}