// frontend/src/pages/wallet/WalletPage.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import socket from '../../services/socket';
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaCopy, FaPaperPlane, FaSearch, FaLock, FaKey } from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import UserAvatar from '../../components/ui/UserAvatar';

export default function WalletPage() {
  const [data, setData] = useState({ 
    balance: 0, 
    transactions: [],
    lastAirdrop: null, 
    referralCode: 'LOADING...' 
  });
  const [loading, setLoading] = useState(true);
  
  // Transfer State
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState(10);
  
  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // 🔥 Security State (PIN System)
  const [hasPin, setHasPin] = useState(false); // Does user have a PIN set?
  const [showConfirm, setShowConfirm] = useState(false); // Confirm Transfer Modal
  const [showPinSetup, setShowPinSetup] = useState(false); // Setup PIN Modal
  const [pinInput, setPinInput] = useState(''); // PIN entry field
  const [newPin, setNewPin] = useState(''); // PIN creation field
  
  const { add: addToast } = useToast();

  const load = async () => {
    try {
      const walletRes = await API.get('/wallet/me');
      const appsRes = await API.get('/apps/wallet'); 
      const pinRes = await API.get('/wallet/pin/status'); // Check if PIN exists
      
      setData({
        ...walletRes.data,
        transactions: appsRes.data?.transactions || []
      });
      setHasPin(pinRes.data.hasPin);

    } catch (e) {
      console.warn("Wallet data partial load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 

    const onWalletUpdate = (update) => {
        if (update && typeof update.balance === 'number') {
            setData(prev => ({ ...prev, balance: update.balance }));
            API.get('/apps/wallet').then(res => {
                setData(prev => ({ ...prev, transactions: res.data.transactions || [] }));
            });
        }
    };

    socket.on('wallet:update', onWalletUpdate);
    return () => socket.off('wallet:update', onWalletUpdate);
  }, []);

  // Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        try {
          const r = await API.get(`/users/search?q=${query}`);
          setResults(r.data.users || []);
          setShowDropdown(true);
        } catch (e) {}
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const selectUser = (user) => {
    setRecipientId(user._id);
    setQuery(user.name); // Show name in input
    setShowDropdown(false);
  };

  // 🔥 1. Initialize Transfer
  const initTransfer = () => {
    if (!recipientId || amount <= 0) return addToast("Invalid details", { type: 'error' });
    
    if (!hasPin) {
        setShowPinSetup(true); // Force PIN setup first
        addToast("Please set a Wallet PIN to continue", { type: "info" });
        return;
    }
    
    setShowConfirm(true); // Open Enter PIN modal
  };

  // 🔥 2. Handle PIN Setup
  const handleSetPin = async () => {
      if (newPin.length !== 6 || isNaN(newPin)) {
          return addToast("PIN must be exactly 6 digits", { type: "error" });
      }
      try {
          await API.post('/wallet/pin', { pin: newPin });
          setHasPin(true);
          setShowPinSetup(false);
          setNewPin('');
          addToast("PIN set successfully! You can now transfer.", { type: "success" });
          setShowConfirm(true); // Automatically open transfer modal
      } catch (e) {
          addToast("Failed to set PIN", { type: "error" });
      }
  };

  // 🔥 3. Perform Secure Transfer with PIN
  const confirmTransfer = async () => {
    if (!pinInput || pinInput.length !== 6) return addToast("Enter your 6-digit PIN", { type: 'error' });
    
    try {
      // Sending PIN instead of password
      await API.post('/wallet/tip', { to: recipientId, amount, pin: pinInput });
      addToast(`Sent ${amount} coins!`, { type: 'success' });
      
      // Reset inputs
      setRecipientId('');
      setQuery(''); 
      setAmount(10);
      setPinInput('');
      setShowConfirm(false);
    } catch (e) {
      addToast(e.userMessage || "Transfer failed (Incorrect PIN?)", { type: 'error' });
    }
  };

  const handleAirdrop = async () => {
    try {
      const res = await API.post('/wallet/airdrop');
      addToast(res.data.message, { type: 'success' });
    } catch (e) {
      addToast(e.userMessage || "Cooldown active", { type: 'error' });
    }
  };

  const handleWithdraw = async () => {
    if (data.balance < 100) return addToast("Minimum withdrawal is 100 coins", { type: 'error' });
    
    const paypalEmail = prompt("Enter PayPal email for withdrawal request:");
    if (paypalEmail) {
        try {
            await API.post('/payouts/create', { 
                amount: data.balance, 
                method: 'paypal',
                details: paypalEmail 
            });
            addToast("Withdrawal request submitted!", { type: 'success' });
        } catch (e) {
            addToast("Withdrawal request queued.", { type: 'info' });
        }
    }
  };

  const copyReferral = () => {
    if (data.referralCode) {
        navigator.clipboard.writeText(data.referralCode);
        addToast('Referral code copied!', { type: 'success' });
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
            <button 
                onClick={handleWithdraw}
                className="flex-1 bg-white text-indigo-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
                <FaArrowUp /> Withdraw
            </button>
            </div>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Transfer Section */}
      <div className="card p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2"><FaPaperPlane className="text-indigo-500"/> Send Coins</h3>
        <div className="flex flex-col gap-3">
            
            {/* Recipient Search */}
            <div className="relative">
                <div className="flex items-center border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 px-3 transition focus-within:ring-2 ring-indigo-500/20">
                    <FaSearch className="text-gray-400 mr-2" />
                    <input 
                        value={query}
                        onChange={e => { setQuery(e.target.value); setRecipientId(''); }} 
                        placeholder="Search user to tip..."
                        className="w-full py-3 bg-transparent outline-none"
                    />
                </div>

                {/* Dropdown Results */}
                {showDropdown && results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                        {results.map(u => (
                            <div 
                                key={u._id} 
                                onClick={() => selectUser(u)}
                                className="flex items-center gap-3 p-3 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer transition"
                            >
                                <UserAvatar src={u.avatar} name={u.name} className="w-8 h-8" />
                                <div className="text-sm font-semibold">{u.name}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <input 
                        className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" 
                        type="number" 
                        placeholder="Amount"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                    />
                </div>
                <button onClick={initTransfer} className="btn-primary rounded-xl px-6 font-bold">Send</button>
            </div>
        </div>
      </div>

      {/* Referral Card */}
      <div className="card p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="font-bold text-lg text-green-800 dark:text-green-300">Invite Friends & Earn</h3>
                <p className="text-sm text-green-700 dark:text-green-400">Get 50 coins for every friend who signs up!</p>
            </div>
            <div className="flex gap-2">
                <code className="bg-white dark:bg-black/30 px-3 py-2 rounded-lg font-mono font-bold border border-green-300 dark:border-green-700 select-all">
                    {data.referralCode || '...'}
                </code>
                <button onClick={copyReferral} className="p-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition">
                    <FaCopy />
                </button>
            </div>
        </div>
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

      {/* 🔥 MODAL: Set PIN (Only shows if no PIN set) */}
      {showPinSetup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl border dark:border-gray-700 text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <FaKey size={20} />
                </div>
                <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">Create Wallet PIN</h3>
                <p className="text-sm text-gray-500 mb-6">Set a 6-digit PIN to secure your transactions.</p>
                
                <input 
                    type="password" 
                    maxLength={6}
                    value={newPin} 
                    onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-black/30 dark:border-gray-700 mb-4 focus:ring-2 ring-blue-500 outline-none text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                />
                
                <button onClick={handleSetPin} className="btn-primary w-full py-3 rounded-xl font-bold">Set PIN</button>
            </div>
        </div>
      )}

      {/* 🔥 MODAL: Confirm Transfer (Verify PIN) */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl border dark:border-gray-700">
                <div className="flex justify-center mb-4 text-indigo-500">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                        <FaLock size={24} />
                    </div>
                </div>
                <h3 className="font-bold text-xl mb-2 text-center text-gray-900 dark:text-white">Confirm Transfer</h3>
                <p className="text-sm text-gray-500 mb-6 text-center">
                    Sending <b>{amount} coins</b> to <b>{query}</b>. <br/>Enter your Wallet PIN.
                </p>
                
                <input 
                    type="password" 
                    maxLength={6}
                    value={pinInput} 
                    onChange={e => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="------"
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-black/30 dark:border-gray-700 mb-4 focus:ring-2 ring-indigo-500 outline-none text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                />
                
                <div className="flex gap-3">
                    <button onClick={() => { setShowConfirm(false); setPinInput(''); }} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                    <button onClick={confirmTransfer} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">Confirm</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}