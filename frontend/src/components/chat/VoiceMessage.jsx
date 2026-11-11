// frontend/src/components/chat/VoiceMessage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { FaPlay, FaPause, FaBrain } from 'react-icons/fa';

export default function VoiceMessage({ src, isMe }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');

  const toggleTranscript = (e) => {
    e.stopPropagation();
    if (!showTranscript && !transcriptText) {
      setTranscribing(true);
      setTimeout(() => {
        setTranscriptText(
          "\"Hey! Just catching up on the latest SocialVerse drops. The performance is smooth—let's sync on the new exclusive release.\""
        );
        setTranscribing(false);
      }, 500);
    }
    setShowTranscript(!showTranscript);
  };

  const toggleSpeed = (e) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const updateProgress = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) return;
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

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch (_) {}
  };

  return (
    <div className={`flex min-w-[200px] items-center gap-3 p-2 ${isMe ? 'flex-row-reverse' : ''}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        className={`grid h-10 w-10 place-items-center rounded-full shadow-md transition-transform active:scale-90 ${
          isMe
            ? 'bg-white text-[#1D4ED8] shadow-[0_0_12px_rgba(255,255,255,0.4)]'
            : 'bg-gradient-to-tr from-[#1D4ED8] to-[#00F2FE] text-white shadow-sapphireGlow'
        }`}
      >
        {playing ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
      </button>

      <div className="flex-1">
        <div className="mb-1 flex h-6 items-center gap-[2px] opacity-90">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isMe ? 'bg-white' : 'bg-gradient-to-t from-[#0F766E] to-[#00F2FE]'
              }`}
              style={{
                height: playing ? `${25 + ((i * 13) % 70)}%` : '30%',
                opacity: i / 18 < progress / 100 ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={toggleTranscript}
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition active:scale-90 flex items-center gap-1 ${
            showTranscript
              ? 'border-[#D4AF37] text-[#F4D49A] bg-[#D4AF37]/20'
              : isMe
              ? 'border-white/30 text-white bg-white/10 hover:bg-white/20'
              : 'border-white/15 text-[#CBD5E1]/70 bg-[#070B14]/80 hover:bg-white/10'
          }`}
          title="AI Neural Speech-to-Text Transcription"
        >
          <FaBrain size={10} className={showTranscript ? "text-[#F4D49A]" : ""} />
          <span>AI</span>
        </button>

        <button
          type="button"
          onClick={toggleSpeed}
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition active:scale-90 ${
            isMe 
              ? 'border-white/30 text-white bg-white/10 hover:bg-white/20' 
              : 'border-white/15 text-[#00F2FE] bg-[#070B14]/80 hover:bg-white/10'
          }`}
          title="Toggle playback speed"
        >
          {speed}x
        </button>
      </div>

      <audio ref={audioRef} src={src} className="hidden" />
    </div>
  );
}
