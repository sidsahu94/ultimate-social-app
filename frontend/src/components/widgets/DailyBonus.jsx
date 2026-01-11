// frontend/src/components/widgets/DailyBonus.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaCoins } from 'react-icons/fa';
import API from '../../services/api';
import confetti from 'canvas-confetti';

export default function DailyBonus() {
  const [show, setShow] = useState(false);
  const [reward, setReward] = useState(0);

  useEffect(() => {
    const checkBonus = async () => {
      const lastClaim = localStorage.getItem('last_daily_bonus');
      const today = new Date().toDateString();

      if (lastClaim !== today) {
        // Simulating API call logic here. 
        // In real app, verify with backend `/api/wallet/daily-check`
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
      await API.post('/wallet/airdrop'); // Reuse airdrop as daily bonus logic
      localStorage.setItem('last_daily_bonus', new Date().toDateString());
      setShow(false);
    } catch(e) {}
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, y: 100 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-3xl shadow-2xl max-w-sm w-full mx-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-[22px] p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-32 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-b-full -mt-16" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">
                  <FaGift />
                </div>
                <h2 className="text-2xl font-black mb-2 text-gray-800 dark:text-white">Daily Reward!</h2>
                <p className="text-gray-500 mb-6">Come back every day to earn free coins.</p>
                
                <div className="text-4xl font-black text-yellow-500 mb-8 flex items-center justify-center gap-2">
                  +{reward} <FaCoins className="text-2xl" />
                </div>

                <button 
                  onClick={claim}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-500/40 hover:scale-105 transition"
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