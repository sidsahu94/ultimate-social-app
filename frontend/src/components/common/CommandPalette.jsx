// frontend/src/components/common/CommandPalette.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaSearch,
  FaHashtag,
  FaBolt,
  FaVideo,
  FaMoon,
  FaWallet,
  FaBell,
  FaCog,
  FaFeatherAlt,
  FaCompass,
  FaLayerGroup,
  FaRegClock,
  FaSignal,
  FaGamepad,
  FaShieldAlt,
  FaComments,
  FaBookmark,
  FaUser
} from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeProvider';
import { playCyberClick } from '../../utils/soundEffects';

export default function CommandPalette({ onOpenAdminPortal }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const nav = useNavigate();
  const { toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playCyberClick();
        setOpen((o) => !o);
        return;
      }
      if (e.key === 'Escape') setOpen(false);
    };

    const handleCustomOpen = () => {
      playCyberClick();
      setOpen(true);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('openCommandPalette', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('openCommandPalette', handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const actions = useMemo(
    () => [
      {
        id: 'feed',
        title: 'Feed & Live Moments',
        hint: 'Editorial timeline',
        keywords: ['home', 'feed', 'timeline', 'posts'],
        icon: <FaHashtag />,
        action: () => nav('/'),
      },
      {
        id: 'explore',
        title: 'Explore & Trending',
        hint: 'Discover creators & tags',
        keywords: ['discover', 'search', 'explore', 'trending'],
        icon: <FaCompass />,
        action: () => nav('/explore'),
      },
      {
        id: 'reels',
        title: 'Cinematic Reels',
        hint: 'High-energy short-form video',
        keywords: ['reels', 'video', 'clips', 'motion'],
        icon: <FaBolt />,
        action: () => nav('/reels'),
      },
      {
        id: 'stories',
        title: 'Active Stories',
        hint: '24-hour visual narratives',
        keywords: ['stories', 'story'],
        icon: <FaRegClock />,
        action: () => nav('/stories'),
      },
      {
        id: 'live',
        title: 'Live Studios & Audio Lounges',
        hint: 'Real-time broadcast spaces',
        keywords: ['live', 'stream', 'broadcast', 'spaces'],
        icon: <FaVideo />,
        action: () => nav('/live/list'),
      },
      {
        id: 'chat',
        title: 'Encrypted Quantum Chat',
        hint: 'E2EE messaging & calls',
        keywords: ['chat', 'messages', 'direct', 'talk'],
        icon: <FaComments />,
        action: () => nav('/chat'),
      },
      {
        id: 'wallet',
        title: 'Creator Wallet & Ledger',
        hint: 'Balance, daily bonus & tips',
        keywords: ['wallet', 'coins', 'balance', 'bonus'],
        icon: <FaWallet />,
        action: () => nav('/wallet'),
      },
      {
        id: 'market',
        title: 'Creator Marketplace',
        hint: 'Exclusive digital assets & shop',
        keywords: ['shop', 'market', 'sell', 'buy', 'product'],
        icon: <FaLayerGroup />,
        action: () => nav('/shop'),
      },
      {
        id: 'games',
        title: 'Arcade Zone',
        hint: 'Cyber Snake, 2048 & Trivia',
        keywords: ['games', 'arcade', 'snake', '2048', 'leaderboard'],
        icon: <FaGamepad />,
        action: () => nav('/games'),
      },
      {
        id: 'saved',
        title: 'Saved Editorial Artifacts',
        hint: 'Curated collection',
        keywords: ['saved', 'bookmarks', 'favorites'],
        icon: <FaBookmark />,
        action: () => nav('/saved'),
      },
      {
        id: 'notifications',
        title: 'Activity & Notifications',
        hint: 'Alerts and interactions',
        keywords: ['notifications', 'activity', 'alerts'],
        icon: <FaBell />,
        action: () => nav('/notifications'),
      },
      {
        id: 'create',
        title: 'Compose Moment',
        hint: 'Share with community',
        keywords: ['create', 'post', 'composer', 'write'],
        icon: <FaFeatherAlt />,
        action: () => window.dispatchEvent(new CustomEvent('openCreatePost')),
      },
      {
        id: 'settings',
        title: 'Settings & Security Enclave',
        hint: 'Preferences & privacy controls',
        keywords: ['settings', 'preferences', 'privacy', 'security'],
        icon: <FaCog />,
        action: () => nav('/settings'),
      },
    ],
    [nav]
  );

  const isSecretAdminQuery = ['admin', 'sudo', 'architect', 'matrix', 'override'].includes(
    query.trim().toLowerCase()
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => {
      const haystack = `${a.title} ${a.hint} ${a.keywords.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [actions, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const execute = (action) => {
    playCyberClick();
    action?.();
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isSecretAdminQuery) {
        setOpen(false);
        setQuery('');
        if (onOpenAdminPortal) {
          onOpenAdminPortal();
        } else {
          window.dispatchEvent(new CustomEvent('openAdminGateway'));
        }
      } else if (filtered[activeIndex]) {
        execute(filtered[activeIndex].action);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/85 px-4 pt-[16vh] backdrop-blur-2xl"
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-[rgba(226,232,240,0.18)] bg-[#070B14]/95 shadow-[0_40px_120px_rgba(0,0,0,0.85)] text-[#F8FAFC] backdrop-blur-3xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Holographic specular glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-96 rounded-full bg-[#1D4ED8]/20 blur-3xl" />

            <div className="flex items-center gap-3 border-b border-[rgba(226,232,240,0.1)] px-5 py-4 bg-[#04070D]/85">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#04070D] border border-[rgba(226,232,240,0.12)] text-[#00F2FE] shadow-[0_0_15px_rgba(100,223,223,0.3)]">
                <FaSearch />
              </div>
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type command, destination, or keyword… (Ctrl+K)"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[#F8FAFC] outline-none placeholder:text-[#CBD5E1]/40"
              />
              <div className="rounded-full border border-[rgba(226,232,240,0.15)] bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wide text-[#CBD5E1]/70">
                ESC
              </div>
            </div>

            {/* Secret Admin Command Banner */}
            {isSecretAdminQuery && (
              <div
                onClick={() => {
                  setOpen(false);
                  setQuery('');
                  if (onOpenAdminPortal) {
                    onOpenAdminPortal();
                  } else {
                    window.dispatchEvent(new CustomEvent('openAdminGateway'));
                  }
                }}
                className="mx-3 mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-[#052E24]/60 bg-gradient-to-r from-[#052E24]/30 via-[#1D4ED8]/20 to-[#00F2FE]/10 p-3.5 shadow-[0_0_25px_rgba(185,28,28,0.4)] transition hover:border-[#00F2FE]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#052E24] text-white shadow-lg">
                    <FaShieldAlt className="animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <span>ARCHITECT COMMAND ENCLAVE</span>
                      <span className="rounded bg-[#10B981] px-1.5 py-0.2 text-[9px] font-mono font-black tracking-widest">
                        RESTRICTED
                      </span>
                    </p>
                    <p className="text-[10px] text-[#CBD5E1]/80 font-mono">
                      Press [Enter] to initiate Quantum Clearance Terminal
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[#00F2FE]">&gt;&gt;</span>
              </div>
            )}

            <div className="max-h-[380px] overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {filtered.length === 0 && !isSecretAdminQuery ? (
                <div className="px-4 py-12 text-center text-sm text-[#CBD5E1]/50">
                  No matching destinations found.
                </div>
              ) : (
                filtered.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => execute(action.action)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex w-full items-center gap-4 rounded-[20px] px-4 py-3 text-left transition-all ${
                      index === activeIndex
                        ? 'bg-gradient-to-r from-[#1D4ED8]/20 via-[#052E24]/15 to-[#00F2FE]/10 ring-1 ring-[rgba(226,232,240,0.18)] shadow-silverGlass text-[#F8FAFC]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#04070D] border border-[rgba(226,232,240,0.12)] text-[#00F2FE] shadow-sm">
                      {action.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-[#F8FAFC] text-sm">{action.title}</div>
                      <div className="truncate text-xs text-[#CBD5E1]/60">{action.hint}</div>
                    </div>
                    <div className="rounded-full border border-[rgba(226,232,240,0.15)] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#CBD5E1]/70 font-mono">
                      Enter
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[rgba(226,232,240,0.1)] px-5 py-3 text-xs text-[#CBD5E1]/60 bg-[#04070D]/60 font-mono">
              <span className="flex items-center gap-1.5 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FE] animate-ping" />
                <span>ATLAS SHARD ONLINE &bull; 0.8ms</span>
              </span>
              <div className="flex items-center gap-3 text-[10px]">
                <span>&uarr;&darr; Navigate</span>
                <span>&crarr; Select</span>
                <span>ESC Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
