// frontend/src/components/chat/AudioRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaTrash, FaPaperPlane, FaPlay, FaPause } from 'react-icons/fa';
import API from '../../services/api';

export default function AudioRecorder({ chatId, onSent, onFileReady }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // 🔥 NEW: Preview State
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  useEffect(() => {
      // Cleanup URL on unmount
      return () => { if(previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const file = new File([blob], "voice_note.webm", { type: "audio/webm" });
        
        if (onFileReady) {
            onFileReady(file);
            setAudioBlob(null);
        } else {
            setAudioBlob(blob);
            // 🔥 NEW: Create preview URL
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            audioRef.current.src = url;
            audioRef.current.onended = () => setIsPlaying(false);
        }
        
        chunks.current = [];
        stream.getTracks().forEach(t => t.stop());
      };
      
      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) { alert("Microphone access denied"); }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  // 🔥 NEW: Toggle Preview
  const togglePreview = () => {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
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
        if (onSent) onSent(res.data);
        discard();
    } catch (e) { console.error(e); } 
    finally { setUploading(false); }
  };

  if (onFileReady) {
      return (
        <button type="button" onClick={recording ? stopRecording : startRecording} className={`p-2 rounded-full transition-all ${recording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-indigo-500'}`}>
          {recording ? <FaStop /> : <FaMicrophone size={18} />}
        </button>
      );
  }

  return (
    <div className="flex items-center gap-2">
      {audioBlob ? (
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 p-1.5 pr-3 rounded-full border border-indigo-100 dark:border-indigo-800 transition-all">
          <button onClick={discard} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition"><FaTrash size={10}/></button>
          
          {/* 🔥 NEW: Preview Button */}
          <button onClick={togglePreview} className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 min-w-[60px]">
             {isPlaying ? <FaPause size={10} /> : <FaPlay size={10} />} 
             {isPlaying ? 'Playing' : 'Listen'}
          </button>

          <button onClick={sendAudioToChat} disabled={uploading} className="p-1.5 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition">
            {uploading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaPaperPlane size={10}/>}
          </button>
        </div>
      ) : (
        <button onClick={recording ? stopRecording : startRecording} className={`p-2 rounded-full transition-all ${recording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-indigo-500'}`}>
          {recording ? <FaStop /> : <FaMicrophone size={20} />}
        </button>
      )}
    </div>
  );
}