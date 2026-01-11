import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';
import socket from '../../services/socket';
import API from '../../services/api'; // 🔥 Used to fetch TURN credentials
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

export default function CallRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { add } = useToast();

  // Refs for persistent access inside closures/cleanup
  const myVideo = useRef(null);
  const peerVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null); 
  const initialized = useRef(false);

  // State
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
        // 1. 🔥 Fetch Secure TURN Credentials from Backend (Metered.ca)
        let iceServers = [];
        try {
            const turnRes = await API.get('/integrations/turn');
            iceServers = turnRes.data;
            console.log("✅ Loaded TURN servers for reliable connection");
        } catch (e) {
            console.warn("⚠️ Failed to load TURN servers, falling back to public STUN");
            iceServers = [
                { urls: 'stun:stun.l.google.com:19302' }, 
                { urls: 'stun:global.stun.twilio.com:3478' }
            ];
        }

        // 2. Get Local Media (Camera + Mic)
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(localStream);
        streamRef.current = localStream; // Save for cleanup

        if (myVideo.current) {
            myVideo.current.srcObject = localStream;
        }

        // 3. Connect to Socket Room
        if (!socket.connected) socket.connect();
        socket.emit('joinRoom', { room: roomId });

        // 4. Socket Event Listeners
        // Host: User joined, initiate peer connection
        socket.on('user-joined', ({ userId }) => {
          createPeer(userId, localStream, iceServers);
        });

        // Guest: Receive signal, answer peer connection
        socket.on('call:signal', ({ from, signal }) => {
          if (!peerRef.current) {
            answerPeer(from, signal, localStream, iceServers);
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
        add('Camera/Microphone access denied', { type: 'error' });
        navigate('/chat');
      }
    };

    initCall();

    return () => {
      // Cleanup Listeners
      socket.off('user-joined');
      socket.off('call:signal');
      socket.off('call:rejected');
      socket.off('call:ended');
      
      // Stop all tracks (Camera light off)
      if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
      }
      
      // Destroy Peer
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [roomId, navigate, add]);

  // --- WebRTC Logic ---

  const createPeer = (toSocketId, stream, iceServers) => {
    const peer = new Peer({
      initiator: true,
      trickle: false, // Set to true if connection is slow
      stream,
      config: { iceServers }, // 🔥 Inject Metered Credentials
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

  const answerPeer = (from, signal, stream, iceServers) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: { iceServers }, // 🔥 Inject Metered Credentials
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

  // --- Controls ---

  const toggleMute = () => {
    if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    }
  };

  const toggleVideo = () => {
    if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
        }
    }
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
        // STOP SHARING: Revert to Camera
        const videoTrack = stream.getVideoTracks()[0]; // Current screen track
        
        // Stop screen track
        videoTrack.stop(); 

        // Get Camera back
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];

        // Replace track in Peer Connection
        if (peerRef.current) {
            const sender = peerRef.current._pc.getSenders().find((s) => s.track.kind === 'video');
            if (sender) sender.replaceTrack(camTrack);
        }
        
        // Update local state
        const newStream = new MediaStream([camTrack, stream.getAudioTracks()[0]]);
        setStream(newStream);
        streamRef.current = newStream;
        if (myVideo.current) myVideo.current.srcObject = newStream;
        
        setIsScreenSharing(false);
    } else {
        // START SHARING
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            // Handle user clicking "Stop Sharing" via browser UI
            screenTrack.onended = () => {
                if (isScreenSharing) handleScreenShare(); 
            };

            // Replace track in Peer Connection
            if (peerRef.current) {
                const sender = peerRef.current._pc.getSenders().find((s) => s.track.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            }

            // Update local state
            const newStream = new MediaStream([screenTrack, stream.getAudioTracks()[0]]);
            setStream(newStream);
            streamRef.current = newStream;
            if (myVideo.current) myVideo.current.srcObject = newStream;

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
            <div className="text-white animate-pulse font-semibold text-lg flex flex-col items-center gap-2">
               <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
               Waiting for answer...
            </div>
        )}

        {/* Local Video (PiP) */}
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

      {/* Controls Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 md:gap-6 bg-gray-800/80 backdrop-blur-md p-4 rounded-full shadow-2xl z-30 border border-gray-700">
        <button 
            onClick={toggleMute} 
            className={`p-4 rounded-full transition ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
        </button>

        <button 
            onClick={toggleVideo}
            disabled={!stream || isScreenSharing}
            className={`p-4 rounded-full transition ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
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

        <button onClick={leaveCall} className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg shadow-red-600/30" title="End Call">
          <FaPhoneSlash size={20} />
        </button>
      </div>
    </div>
  );
}