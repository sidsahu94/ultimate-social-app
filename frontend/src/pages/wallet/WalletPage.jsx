import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaGift, FaCopy } from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/ui/ToastProvider';

export default function WalletPage() {
  const [data, setData] = useState({ 
    balance: 0, 
    transactions: [],
    lastAirdrop: null, 
    referralCode: '...' 
  });
  const [loading, setLoading] = useState(true);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState(10);
  const { add: addToast } = useToast();

  const load = async () => {
    try {
      const walletRes = await API.get('/wallet/me');
      const appsRes = await API.get('/apps/wallet'); 
      
      setData({
        ...walletRes.data,
        transactions: appsRes.data?.transactions || []
      });
    } catch (e) {
      // Silent fail or minimal log
      console.warn("Wallet data partial load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleTransfer = async () => {
    if (!recipientId || amount <= 0) return addToast("Invalid details", { type: 'error' });
    try {
      await API.post('/wallet/tip', { to: recipientId, amount });
      addToast(`Sent ${amount} coins!`, { type: 'success' });
      load();
      setRecipientId('');
    } catch (e) {
      addToast(e.userMessage || "Transfer failed", { type: 'error' });
    }
  };

  const handleAirdrop = async () => {
    try {
      const res = await API.post('/wallet/airdrop');
      addToast(res.data.message, { type: 'success' });
      load();
    } catch (e) {
      addToast(e.userMessage || "Cooldown active", { type: 'error' });
    }
  };

  const isCooldown = data.lastAirdrop && (new Date() - new Date(data.lastAirdrop) < 24 * 60 * 60 * 1000);

  if (loading) return <div className="p-10 text-center"><Spinner /></div>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-center gap-2 opacity-80 mb-1">
            <FaWallet /> Total Balance
            </div>
            <div className="text-5xl font-bold mb-6">{(data.balance || 0).toLocaleString()} <span className="text-lg font-medium">Coins</span></div>
            
            <div className="flex gap-3">
            <button 
                onClick={handleAirdrop}
                disabled={isCooldown}
                className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${isCooldown ? 'bg-white/10 cursor-not-allowed opacity-70' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'}`}
            >
                <FaArrowDown /> {isCooldown ? 'Claimed' : 'Daily Bonus'}
            </button>
            <button className="flex-1 bg-white text-indigo-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition flex items-center justify-center gap-2">
                <FaArrowUp /> Withdraw
            </button>
            </div>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Transactions History */}
      <div className="card p-5">
        <div className="flex items-center gap-2 font-bold text-lg mb-4 text-gray-500">
          <FaHistory /> Recent Transactions
        </div>
        <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
          {(!data.transactions || data.transactions.length === 0) && <div className="text-center text-gray-400 py-4">No transactions yet</div>}
          {(data.transactions || []).map((tx, i) => (
            <div key={i} className="flex justify-between items-center border-b dark:border-gray-700 pb-3 last:border-0 last:pb-0">
              <div>
                <div className="font-semibold capitalize text-sm">{tx.description || tx.type}</div>
                <div className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</div>
              </div>
              <div className={`font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                {tx.type === 'credit' ? '+' : '-'}{tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}