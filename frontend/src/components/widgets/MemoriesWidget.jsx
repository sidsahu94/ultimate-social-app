// frontend/src/components/widgets/MemoriesWidget.jsx
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-0 overflow-hidden mb-6 border-l-4 border-l-[#D4AF37] bg-[#070B14] border border-white/10 rounded-3xl shadow-xl">
      <div className="bg-[#0A111E] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
        On This Day
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 text-xs text-[#CBD5E1]/60">
            <span>{new Date(memory.createdAt).getFullYear()}</span> • <span>You shared a memory</span>
        </div>
        <p className="text-sm italic text-[#CBD5E1]">"{memory.content}"</p>
        {memory.images?.[0] && (
            <img src={memory.images[0]} alt="Memory" className="mt-3 rounded-2xl h-32 w-full object-cover border border-white/10" />
        )}
      </div>
    </motion.div>
  );
}
