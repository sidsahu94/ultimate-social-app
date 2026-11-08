// frontend/src/pages/wallet/WalletPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import API from '../../services/api';
import socket from '../../services/socket';
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaHistory,
  FaCopy,
  FaPaperPlane,
  FaSearch,
  FaLock,
  FaKey,
  FaCoins,
  FaMicrochip,
  FaShieldAlt,
  FaGift
} from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import UserAvatar from '../../components/ui/UserAvatar';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { playCyberClick, playSuccessChord } from '../../utils/soundEffects';

export default function WalletPage() {
  const currentUser = useSelector((s) => s.auth.user);
  const [data, setData] = useState({
    balance: 0,
    transactions: [],
    lastAirdrop: null,
    referralCode: 'LOADING...',
  });
  const [loading, setLoading] = useState(true);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState(10);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [claiming, setClaiming] = useState(false);

  const { add: addToast } = useToast();

  const filteredResults = useMemo(() => {
    return results.filter((u) => {
      const hay = `${u.name || ''} ${u.username || ''} ${u.email || ''}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });
  }, [query, results]);

  const load = async () => {
    try {
      const [walletRes, appsRes, pinRes] = await Promise.allSettled([
        API.get('/wallet/me'),
        API.get('/apps/wallet'),
        API.get('/wallet/pin/status'),
      ]);

      const walletData = walletRes.status === 'fulfilled' ? walletRes.value.data : null;
      const appsData = appsRes.status === 'fulfilled' ? appsRes.value.data : null;
      const pinData = pinRes.status === 'fulfilled' ? pinRes.value.data : null;

      const balance =
        walletData?.balance ??
        appsData?.data?.balance ??
        appsData?.balance ??
        0;

      const transactions =
        walletData?.transactions ??
        appsData?.data?.transactions ??
        appsData?.transactions ??
        [];

      setData((prev) => ({
        ...prev,
        balance,
        transactions,
        referralCode: walletData?.referralCode || appsData?.referralCode || prev.referralCode,
      }));

      setHasPin(Boolean(pinData?.hasPin));
    } catch (e) {
      console.warn('Wallet data partial load', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const onWalletUpdate = (update) => {
      if (update && typeof update.balance === 'number') {
        setData((prev) => ({ ...prev, balance: update.balance }));
        API.get('/apps/wallet')
          .then((res) => {
            setData((prev) => ({
              ...prev,
              transactions: res.data?.transactions || res.data?.data?.transactions || [],
            }));
          })
          .catch(() => {});
      }
    };

    socket?.on?.('wallet:update', onWalletUpdate);
    return () => socket?.off?.('wallet:update', onWalletUpdate);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setShowDropdown(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await API.get(`/users/search?q=${encodeURIComponent(query)}`);
        setResults(res.data?.data || res.data || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
        setShowDropdown(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  const copyReferral = async () => {
    try {
      playCyberClick();
      await navigator.clipboard.writeText(data.referralCode || '');
      addToast?.('Referral code copied to clipboard', { type: 'success' });
    } catch {
      addToast?.('Could not copy referral code', { type: 'error' });
    }
  };

  const sendTip = async () => {
    if (!recipientId.trim()) {
      addToast?.('Please choose a recipient', { type: 'error' });
      return;
    }

    if (!amount || amount <= 0) {
      addToast?.('Enter a valid coin amount', { type: 'error' });
      return;
    }

    try {
      playCyberClick();
      const payload = {
        recipientId,
        amount: Number(amount),
      };

      if (hasPin) {
        payload.pin = pinInput;
      } else if (newPin.trim()) {
        payload.newPin = newPin;
      }

      await API.post('/wallet/tip', payload);

      playSuccessChord();
      addToast?.('Creator tip transferred successfully!', { type: 'success' });
      setRecipientId('');
      setQuery('');
      setAmount(10);
      setPinInput('');
      setNewPin('');
      load();
    } catch (err) {
      addToast?.(err.response?.data?.message || 'Tip transfer failed', { type: 'error' });
    }
  };

  const claimDailyBonus = async () => {
    setClaiming(true);
    playCyberClick();
    try {
      const res = await API.post('/wallet/claim-daily-bonus');
      playSuccessChord();
      addToast?.(`Daily bonus claimed! Balance: ${res.data?.newBalance ?? data.balance} Coins`, {
        type: 'success',
      });
      load();
    } catch (err) {
      addToast?.(err.response?.data?.error || err.response?.data?.message || 'Daily bonus already claimed today', {
        type: 'error',
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 font-sans text-[#F7F7FC] pb-24">
      {/* 3D Holographic Titanium Metal VIP Card */}
      <div className="relative mb-8 overflow-hidden rounded-[32px] border border-[rgba(226,232,240,0.18)] bg-gradient-to-br from-[#070B14] via-[#0A111E] to-[#04070D] p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-3xl ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1D4ED8]/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#052E24]/25 blur-[100px]" />
        <div className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 rounded-full bg-[#00F2FE]/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#04070D] border border-white/15 text-[#F4D49A] shadow-[0_0_25px_rgba(244,212,154,0.3)]">
              <FaWallet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00F2FE]">
                  DIGITAL LEDGER &bull; SECURE VAULT
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] text-[#D4AF37]">
                  TITANIUM VIP
                </span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight text-[#F7F7FC]">
                Creator Treasury<span className="text-[#D4AF37]">.</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2">
              <FaMicrochip className="text-[#F4D49A]" />
              <span className="text-[#CBD5E1]/70">CIPHER PROTOCOL</span>
            </div>
            <button
              onClick={copyReferral}
              className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-[#00F2FE] hover:bg-white/10 transition"
            >
              <FaCopy /> {data.referralCode}
            </button>
          </div>
        </div>

        {/* Balance & Bonus Stats */}
        <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-3">
          {/* Card 1: Balance */}
          <div className="rounded-[22px] border border-white/10 bg-[#04070D]/80 p-5 shadow-silverGlass">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#CBD5E1]/70">
              Treasury Balance
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl md:text-4xl font-black text-[#F4D49A] drop-shadow-[0_0_20px_rgba(244,212,154,0.4)]">
                {data.balance}
              </span>
              <span className="text-xs font-bold text-[#CBD5E1]/60">COINS</span>
            </div>
            <span className="mt-1 block text-[10px] text-[#00F2FE]">Instant P2P Liquidity</span>
          </div>

          {/* Card 2: Security Pin */}
          <div className="rounded-[22px] border border-white/10 bg-[#04070D]/80 p-5 shadow-silverGlass flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#CBD5E1]/70">
                Security Enclave
              </span>
              <div className="mt-1 flex items-center gap-2 font-mono text-xs text-[#F8FAFC]">
                <FaLock className="text-[#00F2FE]" />
                <span>{hasPin ? 'PIN Enclave Active' : 'No PIN Configured'}</span>
              </div>
            </div>
            <span className="mt-1 block text-[10px] text-[#CBD5E1]/50">
              Zero-knowledge authorization
            </span>
          </div>

          {/* Card 3: Daily Activity Reward */}
          <div className="rounded-[22px] border border-white/10 bg-gradient-to-br from-[#1D4ED8]/20 via-[#052E24]/15 to-[#D4AF37]/20 p-5 shadow-silverGlass flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F8FAFC]">
                Daily Activity Reward
              </span>
              <FaGift className="text-[#F4D49A]" />
            </div>
            <button
              onClick={claimDailyBonus}
              disabled={claiming}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#1D4ED8]/30 transition hover:scale-[1.02] active:scale-98 disabled:opacity-50"
            >
              {claiming ? 'Claiming Reward...' : 'Claim 100 Free Coins'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Send Tip & Transaction Ledger */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Send Tip Section */}
        <div className="rounded-[28px] border border-white/10 bg-[#070B14]/90 p-6 md:p-7 shadow-silverGlass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-2 text-[#F7F7FC]">
            <FaPaperPlane className="text-[#00F2FE]" />
            <h2 className="text-lg font-bold font-display">Direct Creator Tipping</h2>
          </div>

          <div className="relative">
            <div className="mb-3.5 flex items-center gap-2.5 rounded-2xl bg-[#04070D] border border-white/15 px-4 py-3 focus-within:border-[#00F2FE] transition">
              <FaSearch className="text-[#CBD5E1]/50" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setRecipientId('');
                }}
                placeholder="Search recipient creator by name or username..."
                className="w-full bg-transparent outline-none text-[#F7F7FC] placeholder-[#CBD5E1]/40 text-sm"
              />
            </div>

            {showDropdown && filteredResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-2xl border border-white/15 bg-[#070B14] p-2 shadow-2xl backdrop-blur-2xl">
                {filteredResults.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => {
                      setRecipientId(u._id);
                      setQuery(u.name || u.username || u.email || '');
                      setShowDropdown(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/10 transition cursor-pointer"
                  >
                    <UserAvatar src={u.avatar} name={u.name} className="h-8 w-8" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-xs text-[#F7F7FC]">{u.name}</div>
                      <div className="truncate text-[10px] text-[#CBD5E1]/60">
                        @{u.username || u.email?.split('@')[0]}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3.5 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#CBD5E1]">
                Transfer Amount (Coins)
              </span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl bg-[#04070D] border border-white/15 px-4 py-3 outline-none text-[#F7F7FC] focus:border-[#00F2FE] text-sm"
              />
            </label>

            {hasPin ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#CBD5E1]">
                  Security PIN
                </span>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full rounded-xl bg-[#04070D] border border-white/15 px-4 py-3 outline-none text-[#F7F7FC] focus:border-[#00F2FE] text-sm"
                />
              </label>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#CBD5E1]">
                  Set Security PIN
                </span>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Create 4-digit PIN"
                  className="w-full rounded-xl bg-[#04070D] border border-white/15 px-4 py-3 outline-none text-[#F7F7FC] placeholder-[#CBD5E1]/40 focus:border-[#00F2FE] text-sm"
                />
              </label>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={sendTip}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#1D4ED8]/30 hover:opacity-95 transition text-sm cursor-pointer"
            >
              Transfer Coins
            </button>
            <button
              onClick={load}
              className="rounded-xl bg-white/5 border border-white/10 px-5 py-3.5 font-semibold text-[#CBD5E1] hover:bg-white/10 transition text-sm cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {recipientId && (
            <div className="mt-3.5 text-xs text-[#00F2FE] font-mono">
              Target creator address confirmed: {recipientId}
            </div>
          )}
        </div>

        {/* Transaction History Section */}
        <div className="rounded-[28px] border border-white/10 bg-[#070B14]/90 p-6 md:p-7 shadow-silverGlass backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F7F7FC]">
              <FaHistory className="text-[#D4AF37]" />
              <h2 className="text-lg font-bold font-display">Treasury Ledger</h2>
            </div>
            <span className="text-[10px] font-mono text-[#CBD5E1]/50">P2P AUDIT LOG</span>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar">
            {(data.transactions || []).length === 0 ? (
              <div className="rounded-2xl bg-[#04070D] border border-white/10 p-8 text-xs text-[#CBD5E1]/50 text-center">
                No ledger activity recorded yet.
              </div>
            ) : (
              (data.transactions || []).map((tx) => {
                const isCredit =
                  tx.type === 'credit' ||
                  tx.amount > 0 ||
                  tx.direction === 'in';

                return (
                  <div
                    key={tx._id || `${tx.createdAt}-${tx.amount}`}
                    className="flex items-center justify-between rounded-2xl bg-[#04070D] border border-white/5 p-3.5 hover:border-white/15 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-xs text-[#F7F7FC] truncate">
                        {tx.description || tx.note || 'Treasury Transaction'}
                      </div>
                      <div className="text-[10px] text-[#CBD5E1]/50">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Confirmed'}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold text-sm shrink-0 ${
                        isCredit ? 'text-[#14B8A6]' : 'text-[#10B981]'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{Math.abs(tx.amount || 0)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-3.5 text-[11px] text-[#CBD5E1]/60 flex items-center gap-2">
            <FaShieldAlt className="text-[#00F2FE] shrink-0" />
            <span>Cryptographic multi-factor PIN required for all coin deductions.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
