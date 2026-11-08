// frontend/src/components/chat/AudioRecorder.jsx
import React, { useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaStop, FaTrash, FaPaperPlane, FaPlay, FaPause } from 'react-icons/fa';
import API from '../../services/api';

export default function AudioRecorder({ chatId, onSent, onFileReady }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(new Audio());
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      try {
        audioRef.current.pause();
      } catch (_) {}
    };
  }, [previewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const file = new File([blob], 'voice_note.webm', { type: 'audio/webm' });

        if (onFileReady) {
          onFileReady(file);
          setAudioBlob(null);
        } else {
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          audioRef.current.src = url;
          audioRef.current.onended = () => setIsPlaying(false);
        }

        chunks.current = [];
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const togglePreview = () => {
    if (!audioRef.current.src) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying((v) => !v);
  };

  const discard = () => {
    setAudioBlob(null);
    setPreviewUrl(null);
    setIsPlaying(false);
  };

  const sendAudioToChat = async () => {
    if (!audioBlob || !chatId) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('audio', audioBlob, 'voice.webm');
    try {
      const res = await API.post(`/extra/voice/${chatId}`, fd);
      onSent?.(res.data);
      discard();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  if (onFileReady) {
    return (
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        className={`rounded-full p-2 transition-all ${
          recording ? 'bg-[#052E24] text-white shadow-[0_0_12px_rgba(139,0,24,0.6)] animate-pulse' : 'text-[#CBD5E1]/60 hover:text-[#00F2FE]'
        }`}
      >
        {recording ? <FaStop /> : <FaMicrophone size={18} />}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {audioBlob ? (
        <div className="flex items-center gap-2 rounded-full border border-[rgba(226,232,240,0.14)] bg-[#04070D] p-1.5 pr-3 transition-all">
          <button onClick={discard} className="rounded-full p-1.5 text-[#10B981] hover:bg-[#052E24]/15 transition-colors">
            <FaTrash size={10} />
          </button>

          <button onClick={togglePreview} className="flex min-w-[60px] items-center gap-2 text-xs font-bold text-[#D4AF37]">
            {isPlaying ? <FaPause size={10} /> : <FaPlay size={10} />}
            {isPlaying ? 'Playing' : 'Listen'}
          </button>

          <button
            onClick={sendAudioToChat}
            disabled={uploading}
            className="rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#00F2FE] p-1.5 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <FaPaperPlane size={10} />
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`rounded-full p-2 transition-all ${
            recording ? 'bg-[#052E24] text-white shadow-[0_0_15px_rgba(139,0,24,0.6)] animate-pulse' : 'text-[#CBD5E1]/60 hover:text-[#00F2FE]'
          }`}
        >
          {recording ? <FaStop /> : <FaMicrophone size={20} />}
        </button>
      )}
    </div>
  );
}
