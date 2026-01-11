// frontend/src/components/chat/VoiceMessage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

export default function VoiceMessage({ src, isMe }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  return (
    <div className={`flex items-center gap-3 p-2 min-w-[200px] ${isMe ? 'flex-row-reverse' : ''}`}>
      <button 
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-transform active:scale-90 ${isMe ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}
      >
        {playing ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
      </button>
      
      <div className="flex-1 flex flex-col justify-center gap-1">
        {/* Fake Waveform Visual */}
        <div className="flex items-center gap-[2px] h-6 opacity-80">
            {[...Array(20)].map((_, i) => (
                <div 
                    key={i} 
                    className={`w-1 rounded-full transition-all duration-300 ${isMe ? 'bg-white' : 'bg-indigo-400'}`}
                    style={{ 
                        height: playing ? `${Math.random() * 100}%` : '30%',
                        opacity: i/20 < progress/100 ? 1 : 0.5 
                    }} 
                />
            ))}
        </div>
      </div>

      <audio ref={audioRef} src={src} className="hidden" />
    </div>
  );
}