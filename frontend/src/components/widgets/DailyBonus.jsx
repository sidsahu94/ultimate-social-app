// frontend/src/components/widgets/DailyBonus.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaCoins } from 'react-icons/fa';
import API from '../../services/api';
import confetti from 'canvas-confetti';
import { useToast } from '../ui/ToastProvider';

export default function DailyBonus() {
  const [show, setShow] = useState(false);
  const [reward, setReward] = useState(0);
  const { add: addToast } = useToast();

  useEffect(() => {
    const checkBonus = async () => {
      const lastClaim = localStorage.getItem('last_daily_bonus');
      const today = new Date().toDateString();

      if (lastClaim !== today) {
        setTimeout(() => {
          setShow(true);
          setReward(50);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }, 1500);
      }
    };
    checkBonus();
  }, []);

  const claim = async () => {
    try {
      const res = await API.post('/wallet/claim-daily-bonus');
      const data = res.data?.data || res.data;
      
      if (data?.success) {
        addToast(`🎉 Claimed! New balance: ${data.newBalance}`, { type: 'success' });
        localStorage.setItem('last_daily_bonus', new Date().toDateString());
        setShow(false);
      } else {
        addToast(data?.error || 'Bonus already claimed today.', { type: 'info' });
        localStorage.setItem('last_daily_bonus', new Date().toDateString());
        setShow(false);
      }
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Something went wrong. Please try again later.";
      addToast(errMsg, { type: 'error' });
      localStorage.setItem('last_daily_bonus', new Date().toDateString());
      setShow(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, y: 100 }}
            className="p-[1px] bg-gradient-to-br from-[#D4AF37] via-[#F4D49A] to-[#14B8A6] rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.9)] max-w-sm w-full mx-4"
          >
            <div className="bg-[#070B14] rounded-[31px] p-8 text-center relative overflow-hidden border border-white/10">
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#F4D49A]/15 to-transparent rounded-b-full -mt-16 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-[#0A111E] text-[#F4D49A] border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner shadow-black/60">
                  <FaGift />
                </div>
                <h2 className="text-2xl font-black mb-2 text-[#F7F7FC] font-serif">Daily Reward!</h2>
                <p className="text-[#CBD5E1]/70 mb-6 text-sm">Return every day to claim exclusive collector credits.</p>
                
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F4D49A] to-[#D4AF37] mb-8 flex items-center justify-center gap-2">
                  +{reward} <FaCoins className="text-2xl text-[#F4D49A]" />
                </div>

                <button 
                  onClick={claim}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#0F766E] to-[#00F2FE] text-white font-bold tracking-wide shadow-lg shadow-blue-900/40 hover:opacity-95 transition"
                >
                  Claim Bonus
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
