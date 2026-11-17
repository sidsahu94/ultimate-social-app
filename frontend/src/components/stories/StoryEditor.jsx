// frontend/src/components/stories/StoryEditor.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaPaperPlane, FaFont, FaStar } from 'react-icons/fa';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { compressImage } from '../../utils/compressor';

const COLORS = ['#ffffff', '#000000', '#ff0055', '#00ccff', '#ffcc00'];
const FONT_STYLES = ['font-sans', 'font-serif', 'font-mono', 'italic font-black'];

export default function StoryEditor({ file, onClose, onPosted }) {
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [fontIndex, setFontIndex] = useState(0);
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const captionRef = useRef(null);
  const { add } = useToast();

  const isVideo = file?.type?.startsWith('video');

  // Generate stable preview
  useEffect(() => {
    if (!file) return;
    if (isVideo) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.onerror = () => setPreviewUrl(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    }
    return () => {
      // cleanup
    };
  }, [file, isVideo]);

  const cycleFontStyle = () => {
    setFontIndex((prev) => (prev + 1) % FONT_STYLES.length);
    if (captionRef.current) {
      captionRef.current.focus();
    }
  };

  const handlePost = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const fd = new FormData();
      
      let fileToSend = file;
      if (!isVideo) {
        try {
          fileToSend = await compressImage(file);
        } catch (err) {
          fileToSend = file;
        }
      }

      fd.append('media', fileToSend, file?.name || 'story.jpg');
      fd.append('caption', caption);
      fd.append('color', color); 
      
      if (isCloseFriends) {
        fd.append('privacy', 'close_friends');
      }

      await API.post('/stories', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      add('Story added to your ring!', { type: 'success' });
      if (onPosted) onPosted();
      if (onClose) onClose();
    } catch (e) {
      console.error('Story upload failed:', e);
      add(e.response?.data?.message || 'Failed to upload story', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col select-none overflow-hidden touch-none">
      {/* Top Bar with Typography, Color Swatches, and Instant Share Action */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-5 flex justify-between items-center z-30 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <button 
          type="button"
          onClick={onClose} 
          className="p-2.5 bg-black/60 rounded-full text-white backdrop-blur-md hover:bg-black/80 transition cursor-pointer"
        >
          <FaTimes size={16} />
        </button>

        <div className="flex gap-2.5 sm:gap-4 items-center">
          <button 
            type="button"
            onClick={cycleFontStyle} 
            title="Toggle Caption Typography"
            className="p-2.5 bg-black/60 rounded-full text-white backdrop-blur-md hover:bg-black/80 hover:text-[#00F2FE] transition cursor-pointer"
          >
            <FaFont size={15} />
          </button>

          <div className="flex gap-1.5 bg-black/60 p-1.5 rounded-full backdrop-blur-md border border-white/10">
            {COLORS.map(c => (
              <button 
                key={c} 
                type="button"
                onClick={() => setColor(c)} 
                className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Primary Top Header Post Button (Guaranteed Visible on All Devices) */}
          <button
            type="button"
            disabled={loading}
            onClick={handlePost}
            className="bg-gradient-to-r from-[#00F2FE] via-[#10B981] to-[#D4AF37] text-[#04070D] font-extrabold px-4 py-2 rounded-full text-xs shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            <FaPaperPlane size={11} />
            <span>{loading ? 'Posting...' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Story Media Canvas */}
      <div className="flex-1 relative flex items-center justify-center bg-[#070B14]">
        {previewUrl ? (
          isVideo ? (
            <video src={previewUrl} autoPlay loop playsInline className="w-full h-full object-contain" />
          ) : (
            <img 
              src={previewUrl} 
              alt="Story Preview" 
              className="w-full h-full object-contain" 
            />
          )
        ) : (
          <div className="w-10 h-10 border-2 border-[#00F2FE] border-t-transparent rounded-full animate-spin" />
        )}
        
        {/* Caption Input Overlay */}
        <div className="absolute bottom-24 sm:bottom-28 w-full px-6 text-center z-20">
          <input 
            ref={captionRef}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className={`bg-black/60 text-white p-3.5 rounded-2xl w-full max-w-md mx-auto text-center outline-none placeholder-white/50 backdrop-blur-md border border-white/15 shadow-2xl text-sm sm:text-base ${FONT_STYLES[fontIndex]}`}
            style={{ color: color }}
          />
        </div>
      </div>

      {/* Footer Bar with Close Friends and Dedicated Share Button */}
      <div className="p-4 pb-8 sm:pb-5 bg-black/85 backdrop-blur-2xl flex justify-between items-center z-30 border-t border-white/10 safe-area-inset-bottom">
        {/* Close Friends Toggle */}
        <button 
          type="button"
          onClick={() => setIsCloseFriends(!isCloseFriends)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition cursor-pointer ${
            isCloseFriends 
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' 
              : 'border-white/20 text-gray-300 hover:bg-white/10'
          }`}
        >
          <FaStar className={isCloseFriends ? 'text-emerald-400' : 'text-gray-400'} />
          <span className="text-xs font-semibold">Close Friends</span>
        </button>

        {/* Share Button (Bottom) */}
        <button 
          type="button"
          disabled={loading}
          onClick={handlePost} 
          className="bg-white text-black px-6 py-2.5 rounded-full font-black text-sm flex items-center gap-2 hover:bg-gray-200 active:scale-95 transition shadow-lg disabled:opacity-50 cursor-pointer"
        >
          <FaPaperPlane size={13} />
          <span>{loading ? 'Posting...' : 'Share Story'}</span>
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
