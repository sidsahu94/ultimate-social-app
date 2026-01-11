// frontend/src/components/stories/StoryEditor.jsx
import React, { useState } from 'react';
import { FaTimes, FaPaperPlane, FaFont, FaPalette, FaStar } from 'react-icons/fa'; // 🔥 Added FaStar
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { compressImage } from '../../utils/compressor';

const COLORS = ['#ffffff', '#000000', '#ff0055', '#00ccff', '#ffcc00'];

export default function StoryEditor({ file, onClose, onPosted }) {
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [isCloseFriends, setIsCloseFriends] = useState(false); // 🔥 NEW State
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  const previewUrl = file ? URL.createObjectURL(file) : null;
  const isVideo = file?.type.startsWith('video');

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
      
      // 🔥 NEW: Send Privacy Flag
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
        <button onClick={onClose} className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md">
          <FaTimes />
        </button>
        <div className="flex gap-4">
          <button className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md"><FaFont /></button>
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
          <img src={previewUrl} className="w-full h-full object-contain" />
        )}
        
        <div className="absolute bottom-32 w-full px-8 text-center">
          <input 
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="bg-black/50 text-white p-3 rounded-xl w-full text-center outline-none placeholder-gray-300 backdrop-blur-sm"
            style={{ color: color }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 w-full flex justify-between items-center gap-4">
        
        {/* 🔥 NEW: Close Friends Toggle */}
        <button 
            onClick={() => setIsCloseFriends(!isCloseFriends)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${isCloseFriends ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-white/20 text-white'}`}
        >
            <FaStar /> {isCloseFriends ? 'Close Friends' : 'Everyone'}
        </button>

        <button 
          onClick={handlePost}
          disabled={loading}
          className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition shadow-lg shadow-white/20"
        >
          {loading ? 'Posting...' : <><FaPaperPlane /> Share</>}
        </button>
      </div>
    </div>
  );
}