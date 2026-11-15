// frontend/src/components/stories/StoryEditor.jsx
import React, { useState, useRef } from 'react';
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
  const captionRef = useRef(null);
  const { add } = useToast();

  const previewUrl = file ? URL.createObjectURL(file) : null;
  const isVideo = file?.type.startsWith('video');

  const cycleFontStyle = () => {
    setFontIndex((prev) => (prev + 1) % FONT_STYLES.length);
    if (captionRef.current) {
      captionRef.current.focus();
    }
  };

  const handlePost = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      
      let fileToSend = file;
      if (!isVideo) {
          try {
            fileToSend = await compressImage(file);
          } catch (err) {
            console.warn("Compression skipped", err);
          }
      }

      fd.append('media', fileToSend);
      fd.append('caption', caption);
      fd.append('color', color); 
      
      if (isCloseFriends) {
        fd.append('privacy', 'close_friends');
      }

      await API.post('/stories', fd);
      add('Story added to your ring!', { type: 'success' });
      onPosted();
      onClose();
    } catch (e) {
      add('Failed to upload', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <button onClick={onClose} className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition">
          <FaTimes />
        </button>
        <div className="flex gap-4 items-center">
          <button 
            type="button"
            onClick={cycleFontStyle} 
            title="Toggle Caption Typography"
            className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 hover:text-[#00F2FE] transition"
          >
            <FaFont />
          </button>
          <div className="flex gap-2 bg-black/40 p-1.5 rounded-full backdrop-blur-md">
            {COLORS.map(c => (
              <button 
                key={c} 
                onClick={() => setColor(c)} 
                className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Preview */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900">
        {isVideo ? (
          <video src={previewUrl} autoPlay loop className="w-full h-full object-contain" />
        ) : (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
        )}
        
        <div className="absolute bottom-32 w-full px-8 text-center">
          <input 
            ref={captionRef}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className={`bg-black/50 text-white p-3 rounded-xl w-full text-center outline-none placeholder-gray-300 backdrop-blur-sm ${FONT_STYLES[fontIndex]}`}
            style={{ color: color }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-black/40 backdrop-blur-md flex justify-between items-center z-20">
        
        {/* Close Friends Toggle */}
        <button 
          onClick={() => setIsCloseFriends(!isCloseFriends)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
            isCloseFriends 
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' 
              : 'border-white/20 text-gray-300 hover:bg-white/5'
          }`}
        >
          <FaStar className={isCloseFriends ? 'text-emerald-400' : 'text-gray-400'} />
          <span className="text-xs">Close Friends Only</span>
        </button>

        {/* Share Button */}
        <button 
          disabled={loading}
          onClick={handlePost} 
          className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition disabled:opacity-50"
        >
          <FaPaperPlane /> {loading ? 'Posting...' : 'Share Story'}
        </button>
      </div>
    </div>
  );
}
