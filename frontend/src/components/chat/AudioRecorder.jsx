import React, { useState, useRef } from 'react';
import { FaMicrophone, FaStop, FaTrash } from 'react-icons/fa';
import API from '../../services/api';

export default function AudioRecorder({ chatId, onSent }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        chunks.current = [];
        // Stop all tracks to release mic
        stream.getTracks().forEach(t => t.stop());
      };
      
      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic error", err);
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('audio', audioBlob, 'voice-note.webm'); 
    
    try {
        // 1. Upload
        // Note: Ensure backend/routes/extra.js handles 'audio' fieldname in multer
        const res = await API.post(`/extra/voice/${chatId}`, fd, { 
            headers: { 'Content-Type': 'multipart/form-data'}
        });
        
        // 2. Trigger parent refresh or callback
        if (onSent) onSent(res.data); // Expecting the updated chat/message obj
        setAudioBlob(null);
    } catch (e) {
        console.error(e);
        alert("Failed to send audio");
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {audioBlob ? (
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 pr-3 rounded-full animate-fade-in">
          <button onClick={() => setAudioBlob(null)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><FaTrash size={12}/></button>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Audio Recorded</span>
          <button onClick={sendAudio} disabled={uploading} className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline ml-2">
            {uploading ? 'Sending...' : 'Send'}
          </button>
        </div>
      ) : (
        <button 
          type="button" // Prevent form submit
          onClick={recording ? stopRecording : startRecording}
          className={`p-2 rounded-full transition-all ${recording ? 'bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-lg' : 'text-gray-400 hover:text-indigo-500'}`}
        >
          {recording ? <FaStop /> : <FaMicrophone size={20} />}
        </button>
      )}
    </div>
  );
}