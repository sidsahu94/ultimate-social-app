// frontend/src/pages/live/LiveWatch.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Peer from 'simple-peer';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaPaperPlane, FaCoins, FaUsers, FaArrowLeft, FaComments } from 'react-icons/fa';
import API from '../../services/api';
import socket from '../../services/socket';
import UserAvatar from '../../components/ui/UserAvatar';
import { useToast } from '../../components/ui/ToastProvider';

export default function LiveWatch() {
  const { roomId } = useParams();
  const remoteRef = useRef(null);
  const peerRef = useRef(null);
  const { add: addToast } = useToast();

  const [live, setLive] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [donationAmount, setDonationAmount] = useState(25);
  const [superchatMsg, setSuperchatMsg] = useState('');
  const [showSuperchatModal, setShowSuperchatModal] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const res = await API.get(`/live/${roomId}`);
        setLive(res.data?.data || res.data);
      } catch (e) {
        console.warn('Failed to load live info:', e);
      }
    };
    fetchStream();

    if (!socket.connected) socket.connect();
    socket.emit('live:viewer', { roomId });

    socket.on('live:signal', ({ data, from }) => {
      if (peerRef.current) {
        try { peerRef.current.destroy(); } catch (_) {}
      }
      const peer = new Peer({ initiator: false, trickle: false });
      peerRef.current = peer;

      peer.on('signal', (s) => socket.emit('live:return', { roomId, data: s }));
      peer.on('stream', (stream) => {
        if (remoteRef.current) remoteRef.current.srcObject = stream;
      });
      peer.on('error', () => {
        if (peerRef.current === peer) peerRef.current = null;
      });
      peer.on('close', () => {
        if (peerRef.current === peer) peerRef.current = null;
      });
      peer.signal(data);
    });

    socket.on('live:comment', (payload) => {
      setComments((prev) => [...prev, payload]);
    });

    socket.on('live:superchat', (payload) => {
      setComments((prev) => [
        ...prev,
        { ...payload, isSuperchat: true },
      ]);
      addToast(`Superchat: ${payload.from?.name} sent ${payload.amount} coins!`, { type: 'success' });
    });

    socket.on('live:reaction', () => {
      triggerHeart();
    });

    return () => {
      if (peerRef.current) {
        try { peerRef.current.destroy(); } catch (_) {}
        peerRef.current = null;
      }
      if (remoteRef.current?.srcObject) {
        try {
          remoteRef.current.srcObject.getTracks().forEach((track) => track.stop());
          remoteRef.current.srcObject = null;
        } catch (_) {}
      }
      socket.off('live:signal');
      socket.off('live:comment');
      socket.off('live:superchat');
      socket.off('live:reaction');
    };
  }, [roomId, addToast]);

  const triggerHeart = () => {
    const id = Date.now() + Math.random();
    setFloatingHearts((prev) => [...prev, { id, x: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  const sendReaction = () => {
    triggerHeart();
    socket.emit('live:reaction', { roomId });
  };

  const sendComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    socket.emit('live:comment', { roomId, message: commentInput.trim() });
    setCommentInput('');
  };

  const sendSuperchat = async () => {
    if (!donationAmount || donationAmount < 1) {
      addToast('Minimum superchat is 1 coin', { type: 'error' });
      return;
    }
    try {
      await API.post(`/live/${roomId}/superchat`, {
        amount: Number(donationAmount),
        message: superchatMsg.trim() || 'Superchat!',
      });
      addToast('Superchat sent to host!', { type: 'success' });
      setShowSuperchatModal(false);
      setSuperchatMsg('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Superchat failed. Check your coin balance.', { type: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 min-h-[calc(100vh-80px)] flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          to="/live/list"
          className="flex items-center gap-2 rounded-xl bg-[#070B14]/80 border border-white/10 px-3.5 py-2 text-xs font-bold text-[#CBD5E1] transition hover:text-white hover:bg-white/10"
        >
          <FaArrowLeft /> All Streams
        </Link>
        <div className="flex items-center gap-2 rounded-full bg-[#052E24] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(185,28,28,0.5)] border border-[#10B981]">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> LIVE
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 flex-1">
        {/* Stream Cinema Player */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-2xl">
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />

            {/* Floating Reactions Layer with Dark Red */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {floatingHearts.map((h) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 1, y: '85%', scale: 0.8 }}
                  animate={{ opacity: 0, y: '10%', scale: 1.4 }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  style={{ left: `${h.x}%` }}
                  className="absolute text-[#10B981] drop-shadow-[0_0_20px_rgba(185,28,28,0.8)] text-3xl"
                >
                  <FaHeart />
                </motion.div>
              ))}
            </div>

            {/* Overlay Reactions & Superchat Trigger */}
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <button
                onClick={() => setShowSuperchatModal(true)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4D49A] px-4 py-2 text-xs font-black text-slate-900 shadow-[0_4px_20px_rgba(212,140,123,0.4)] transition-transform hover:scale-105 active:scale-95"
              >
                <FaCoins /> Superchat
              </button>
              <button
                onClick={sendReaction}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#052E24]/90 text-white shadow-[0_0_20px_rgba(185,28,28,0.5)] border border-[#10B981] backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
              >
                <FaHeart size={18} />
              </button>
            </div>
          </div>

          {/* Host Info Bar */}
          <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-[#070B14]/90 p-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <UserAvatar src={live?.host?.avatar} name={live?.host?.name} className="h-11 w-11 border border-white/10" />
              <div>
                <h2 className="font-bold text-[#F7F7FC]">
                  {live?.title || 'Live Stream'}
                </h2>
                <p className="text-xs text-[#CBD5E1]">
                  {live?.host?.name || 'Creator'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Chat Panel */}
        <div className="flex flex-col h-[520px] rounded-[28px] border border-white/10 bg-[#070B14]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 p-4 bg-[#04070D]/60">
            <div className="flex items-center gap-2 font-bold text-[#F7F7FC] text-sm">
              <FaComments className="text-[#00F2FE]" /> Live Chat
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {comments.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#A5A9BB]">
                Welcome to the stream! Say hello to the creator.
              </div>
            ) : (
              comments.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-2.5 text-xs border ${
                    c.isSuperchat
                      ? 'border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F4D49A] shadow-[0_0_15px_rgba(212,140,123,0.15)]'
                      : 'border-white/5 bg-[#0A111E]/80 text-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-0.5">
                    <span className="text-[#F7F7FC] font-semibold">
                      {c.user?.name || c.from?.name || 'Viewer'}
                    </span>
                    {c.isSuperchat && (
                      <span className="text-[#F4D49A] font-black">+{c.amount} Coins</span>
                    )}
                  </div>
                  <p className="text-[#CBD5E1] leading-relaxed">{c.message}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendComment} className="border-t border-white/10 p-3 bg-[#171A26]/40 flex gap-2">
            <input
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Chat with everyone..."
              className="flex-1 rounded-xl border border-white/10 bg-[#0A111E] px-3.5 py-2.5 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50"
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      </div>

      {/* Superchat Modal */}
      <AnimatePresence>
        {showSuperchatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-[28px] border border-white/15 bg-[#070B14]/95 p-6 shadow-2xl backdrop-blur-2xl"
            >
              <h3 className="text-lg font-black text-[#F7F7FC] flex items-center gap-2">
                <FaCoins className="text-[#F4D49A]" /> Send Superchat
              </h3>
              <p className="mt-1 text-xs text-[#CBD5E1]">
                Support the creator and pin your message with a gold badge
              </p>

              <div className="mt-4">
                <label className="text-xs font-bold uppercase text-[#A5A9BB] tracking-wider">Coins Amount</label>
                <div className="mt-1.5 flex gap-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDonationAmount(amt)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                        donationAmount === amt
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#F4D49A] text-slate-900 shadow-md font-black'
                          : 'bg-[#171A26] border border-white/10 text-[#CBD5E1] hover:bg-white/10'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold uppercase text-[#A5A9BB] tracking-wider">Message</label>
                <input
                  value={superchatMsg}
                  onChange={(e) => setSuperchatMsg(e.target.value)}
                  placeholder="Say something awesome..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A111E] p-3 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSuperchatModal(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-xs font-bold text-[#A5A9BB] hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendSuperchat}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F4D49A] py-2.5 text-xs font-bold text-slate-900 shadow-lg hover:opacity-90 transition font-black"
                >
                  Send {donationAmount} Coins
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
