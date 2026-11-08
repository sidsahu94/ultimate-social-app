// frontend/src/pages/chat/CallRoom.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Peer from 'simple-peer';
import socket from '../../services/socket';
import API from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaDesktop,
} from 'react-icons/fa';

const FALLBACK_ICE = [
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
  const streamRef = useRef(null);
  const initialized = useRef(false);

  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initCall = async () => {
      try {
        let iceServers = FALLBACK_ICE;
        try {
          const turnRes = await API.get('/integrations/turn');
          if (Array.isArray(turnRes.data) && turnRes.data.length > 0) {
            iceServers = turnRes.data;
          } else if (Array.isArray(turnRes.data?.data) && turnRes.data.data.length > 0) {
            iceServers = turnRes.data.data;
          }
        } catch (_) {}

        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(localStream);
        streamRef.current = localStream;

        if (myVideo.current) myVideo.current.srcObject = localStream;

        if (!socket.connected) socket.connect();
        socket.emit('joinRoom', { room: roomId });

        socket.on('user-joined', ({ userId }) => {
          createPeer(userId, localStream, iceServers);
        });

        socket.on('call:signal', ({ from, signal }) => {
          if (!peerRef.current) answerPeer(from, signal, localStream, iceServers);
          else peerRef.current.signal(signal);
        });

        socket.on('call:rejected', () => {
          add('Call rejected or busy', { type: 'error' });
          cleanupAndLeave();
        });

        socket.on('call:ended', () => {
          add('Call ended', { type: 'info' });
          cleanupAndLeave();
        });
      } catch (err) {
        console.error('Media Error:', err);
        add('Camera/Microphone access denied', { type: 'error' });
        navigate('/chat');
      }
    };

    initCall();

    return () => {
      socket.off('user-joined');
      socket.off('call:signal');
      socket.off('call:rejected');
      socket.off('call:ended');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (peerRef.current) peerRef.current.destroy();
    };
  }, [roomId, navigate, add]);

  const createPeer = (toSocketId, localStream, iceServers) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream,
      config: { iceServers },
    });

    peer.on('signal', (signal) => {
      socket.emit('call:signal', {
        to: toSocketId,
        from: socket.id,
        signal,
      });
    });

    peer.on('stream', (remoteStream) => {
      if (peerVideo.current) peerVideo.current.srcObject = remoteStream;
      setCallAccepted(true);
    });

    peerRef.current = peer;
  };

  const answerPeer = (from, signal, localStream, iceServers) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream,
      config: { iceServers },
    });

    peer.on('signal', (signalData) => {
      socket.emit('call:signal', {
        to: from,
        signal: signalData,
      });
    });

    peer.on('stream', (remoteStream) => {
      if (peerVideo.current) peerVideo.current.srcObject = remoteStream;
      setCallAccepted(true);
    });

    peer.signal(signal);
    peerRef.current = peer;
  };

  const toggleMute = () => {
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
    }
  };

  const handleScreenShare = async () => {
    if (!stream) return;

    if (isScreenSharing) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const camTrack = camStream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach((t) => t.stop());
        }

        if (peerRef.current?._pc) {
          const sender = peerRef.current._pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        }

        const newStream = new MediaStream([camTrack, audioTrack].filter(Boolean));
        setStream(newStream);
        streamRef.current = newStream;
        if (myVideo.current) myVideo.current.srcObject = newStream;
        setIsScreenSharing(false);
      } catch (err) {
        console.error('Failed reverting to camera stream:', err);
      }
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = () => {
        if (isScreenSharing) handleScreenShare();
      };

      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((t) => t.stop());
      }

      if (peerRef.current?._pc) {
        const sender = peerRef.current._pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      }

      const newStream = new MediaStream([screenTrack, stream.getAudioTracks()[0]].filter(Boolean));
      setStream(newStream);
      streamRef.current = newStream;
      if (myVideo.current) myVideo.current.srcObject = newStream;
      setIsScreenSharing(true);
    } catch (e) {
      console.error('Screen share failed', e);
    }
  };

  const cleanupAndLeave = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (_) {}
    }
    navigate('/chat');
  };

  const leaveCall = () => {
    socket.emit('call:ended', { roomId });
    cleanupAndLeave();
  };

  return (
    <div className="relative flex h-screen flex-col bg-[#04070D] text-[#F7F7FC] select-none">
      <div className="flex-1 overflow-hidden p-4 relative">
        {callAccepted ? (
          <video ref={peerVideo} autoPlay playsInline className="h-full w-full rounded-[28px] object-cover border border-white/10 shadow-2xl" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-base font-semibold text-[#CBD5E1]">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-[#00F2FE] shadow-[0_0_20px_rgba(100,223,223,0.3)]" />
            Connecting encrypted peer channel...
          </div>
        )}

        {stream && !isVideoOff ? (
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            className={`absolute bottom-28 right-6 z-20 rounded-3xl border border-white/20 object-cover shadow-2xl backdrop-blur-md ${
              callAccepted ? 'h-48 w-36 ring-2 ring-white/10' : 'h-2/3 w-2/3 opacity-50 blur-sm'
            }`}
          />
        ) : (
          <div className="absolute bottom-28 right-6 z-20 flex h-48 w-36 items-center justify-center rounded-3xl border border-white/15 bg-[#070B14]/90 text-center text-xs text-[#A5A9BB] shadow-2xl backdrop-blur-xl">
            Camera Off
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-white/10 bg-[#070B14]/90 px-6 py-5 backdrop-blur-2xl">
        <button 
          onClick={toggleMute} 
          className={`grid h-12 w-12 place-items-center rounded-2xl border transition-all ${
            isMuted 
              ? 'bg-[#052E24]/30 border-[#052E24]/40 text-[#F87171]' 
              : 'bg-[#0A111E] border-white/10 text-[#F7F7FC] hover:bg-white/10'
          }`}
        >
          {isMuted ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
        </button>
        <button 
          onClick={toggleVideo} 
          className={`grid h-12 w-12 place-items-center rounded-2xl border transition-all ${
            isVideoOff 
              ? 'bg-[#052E24]/30 border-[#052E24]/40 text-[#F87171]' 
              : 'bg-[#0A111E] border-white/10 text-[#F7F7FC] hover:bg-white/10'
          }`}
        >
          {isVideoOff ? <FaVideoSlash size={16} /> : <FaVideo size={16} />}
        </button>
        <button 
          onClick={handleScreenShare} 
          className={`grid h-12 w-12 place-items-center rounded-2xl border transition-all ${
            isScreenSharing 
              ? 'bg-[#0F766E]/30 border-[#0F766E]/40 text-[#00F2FE]' 
              : 'bg-[#0A111E] border-white/10 text-[#F7F7FC] hover:bg-white/10'
          }`}
        >
          <FaDesktop size={16} />
        </button>
        <button 
          onClick={leaveCall} 
          className="grid h-13 w-13 place-items-center rounded-2xl bg-[#052E24] text-white transition hover:bg-[#10B981] shadow-[0_0_20px_rgba(185,28,28,0.5)] border border-[#10B981]"
        >
          <FaPhoneSlash size={18} />
        </button>
      </div>
    </div>
  );
}
