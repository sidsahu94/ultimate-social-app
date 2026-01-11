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
  FaDesktop, 
  FaStopCircle
} from 'react-icons/fa';

// 🔥 UPDATED: ICE Server Config
// In production, you MUST uncomment the TURN section and fill in credentials.
// STUN alone only works ~80% of the time (fails on 4G/Corporate WiFi).
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' }, 
  { urls: 'stun:global.stun.twilio.com:3478' },
  // 🚨 UNCOMMENT FOR PRODUCTION:
  /*
  {
    urls: "turn:your-turn-server.com:3478",
    username: "user",
    credential: "password"
  }
  */
];

export default function CallRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { add } = useToast();

  const myVideo = useRef(null);
  const peerVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null); // 🔥 CRITICAL: Holds stream for cleanup
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
        let localStream;
        try {
            // Try Video + Audio
            localStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: true
            });
        } catch (videoErr) {
            console.warn("Video access denied, trying audio only...", videoErr);
            // Fallback to Audio Only
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            setIsVideoOff(true);
        }

        setStream(localStream);
        streamRef.current = localStream; // Save to ref for cleanup

        if (myVideo.current && localStream.getVideoTracks().length > 0) {
            myVideo.current.srcObject = localStream;
        }

        if (!socket.connected) socket.connect();
        socket.emit('joinRoom', { room: roomId });

        // Socket Listeners
        socket.on('user-joined', ({ userId }) => {
          createPeer(userId, localStream);
        });

        socket.on('call:signal', ({ from, signal }) => {
          if (!peerRef.current) {
            answerPeer(from, signal, localStream);
          } else {
            peerRef.current.signal(signal);
          }
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
        console.error("Media Error:", err);
        add('Microphone/Camera permission denied. Cannot join call.', { type: 'error' });
        navigate('/chat');
      }
    };

    initCall();

    return () => {
      socket.off('user-joined');
      socket.off('call:signal');
      socket.off('call:rejected');
      socket.off('call:ended');
      
      // 🔥 CRITICAL FIX: Explicitly stop all tracks to turn off hardware light
      if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
      }
      
      if (myVideo.current) myVideo.current.srcObject = null;
      if (peerVideo.current) peerVideo.current.srcObject = null;
      
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [roomId, navigate, add]);

  // --- PEER CONNECTION LOGIC ---

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

  // --- CONTROLS ---

  const toggleMute = () => {
    if (stream) {
        const track = stream.getAudioTracks()[0];
        if(track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        }
    }
  };

  const toggleVideo = () => {
    if (stream) {
        const track = stream.getVideoTracks()[0];
        if(track) {
            track.enabled = !track.enabled;
            setIsVideoOff(!track.enabled);
        }
    }
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
        // STOP SHARING: Revert to Camera
        const videoTrack = stream.getVideoTracks()[0];
        if (peerRef.current) {
            peerRef.current.replaceTrack(
                peerRef.current.streams[0].getVideoTracks()[0],
                videoTrack,
                stream
            );
        }
        
        if (myVideo.current) myVideo.current.srcObject = stream;
        setIsScreenSharing(false);
    } else {
        // START SHARING
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            // Handle user clicking "Stop Sharing" on browser UI
            screenTrack.onended = () => {
                if (isScreenSharing) handleScreenShare(); // Revert logic
            };

            const videoTrack = stream.getVideoTracks()[0];
            if (peerRef.current) {
                peerRef.current.replaceTrack(videoTrack, screenTrack, stream);
            }

            if (myVideo.current) myVideo.current.srcObject = screenStream;
            setIsScreenSharing(true);
        } catch (e) {
            console.error("Screen share failed", e);
        }
    }
  };

  const cleanupAndLeave = () => {
    navigate('/chat');
  };

  const leaveCall = () => {
    socket.emit('call:ended', { roomId }); 
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
            <div className="text-white animate-pulse font-semibold text-lg">Waiting for answer...</div>
        )}

        {/* Local Video */}
        {stream && !isVideoOff ? (
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
        ) : (
            <div className={`flex items-center justify-center bg-gray-800 rounded-xl border-2 border-gray-700 shadow-lg transition-all duration-300 ${callAccepted ? 'w-32 h-48 absolute bottom-24 right-6 z-20' : 'w-2/3 h-2/3 absolute opacity-50'}`}>
                <div className="text-white text-xs">Video Off</div>
            </div>
        )}

        {/* Status Indicator */}
        {isScreenSharing && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse z-30">
                You are sharing your screen
            </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 md:gap-6 bg-gray-800/80 backdrop-blur-md p-4 rounded-full shadow-2xl z-30 border border-gray-700">
        <button 
            onClick={toggleMute} 
            className={`p-4 rounded-full transition ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
        >
          {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
        </button>

        <button 
            onClick={toggleVideo}
            disabled={!stream || isScreenSharing} // Disable camera toggle while sharing
            className={`p-4 rounded-full transition ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
        </button>

        <button 
            onClick={handleScreenShare}
            className={`p-4 rounded-full transition ${isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            title="Share Screen"
        >
          {isScreenSharing ? <FaStopCircle size={20} /> : <FaDesktop size={20} />}
        </button>

        <button onClick={leaveCall} className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg shadow-red-600/30">
          <FaPhoneSlash size={20} />
        </button>
      </div>
    </div>
  );
}