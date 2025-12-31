// backend/controllers/walletController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // 🔥 Import bcrypt

// Get current wallet status
exports.me = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('wallet lastAirdrop referralCode');
    res.json({
        ...me.wallet,
        lastAirdrop: me.lastAirdrop,
        referralCode: me.referralCode
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Daily Airdrop (Bonus)
exports.airdrop = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const now = new Date();
    
    // Check 24h Cooldown
    if (me.lastAirdrop) {
        const diff = now - new Date(me.lastAirdrop);
        const hours = diff / (1000 * 60 * 60);
        if (hours < 24) {
            const timeLeft = Math.ceil(24 - hours);
            return res.status(400).json({ message: `Come back in ${timeLeft} hours!` });
        }
    }

    const AMOUNT = 200;
    me.wallet.balance += AMOUNT;
    me.lastAirdrop = now;
    await me.save();

    // Log Transaction
    await Transaction.create({
        user: me._id,
        type: 'credit',
        amount: AMOUNT,
        description: 'Daily Airdrop Reward'
    });

    const io = req.app.get('io') || global.io;
    if (io) {
        io.to(String(me._id)).emit('wallet:update', { balance: me.wallet.balance });
    }

    res.json({ 
        balance: me.wallet.balance, 
        message: `Received ${AMOUNT} coins!`,
        lastAirdrop: now 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send Coins (Tip)
exports.tip = async (req, res) => {
  try {
    const { to, amount, password } = req.body;
    const numAmount = Number(amount);

    if (numAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const me = await User.findById(req.user._id).select('+password');
    if (me.wallet.balance < numAmount) return res.status(400).json({ message: 'Insufficient balance' });

    // 🔥 FIX: Only verify password if the user actually HAS one (Email/Pass users)
    // Google users bypass this check since they are already authenticated via JWT
    if (me.password) {
        if (!password) return res.status(400).json({ message: 'Password required to confirm transaction' });
        const isMatch = await bcrypt.compare(password, me.password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });
    }

    // Smart Recipient Lookup (ID or Email)
    let recipient;
    if (mongoose.Types.ObjectId.isValid(to)) {
      recipient = await User.findById(to);
    } 
    if (!recipient) {
      recipient = await User.findOne({ $or: [{ name: to }, { email: to }] });
    }

    if (!recipient) return res.status(404).json({ message: 'User not found' });
    if (recipient._id.equals(me._id)) return res.status(400).json({ message: 'Cannot tip yourself' });

    // Execute Transfer
    me.wallet.balance -= numAmount;
    me.wallet.totalSent += numAmount;
    recipient.wallet.balance += numAmount;
    recipient.wallet.totalReceived += numAmount;

    await me.save();
    await recipient.save();

    // Log Transactions
    await Transaction.create({ user: me._id, type: 'debit', amount: numAmount, description: `Tip to ${recipient.name}` });
    await Transaction.create({ user: recipient._id, type: 'credit', amount: numAmount, description: `Tip from ${me.name}` });

    // Real-time Updates
    const io = req.app.get('io') || global.io;
    if (io) {
        io.to(String(me._id)).emit('wallet:update', { balance: me.wallet.balance });
        io.to(String(recipient._id)).emit('wallet:update', { balance: recipient.wallet.balance });
        
        io.to(String(recipient._id)).emit('notification', {
            type: 'wallet',
            message: `You received ${numAmount} coins from ${me.name}!`
        });
    }

    res.json({ ok: true, message: `Sent ${numAmount} to ${recipient.name}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Transaction failed' });
  }
};