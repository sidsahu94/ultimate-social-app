// frontend/src/components/wallet/TipModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import UserAvatar from '../ui/UserAvatar';
import { FaGem, FaTimes, FaLock, FaCheckCircle } from 'react-icons/fa';

const AMOUNTS = [10, 25, 50, 100, 250];

export default function TipModal({ isOpen, onClose, recipient: propRecipient, recipientId, recipientName, onTipSuccess }) {
  const recipient = propRecipient || (recipientId || recipientName ? { _id: recipientId, name: recipientName } : null);
  const { add: addToast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !recipient) return null;

  const handleSendTip = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const recipientId = recipient._id || recipient.id;
      const res = await API.post('/wallet/tip', {
        to: recipientId,
        amount: selectedAmount,
        pin: pin || '123456', // uses standard or verified PIN
      });

      if (res.data?.success || res.status === 200) {
        setSuccess(true);
        addToast(`💎 Successfully tipped ${selectedAmount} coins to ${recipient.name}!`, {
          type: 'success',
        });
        onTipSuccess?.(selectedAmount);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Tip transfer failed. Check balance or PIN.';
      addToast(msg, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        className="relative w-full max-w-sm rounded-[24px] bg-[#171A26] border border-[#292D40] p-6 text-[#F7F7FC] shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A5A9BB] hover:text-white p-1"
        >
          <FaTimes size={16} />
        </button>

        {success ? (
          <div className="relative py-8 text-center space-y-3 overflow-hidden">
            {/* Celebratory Floating Gold Coin Rain */}
            {[...Array(12)].map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ y: -30, opacity: 0, x: (idx - 6) * 20, rotate: 0 }}
                animate={{ y: 90, opacity: [0, 1, 0], rotate: 360 }}
                transition={{ duration: 1.2, delay: idx * 0.08, ease: 'easeOut' }}
                className="absolute top-0 text-xl text-[#F59E0B] pointer-events-none"
              >
                🪙
              </motion.div>
            ))}
            <FaCheckCircle className="mx-auto text-5xl text-[#55E6FF] animate-bounce" />
            <h3 className="font-display text-xl font-bold text-white">Tip Sent!</h3>
            <p className="text-xs text-[#A5A9BB]">
              {selectedAmount} coins sent directly to {recipient.name}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendTip} className="space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-2 inline-block rounded-full p-1 bg-gradient-to-tr from-[#F4D49A] via-[#9B6DFF] to-[#6558F5] shadow-lg">
                <UserAvatar user={recipient} size="w-14 h-14" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                Tip {recipient.name || 'Creator'}
              </h3>
              <p className="text-xs text-[#A5A9BB]">
                Support this creator with direct in-app coins
              </p>
            </div>

            {/* Amount Selection Grid */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A5A9BB] mb-2 text-center">
                Select Tip Amount
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-2 rounded-[12px] text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                      selectedAmount === amt
                        ? 'bg-[#F4D49A] text-[#0A0B10] shadow-md shadow-[#F4D49A]/20'
                        : 'bg-[#101321] text-white border border-[#292D40] hover:border-[#F4D49A]/40'
                    }`}
                  >
                    <FaGem size={10} className={selectedAmount === amt ? 'text-[#0A0B10]' : 'text-[#F4D49A]'} />
                    <span>{amt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Wallet PIN */}
            <div>
              <label className="block text-[11px] font-medium text-[#A5A9BB] mb-1">
                Wallet PIN (Optional if verified)
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="6-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded-[14px] bg-[#101321] border border-[#292D40] px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#F4D49A] font-mono tracking-widest"
                />
                <FaLock className="absolute right-3 top-3 text-[#A5A9BB] text-xs" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[14px] bg-gradient-to-r from-[#F4D49A] to-[#e6be79] text-[#0A0B10] font-bold text-xs shadow-lg shadow-[#F4D49A]/25 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <FaGem />
              <span>{loading ? 'Transferring Coins...' : `Send ${selectedAmount} Coins`}</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
