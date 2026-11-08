// frontend/src/components/gamification/StreakQuestsModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaTimes, FaCoins, FaCheck, FaAward, FaBolt } from 'react-icons/fa';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { playCyberClick, playSuccessChord } from '../../utils/soundEffects';

export default function StreakQuestsModal({ isOpen, onClose }) {
  const [data, setData] = useState({
    streak: { count: 1, bestStreak: 1 },
    quests: []
  });
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const { add: addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadQuests();
    }
  }, [isOpen]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users/quests');
      if (res.data?.success) {
        setData({
          streak: res.data.streak || { count: 1, bestStreak: 1 },
          quests: res.data.quests || []
        });
      }
    } catch (err) {
      console.warn('Could not load quests:', err);
    } finally {
      setLoading(false);
    }
  };

  const claimQuest = async (questId) => {
    try {
      setClaimingId(questId);
      playCyberClick();
      const res = await API.post(`/users/quests/${questId}/claim`);
      if (res.data?.success) {
        playSuccessChord();
        addToast(res.data.message || 'Reward claimed!', { type: 'success' });
        setData((prev) => ({
          ...prev,
          quests: prev.quests.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
        }));
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to claim reward', { type: 'error' });
    } finally {
      setClaimingId(null);
    }
  };

  if (!isOpen) return null;

  const streakDays = data.streak?.count || 1;
  const streakTier =
    streakDays >= 30
      ? 'AETHERIA SOVEREIGN'
      : streakDays >= 14
      ? 'IMPERIAL EMERALD'
      : streakDays >= 7
      ? 'ELECTRIC OCEAN'
      : 'ROYAL OBSIDIAN';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-[rgba(0,242,254,0.22)] bg-gradient-to-br from-[#070B14] via-[#0A111E] to-[#04070D] p-6 text-[#F8FAFC] shadow-[0_25px_70px_rgba(0,0,0,0.95)] backdrop-blur-3xl ring-1 ring-white/10"
      >
        {/* Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#10B981]/25 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#00F2FE]/20 blur-[90px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-[#D4AF37]/15 blur-[100px]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#CBD5E1]/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          <FaTimes size={14} />
        </button>

        {/* Streak Header */}
        <div className="relative z-10 flex items-center gap-4 border-b border-white/10 pb-5">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#052E24] via-[#10B981] to-[#D4AF37] text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-[rgba(212,175,55,0.4)]">
            <FaFire size={32} className="animate-pulse text-[#FEF3C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                {streakTier}
              </span>
              <span className="rounded-full bg-[#00F2FE]/15 border border-[#00F2FE]/30 px-2 py-0.5 font-mono text-[9px] text-[#00F2FE]">
                AETHERIA PRESTIGE
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[#F8FAFC] font-display">
              {streakDays} Day Streak<span className="text-[#D4AF37]">.</span>
            </h2>
            <p className="text-xs text-[#CBD5E1]/70">
              Personal best: {data.streak?.bestStreak || streakDays} days in a row
            </p>
          </div>
        </div>

        {/* Quests Container */}
        <div className="relative z-10 mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1]/80 flex items-center gap-1.5">
              <FaBolt className="text-[#D4AF37]" /> Daily Action Quests
            </span>
            <span className="text-[10px] font-mono text-[#00F2FE]">RESETS AT MIDNIGHT</span>
          </div>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-[#CBD5E1]/50">
                Synchronizing daily ledger quests...
              </div>
            ) : data.quests.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#CBD5E1]/50">
                All daily quests completed! Check back tomorrow for new bounties.
              </div>
            ) : (
              data.quests.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-2xl border border-[rgba(0,242,254,0.12)] bg-[#04070D]/85 p-3.5 transition hover:border-[rgba(0,242,254,0.3)] shadow-inner"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-bold text-[#F8FAFC] truncate">{q.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-black text-[#D4AF37]">
                        <FaCoins size={10} className="text-[#F59E0B]" /> +{q.reward} Coins
                      </span>
                      <span className="text-[10px] text-[#CBD5E1]/50 font-mono">
                        Progress: {q.progress || 1}/{q.target || 1}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={q.claimed || claimingId === q.id}
                    onClick={() => claimQuest(q.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 cursor-pointer ${
                      q.claimed
                        ? 'bg-white/5 text-[#CBD5E1]/40 border border-white/5 cursor-default'
                        : 'bg-gradient-to-r from-[#00F2FE] via-[#1D4ED8] to-[#10B981] text-white shadow-md shadow-[#00F2FE]/25 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {q.claimed ? (
                      <>
                        <FaCheck size={11} className="text-[#10B981]" />
                        <span>Claimed</span>
                      </>
                    ) : claimingId === q.id ? (
                      'Claiming...'
                    ) : (
                      'Claim'
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="relative z-10 mt-5 rounded-2xl border border-dashed border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.03)] p-3 text-center text-[11px] text-[#CBD5E1]/70">
          Maintain your streak daily to multiply XP and unlock legendary Aetheria Imperial badges.
        </div>
      </motion.div>
    </div>
  );
}
