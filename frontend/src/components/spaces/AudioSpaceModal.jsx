// frontend/src/components/spaces/AudioSpaceModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import socket from '../../services/socket';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import UserAvatar from '../ui/UserAvatar';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaHandPaper,
  FaTimes,
  FaHeadphones,
  FaUsers,
  FaCrown,
  FaBroadcastTower,
} from 'react-icons/fa';

export default function AudioSpaceModal({ space, isOpen, onClose, onSpaceEnded }) {
  const currentUser = useSelector((s) => s.auth?.user);
  const myId = currentUser?._id;
  const { add: addToast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [speakers, setSpeakers] = useState(space?.speakers || []);
  const [listeners, setListeners] = useState(space?.listeners || []);
  const [activeSpeakers, setActiveSpeakers] = useState({});

  const isHost = String(space?.host?._id || space?.host) === String(myId);
  const isSpeaker = speakers.some((s) => String(s._id || s) === String(myId));

  useEffect(() => {
    if (!space?._id || !isOpen) return;

    // Join room
    socket.emit('space:join', { spaceId: space._id, user: currentUser });

    const handleUserJoined = ({ user }) => {
      if (!user?._id) return;
      setListeners((prev) => {
        if (prev.some((p) => String(p._id) === String(user._id))) return prev;
        return [...prev, user];
      });
    };

    const handleUserLeft = ({ userId }) => {
      setListeners((prev) => prev.filter((p) => String(p._id || p) !== String(userId)));
      setSpeakers((prev) => prev.filter((p) => String(p._id || p) !== String(userId)));
    };

    const handleHandRaised = ({ user }) => {
      if (isHost && user) {
        addToast(`✋ ${user.name || 'A listener'} requested to speak`, { type: 'info' });
      }
    };

    const handleSpeakerPromoted = ({ targetUserId }) => {
      if (String(targetUserId) === String(myId)) {
        addToast('🎙️ You are now a speaker! Unmute to join the conversation.', { type: 'success' });
      }
    };

    const handleSpeaking = ({ userId, audioLevel }) => {
      setActiveSpeakers((prev) => ({
        ...prev,
        [userId]: audioLevel > 10,
      }));
    };

    socket.on('space:user-joined', handleUserJoined);
    socket.on('space:user-left', handleUserLeft);
    socket.on('space:hand-raised', handleHandRaised);
    socket.on('space:speaker-promoted', handleSpeakerPromoted);
    socket.on('space:speaking', handleSpeaking);

    // Simulate speaking audio level interval for host/speakers
    const micInterval = setInterval(() => {
      if (isSpeaker && !isMuted) {
        const fakeLevel = Math.random() > 0.4 ? Math.floor(Math.random() * 80) + 20 : 0;
        socket.emit('space:speaking', { spaceId: space._id, userId: myId, audioLevel: fakeLevel });
      }
    }, 400);

    return () => {
      clearInterval(micInterval);
      socket.emit('space:leave', { spaceId: space._id, userId: myId });
      socket.off('space:user-joined', handleUserJoined);
      socket.off('space:user-left', handleUserLeft);
      socket.off('space:hand-raised', handleHandRaised);
      socket.off('space:speaker-promoted', handleSpeakerPromoted);
      socket.off('space:speaking', handleSpeaking);
    };
  }, [space?._id, isOpen, myId, isSpeaker, isMuted, isHost, currentUser, addToast]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    addToast(!isMuted ? 'Microphone muted' : 'Microphone unmuted', { type: 'info' });
  };

  const handleRaiseHand = () => {
    setHasRaisedHand(true);
    socket.emit('space:raise-hand', { spaceId: space._id, user: currentUser });
    addToast('✋ Hand raised! Waiting for host approval.', { type: 'info' });
  };

  const handlePromote = (user) => {
    if (!isHost) return;
    setSpeakers((prev) => [...prev, user]);
    setListeners((prev) => prev.filter((l) => String(l._id) !== String(user._id)));
    socket.emit('space:promote-speaker', { spaceId: space._id, targetUserId: user._id });
    addToast(`Promoted ${user.name} to speaker`, { type: 'success' });
  };

  const handleEndSpace = async () => {
    if (!window.confirm('Are you sure you want to end this space?')) return;
    try {
      await API.post(`/spaces/${space._id}/end`);
      addToast('Audio space ended', { type: 'info' });
      onSpaceEnded?.();
      onClose();
    } catch (_) {
      onClose();
    }
  };

  if (!isOpen || !space) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[28px] bg-[#070B14]/95 border border-[rgba(226,232,240,0.18)] shadow-[0_24px_80px_rgba(0,0,0,0.85)] p-6 md:p-8 text-[#F8FAFC]"
        >
          {/* Ambient Lighting Layers */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#1D4ED8]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#052E24]/25 blur-3xl" />

          {/* Header */}
          <div className="relative z-10 flex items-start justify-between gap-4 border-b border-[rgba(226,232,240,0.1)] pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#10B981] mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#052E24]" />
                </span>
                <span className="text-[#F4D49A]">Live Audio Space • {space.topic}</span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]">
                {space.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[#CBD5E1]/60 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Speakers Section */}
          <div className="relative z-10 my-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <FaCrown className="text-[#F4D49A]" /> Stage Speakers ({speakers.length})
              </span>
              <div className="flex items-center gap-2 text-xs text-[#00F2FE] font-semibold bg-[#0F766E]/20 border border-[#0F766E]/40 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(100,223,223,0.2)]">
                <FaBroadcastTower className="animate-pulse" />
                <span className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 h-full bg-[#00F2FE] animate-pulse" />
                  <span className="w-0.5 h-2 bg-[#00F2FE] animate-ping" />
                  <span className="w-0.5 h-3 bg-[#00F2FE] animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-[#00F2FE] animate-bounce" />
                </span>
                <span>Live Spectrum</span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {speakers.map((spk) => {
                const spkId = String(spk._id || spk);
                const isSpeaking = activeSpeakers[spkId];
                return (
                  <div key={spkId} className="flex flex-col items-center text-center group">
                    <div className="relative mb-2">
                      <div
                        className={`rounded-full p-0.5 transition-all duration-300 ${
                          isSpeaking
                            ? 'ring-4 ring-[#00F2FE] shadow-[0_0_24px_rgba(100,223,223,0.8)]'
                            : 'ring-1 ring-[rgba(226,232,240,0.22)]'
                        }`}
                      >
                        <UserAvatar user={spk} size="w-16 h-16" />
                      </div>
                      {String(space.host?._id || space.host) === spkId && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D49A] text-[#04070D] text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                          Host
                        </div>
                      )}
                      {spkId === String(myId) && isMuted && (
                        <div className="absolute bottom-0 right-0 bg-[#052E24] text-white p-1 rounded-full text-[10px] shadow-[0_0_8px_rgba(139,0,24,0.6)]">
                          <FaMicrophoneSlash />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[#F8FAFC] max-w-[80px] truncate">
                      {spk.name || 'Speaker'}
                    </span>
                    <span className="text-[10px] text-[#CBD5E1]/60">
                      {isSpeaking ? (
                        <span className="text-[#00F2FE] font-bold">Speaking...</span>
                      ) : (
                        'Speaker'
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Listeners Section */}
          <div className="relative z-10 border-t border-[rgba(226,232,240,0.1)] pt-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1]/80 flex items-center gap-1.5">
                <FaHeadphones className="text-[#0F766E]" /> In the Audience ({listeners.length + 1})
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto no-scrollbar">
              {listeners.map((lst) => (
                <div
                  key={String(lst._id || lst)}
                  className="flex items-center gap-1.5 bg-[#04070D] border border-[rgba(226,232,240,0.12)] px-2.5 py-1 rounded-full text-xs text-[#F8FAFC] shadow-sm"
                >
                  <UserAvatar user={lst} size="w-5 h-5" />
                  <span className="max-w-[70px] truncate">{lst.name || 'User'}</span>
                  {isHost && (
                    <button
                      onClick={() => handlePromote(lst)}
                      title="Invite to speak"
                      className="ml-1 text-[#00F2FE] hover:underline text-[10px] font-bold"
                    >
                      + Mic
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Controls Bar */}
          <div className="relative z-10 flex items-center justify-between gap-3 border-t border-[rgba(226,232,240,0.1)] pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-[14px] bg-white/[0.06] hover:bg-white/[0.12] border border-[rgba(226,232,240,0.14)] text-[#CBD5E1] text-xs font-semibold transition-colors"
            >
              ✌️ Leave Quietly
            </button>

            <div className="flex items-center gap-2">
              {isSpeaker ? (
                <button
                  onClick={toggleMute}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-xs font-bold transition shadow-lg ${
                    isMuted
                      ? 'bg-[#052E24]/25 text-red-300 border border-[#052E24]/60 hover:bg-[#052E24]/40'
                      : 'bg-gradient-to-r from-[#1D4ED8] to-[#00F2FE] text-white shadow-[0_0_18px_rgba(100,223,223,0.4)] hover:opacity-95'
                  }`}
                >
                  {isMuted ? <FaMicrophoneSlash size={14} /> : <FaMicrophone size={14} />}
                  <span>{isMuted ? 'Unmute' : 'Mute Mic'}</span>
                </button>
              ) : (
                <button
                  onClick={handleRaiseHand}
                  disabled={hasRaisedHand}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold transition border ${
                    hasRaisedHand
                      ? 'bg-[#D4AF37]/25 text-[#F4D49A] border-[#D4AF37]/50 opacity-80'
                      : 'bg-white/[0.08] text-[#F8FAFC] border-[rgba(226,232,240,0.15)] hover:bg-white/[0.14]'
                  }`}
                >
                  <FaHandPaper className="text-[#D4AF37]" />
                  <span>{hasRaisedHand ? 'Hand Raised' : 'Raise Hand'}</span>
                </button>
              )}

              {isHost && (
                <button
                  onClick={handleEndSpace}
                  className="px-4 py-2.5 rounded-[14px] bg-[#052E24] hover:bg-[#10B981] text-white text-xs font-bold transition shadow-lg shadow-[#052E24]/40"
                >
                  End Space
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
