// frontend/src/pages/chat/CallRoom.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';
import socket from '../../services/socket';
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
        myVideo.current.srcObject = localStream;

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
      } catch (err) {
        alert('Camera/Microphone permission denied');
        navigate('/chat');
      }
    };

    initCall();

    return () => {
      socket.off('user-joined');
      socket.off('call:signal');
      if (peerRef.current) peerRef.current.destroy();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, navigate]);

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
      peerVideo.current.srcObject = remoteStream;
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
      peerVideo.current.srcObject = remoteStream;
      setCallAccepted(true);
    });

    peer.signal(signal);
    peerRef.current = peer;
  };

  const toggleMute = () => {
    stream.getAudioTracks()[0].enabled =
      !stream.getAudioTracks()[0].enabled;
    setIsMuted(!stream.getAudioTracks()[0].enabled);
  };

  const toggleVideo = () => {
    stream.getVideoTracks()[0].enabled =
      !stream.getVideoTracks()[0].enabled;
    setIsVideoOff(!stream.getVideoTracks()[0].enabled);
  };

  const leaveCall = () => {
    if (peerRef.current) peerRef.current.destroy();
    navigate('/chat');
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative">
      <div className="flex-1 flex items-center justify-center gap-4 p-4">
        {callAccepted && (
          <video
            ref={peerVideo}
            autoPlay
            playsInline
            className="w-2/3 h-full object-cover rounded-xl"
          />
        )}

        <video
          ref={myVideo}
          autoPlay
          muted
          playsInline
          className={`object-cover rounded-xl ${
            callAccepted
              ? 'w-1/4 h-1/4 absolute bottom-24 right-4'
              : 'w-2/3 h-full'
          }`}
        />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-800 p-4 rounded-full">
        <button onClick={toggleMute}>
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>

        <button onClick={toggleVideo}>
          {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
        </button>

        <button onClick={leaveCall} className="text-red-500">
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
}
