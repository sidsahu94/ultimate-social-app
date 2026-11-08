// frontend/src/pages/profile/AiAvatar.jsx
import React, { useState } from 'react';
import API from '../../services/api';
import { FaMagic, FaUpload, FaSpinner } from 'react-icons/fa';

export default function AiAvatar() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));
    setLoading(true);

    try {
      const form = new FormData();
      form.append('avatar', file);

      const r = await API.post('/extra/ai/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(r.data?.url || null);
    } catch (err) {
      console.error('AI avatar upload failed:', err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-4 md:p-6 pb-24">
      <div className="bg-[#070B14]/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F2FE] mb-1">
          <FaMagic /> Neural Synthesis
        </div>
        <h3 className="text-2xl font-bold text-[#F7F7FC] mb-2 font-display">AI Avatar Synthesis Studio</h3>
        <p className="text-xs text-[#CBD5E1] mb-6">Upload a portrait to transform it into an Aurora Noir digital representation.</p>
        
        <label className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer transition bg-[#0A111E] text-xs font-bold text-[#F7F7FC]">
          <FaUpload className="text-[#00F2FE]" />
          <span>Select Source Portrait</span>
          <input type="file" accept="image/*" onChange={upload} className="hidden" />
        </label>

        <div className="mt-6 flex flex-wrap gap-4 items-center justify-center">
          {image && (
            <div className="text-center">
              <span className="block text-[10px] text-[#A5A9BB] uppercase mb-1">Original</span>
              <img src={image} alt="Preview" className="h-32 w-32 rounded-2xl object-cover border border-white/10" />
            </div>
          )}
          {loading && (
            <div className="flex flex-col h-32 w-32 items-center justify-center rounded-2xl border border-white/10 bg-[#171A26] text-xs text-[#00F2FE] gap-2">
              <FaSpinner className="animate-spin text-lg" />
              <span>Generating...</span>
            </div>
          )}
          {result && (
            <div className="text-center">
              <span className="block text-[10px] text-[#00F2FE] uppercase font-bold mb-1">Synthesized</span>
              <img src={result} alt="Result" className="h-32 w-32 rounded-2xl object-cover ring-2 ring-[#00F2FE] shadow-[0_0_20px_rgba(100,223,223,0.3)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
