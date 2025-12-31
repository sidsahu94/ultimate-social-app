// frontend/src/pages/chat/CallRoom.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';
import socket from '../../services/socket';
import { useToast } from '../../components/ui/ToastProvider';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
} from 'react-icons/fa';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export default function CallRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { add } = useToast();

  const myVideo = useRef(null);
  const peerVideo = useRef(null);
  const peerRef = useRef(null);
  const initialized = useRef(false);

  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initCall = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(localStream);
        if (myVideo.current) {
            myVideo.current.srcObject = localStream;
        }

        if (!socket.connected) socket.connect();
        socket.emit('joinRoom', { room: roomId });

        // Host creates offer
        socket.on('user-joined', ({ userId }) => {
          createPeer(userId, localStream);
        });

        // Guest receives offer
        socket.on('call:signal', ({ from, signal }) => {
          if (!peerRef.current) {
            answerPeer(from, signal, localStream);
          } else {
            peerRef.current.signal(signal);
          }
        });

        // 🔥 WIRE UP: Handle Rejection/End
        socket.on('call:rejected', () => {
            add('Call rejected or busy', { type: 'error' });
            cleanupAndLeave();
        });

        socket.on('call:ended', () => {
            add('Call ended', { type: 'info' });
            cleanupAndLeave();
        });

      } catch (err) {
        console.error("Media Error:", err);
        add('Camera/Microphone permission denied', { type: 'error' });
        navigate('/chat');
      }
    };

    initCall();

    return () => {
      socket.off('user-joined');
      socket.off('call:signal');
      socket.off('call:rejected');
      socket.off('call:ended');
      // Cleanup tracks on unmount
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, navigate, add]);

  // HOST
  const createPeer = (toSocketId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS },
    });

    peer.on('signal', (signal) => {
      socket.emit('call:signal', {
        to: toSocketId,
        from: socket.id,
        signal,
      });
    });

    peer.on('stream', (remoteStream) => {
      if (peerVideo.current) {
          peerVideo.current.srcObject = remoteStream;
      }
      setCallAccepted(true);
    });

    peerRef.current = peer;
  };

  // GUEST
  const answerPeer = (from, signal, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS },
    });

    peer.on('signal', (signalData) => {
      socket.emit('call:signal', {
        to: from,
        signal: signalData,
      });
    });

    peer.on('stream', (remoteStream) => {
      if (peerVideo.current) {
          peerVideo.current.srcObject = remoteStream;
      }
      setCallAccepted(true);
    });

    peer.signal(signal);
    peerRef.current = peer;
  };

  const toggleMute = () => {
    if (stream) {
        stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
        setIsMuted(!stream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
        stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
        setIsVideoOff(!stream.getVideoTracks()[0].enabled);
    }
  };

  const cleanupAndLeave = () => {
    if (peerRef.current) peerRef.current.destroy();
    if (stream) stream.getTracks().forEach(t => t.stop());
    navigate('/chat');
    // window.location.reload(); // Optional: force refresh to clear WebRTC states if buggy
  };

  const leaveCall = () => {
    // Notify other peer
    socket.emit('call:rejected', { roomId }); // Reuse rejection event to signal end
    cleanupAndLeave();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative">
      <div className="flex-1 flex items-center justify-center gap-4 p-4 relative overflow-hidden">
        
        {/* Remote Video */}
        {callAccepted ? (
          <video
            ref={peerVideo}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
            <div className="text-white animate-pulse">Waiting for answer...</div>
        )}

        {/* Local Video (PiP) */}
        <video
          ref={myVideo}
          autoPlay
          muted
          playsInline
          className={`object-cover rounded-xl border-2 border-gray-700 shadow-lg bg-black transition-all duration-300
            ${callAccepted 
              ? 'w-32 h-48 absolute bottom-24 right-6 z-20' 
              : 'w-2/3 h-2/3 rounded-3xl opacity-50 blur-sm absolute' 
            }`}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6 bg-gray-800/80 backdrop-blur-md p-4 rounded-full shadow-2xl z-30 border border-gray-700">
        <button 
            onClick={toggleMute} 
            className={`p-4 rounded-full transition ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
        >
          {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
        </button>

        <button 
            onClick={toggleVideo}
            className={`p-4 rounded-full transition ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
        >
          {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
        </button>

        <button onClick={leaveCall} className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg shadow-red-600/30">
          <FaPhoneSlash size={20} />
        </button>
      </div>
    </div>
  );
}