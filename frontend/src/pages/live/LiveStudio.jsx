// frontend/src/pages/live/LiveStudio.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';
import { FaBroadcastTower, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaStopCircle, FaComments, FaHeart } from 'react-icons/fa';
import API from '../../services/api';
import socket from '../../services/socket';
import { useToast } from '../../components/ui/ToastProvider';

export default function LiveStudio() {
  const navigate = useNavigate();
  const { add: addToast } = useToast();
  const localRef = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef(new Map());

  const [room, setRoom] = useState(null);
  const [title, setTitle] = useState('SocialVerse Live Session');
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [viewersCount, setViewersCount] = useState(1);

  const cleanupPeers = () => {
    peersRef.current.forEach((peer) => {
      try { peer.destroy(); } catch (_) {}
    });
    peersRef.current.clear();
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      cleanupPeers();
      socket.off('live:viewer-joined');
      socket.off('live:comment');
      socket.off('live:superchat');
      socket.off('live:return');
    };
  }, []);

  const startBroadcast = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const r = await API.post('/live/start', { title });
      const roomId = r.data?.roomId || r.data?.data?.roomId;
      setRoom(roomId);
      setIsLive(true);

      if (!socket.connected) socket.connect();
      socket.emit('live:host', { roomId });

      socket.off('live:viewer-joined');
      socket.off('live:return');
      socket.off('live:comment');
      socket.off('live:superchat');

      socket.on('live:viewer-joined', (sid) => {
        setViewersCount((c) => c + 1);
        if (peersRef.current.has(sid)) {
          try { peersRef.current.get(sid).destroy(); } catch (_) {}
        }
        const peer = new Peer({ initiator: true, trickle: false, stream });
        peersRef.current.set(sid, peer);

        peer.on('signal', (data) => {
          socket.emit('live:signal', { to: sid, data, roomId });
        });
        peer.on('error', () => {
          peersRef.current.delete(sid);
        });
        peer.on('close', () => {
          peersRef.current.delete(sid);
        });
      });

      socket.on('live:return', ({ data, from }) => {
        const peer = peersRef.current.get(from);
        if (peer) {
          peer.signal(data);
        }
      });

      socket.on('live:comment', (payload) => {
        setComments((prev) => [...prev, payload]);
      });

      socket.on('live:superchat', (payload) => {
        setComments((prev) => [
          ...prev,
          { ...payload, isSuperchat: true },
        ]);
        addToast(`Superchat received: ${payload.amount} coins from ${payload.from?.name}!`, { type: 'success' });
      });

      addToast('Broadcast is now live!', { type: 'success' });
    } catch (err) {
      console.error('Broadcast start error:', err);
      addToast('Camera or microphone permission required to stream', { type: 'error' });
    }
  };

  const endBroadcast = async () => {
    if (room) {
      try {
        await API.post(`/live/end/${room}`);
      } catch (_) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    cleanupPeers();
    socket.off('live:viewer-joined');
    socket.off('live:comment');
    socket.off('live:superchat');
    socket.off('live:return');
    setIsLive(false);
    addToast('Stream concluded', { type: 'info' });
    navigate('/live/list');
  };

  const toggleMute = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const sendHostComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !room) return;
    socket.emit('live:comment', { roomId: room, message: commentInput.trim() });
    setCommentInput('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-12 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37]">
            <FaBroadcastTower /> Studio Broadcast
          </div>
          <h1 className="text-3xl font-black text-[#F7F7FC] tracking-tight">
            Live Production Studio
          </h1>
        </div>

        {isLive && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-[#052E24] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(185,28,28,0.5)] border border-[#10B981]">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> LIVE • {viewersCount} Viewers
            </div>
            <button
              onClick={endBroadcast}
              className="flex items-center gap-2 rounded-2xl bg-[#052E24]/90 hover:bg-[#10B981] px-4 py-2 text-xs font-bold text-white shadow-lg transition"
            >
              <FaStopCircle /> End Stream
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Monitor */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-2xl">
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
            />

            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center text-[#A5A9BB]">
                <FaVideoSlash size={48} />
              </div>
            )}

            {!isLive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-6 text-center text-[#F7F7FC] backdrop-blur-[4px]">
                <div>
                  <FaBroadcastTower size={48} className="mx-auto mb-3 text-[#10B981] animate-pulse drop-shadow-[0_0_20px_rgba(185,28,28,0.7)]" />
                  <h3 className="text-xl font-bold font-display">Ready to broadcast?</h3>
                  <p className="mt-1 text-sm text-[#CBD5E1]">Set your title below and click Go Live to begin</p>
                </div>
              </div>
            )}

            {/* Media controls bar */}
            {isLive && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-[#070B14]/80 border border-white/15 p-3 backdrop-blur-xl">
                <div className="flex gap-2">
                  <button
                    onClick={toggleMute}
                    className={`rounded-xl p-2.5 text-white transition ${isMuted ? 'bg-[#052E24]' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`rounded-xl p-2.5 text-white transition ${isVideoOff ? 'bg-[#052E24]' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {isVideoOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isLive && (
            <div className="rounded-[28px] border border-white/10 bg-[#070B14]/90 p-6 shadow-xl backdrop-blur-xl">
              <label className="block text-xs font-bold uppercase text-[#A5A9BB] mb-2 tracking-wider">Stream Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your broadcast a title..."
                className="w-full rounded-2xl border border-white/10 bg-[#0A111E] p-3.5 text-sm text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/60 transition"
              />
              <button
                onClick={startBroadcast}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] py-3.5 font-bold text-white shadow-[0_4px_25px_rgba(29,78,216,0.35)] transition hover:opacity-95 active:scale-95"
              >
                <FaBroadcastTower /> Go Live Now
              </button>
            </div>
          )}
        </div>

        {/* Live Chat Panel */}
        <div className="flex flex-col h-[520px] rounded-[28px] border border-white/10 bg-[#070B14]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/10 p-4 bg-[#04070D]/60">
            <FaComments className="text-[#00F2FE]" />
            <h3 className="font-bold text-[#F7F7FC] text-sm">Live Discussion</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#A5A9BB]">
                Viewer comments and superchats will stream here in real time.
              </div>
            ) : (
              comments.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-3 text-xs border ${
                    c.isSuperchat
                      ? 'border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F4D49A] shadow-[0_0_15px_rgba(212,140,123,0.15)]'
                      : 'border-white/5 bg-[#0A111E]/80 text-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-[#F7F7FC]">{c.user?.name || c.from?.name || 'Viewer'}</span>
                    {c.isSuperchat && (
                      <span className="text-[#F4D49A] font-black">+{c.amount} Coins</span>
                    )}
                  </div>
                  <p className="text-[#CBD5E1] leading-relaxed">{c.message}</p>
                </div>
              ))
            )}
          </div>

          {isLive && (
            <form onSubmit={sendHostComment} className="border-t border-white/10 p-3 bg-[#04070D]/60 flex gap-2">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Message your audience..."
                className="flex-1 rounded-xl border border-white/10 bg-[#0A111E] px-3.5 py-2.5 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50"
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] px-4 py-2.5 text-xs font-bold text-white shadow hover:opacity-90 transition"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
