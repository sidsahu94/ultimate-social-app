const User = require('../models/User');
const Transaction = require('../models/Transaction'); // Ensure this model exists from previous steps
const mongoose = require('mongoose');

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

exports.airdrop = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    
    // --- FIX: 24-Hour Cooldown Logic ---
    const now = new Date();
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

    // Log transaction
    await Transaction.create({
        user: me._id,
        type: 'credit',
        amount: AMOUNT,
        description: 'Daily Airdrop Reward'
    });

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

exports.tip = async (req, res) => {
  try {
    const { to, amount } = req.body;
    const numAmount = Number(amount);

    if (numAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const me = await User.findById(req.user._id);
    if (me.wallet.balance < numAmount) return res.status(400).json({ message: 'Insufficient balance' });

    // Smart Recipient Lookup
    let recipient;
    if (mongoose.Types.ObjectId.isValid(to)) {
      recipient = await User.findById(to);
    } 
    if (!recipient) {
      recipient = await User.findOne({ $or: [{ name: to }, { email: to }] });
    }

    if (!recipient) return res.status(404).json({ message: 'User not found' });
    if (recipient._id.equals(me._id)) return res.status(400).json({ message: 'Cannot tip yourself' });

    // Transaction
    me.wallet.balance -= numAmount;
    me.wallet.totalSent += numAmount;
    recipient.wallet.balance += numAmount;
    recipient.wallet.totalReceived += numAmount;

    await me.save();
    await recipient.save();

    // Log
    await Transaction.create({ user: me._id, type: 'debit', amount: numAmount, description: `Tip to ${recipient.name}` });
    await Transaction.create({ user: recipient._id, type: 'credit', amount: numAmount, description: `Tip from ${me.name}` });

    res.json({ ok: true, message: `Sent ${numAmount} to ${recipient.name}` });
  } catch (err) {
    res.status(500).json({ message: 'Transaction failed' });
  }
};