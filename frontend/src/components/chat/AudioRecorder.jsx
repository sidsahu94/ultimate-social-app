// frontend/src/components/chat/AudioRecorder.jsx
import React, { useState, useRef } from 'react';
import { FaMicrophone, FaStop, FaTrash } from 'react-icons/fa';
import API from '../../services/api';

export default function AudioRecorder({ chatId, onSent }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
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
    const fd = new FormData();
    fd.append('audio', audioBlob); // Backend expects 'audio' field
    
    try {
        // We use the extra route for voice upload which handles cloud upload
        await API.post(`/extra/voice/${chatId}`, fd, { headers: { 'Content-Type': 'multipart/form-data'}});
        onSent(); // Refresh chat
        setAudioBlob(null);
    } catch (e) {
        console.error(e);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {audioBlob ? (
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full px-3">
          <span className="text-xs text-green-600 font-bold">Audio Ready</span>
          <button onClick={sendAudio} className="text-blue-500 font-bold text-sm">Send</button>
          <button onClick={() => setAudioBlob(null)} className="text-red-500"><FaTrash size={12}/></button>
        </div>
      ) : (
        <button 
          onClick={recording ? stopRecording : startRecording}
          className={`p-3 rounded-full transition-all ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
        >
          {recording ? <FaStop /> : <FaMicrophone />}
        </button>
      )}
    </div>
  );
}