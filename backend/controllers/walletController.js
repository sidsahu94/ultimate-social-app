const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// 🔥 NEW: Set or Update Wallet PIN
exports.setPin = async (req, res) => {
  try {
    const { pin } = req.body;
    
    // Validation: Must be exactly 6 digits
    if (!pin || pin.length !== 6 || isNaN(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 6 digits' });
    }

    const hashed = await bcrypt.hash(pin, 10);
    
    // Update user
    await User.findByIdAndUpdate(req.user._id, { walletPin: hashed });

    res.json({ message: 'Wallet PIN updated successfully' });
  } catch (e) {
    console.error("Set PIN Error:", e);
    res.status(500).json({ message: 'Error setting PIN' });
  }
};

// 🔥 NEW: Check if user has a PIN set (for UI toggle)
exports.checkPinStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletPin');
    res.json({ hasPin: !!user.walletPin });
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

// Send Coins (Tip) - Updated with PIN Security
exports.tip = async (req, res) => {
  let session = null;
  try {
    const { to, amount, pin } = req.body;
    const numAmount = Number(amount);

    if (numAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    // 1. Fetch Sender with PIN field
    const me = await User.findById(req.user._id).select('+walletPin');
    
    // 2. Validate Balance
    if (me.wallet.balance < numAmount) {
        return res.status(400).json({ message: 'Insufficient balance' });
    }

    // 3. 🔥 SECURITY CHECK: Wallet PIN
    if (!me.walletPin) {
        return res.status(403).json({ message: 'Please set a Wallet PIN first in Security Settings.' });
    }
    if (!pin) {
        return res.status(400).json({ message: 'PIN required' });
    }
    
    const isMatch = await bcrypt.compare(pin, me.walletPin);
    if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect PIN' });
    }

    // 4. Find Recipient
    let recipient;
    if (mongoose.Types.ObjectId.isValid(to)) {
      recipient = await User.findById(to);
    } 
    if (!recipient) {
      recipient = await User.findOne({ $or: [{ name: to }, { email: to }] });
    }

    if (!recipient) return res.status(404).json({ message: 'User not found' });
    if (recipient._id.equals(me._id)) return res.status(400).json({ message: 'Cannot tip yourself' });

    // 5. Execute Transaction (Atomic if possible, here using standard save)
    me.wallet.balance -= numAmount;
    me.wallet.totalSent += numAmount;
    
    recipient.wallet.balance += numAmount;
    recipient.wallet.totalReceived += numAmount;

    await me.save();
    await recipient.save();

    // 6. Log Transactions
    await Transaction.create({ 
        user: me._id, 
        type: 'debit', 
        amount: numAmount, 
        description: `Tip to ${recipient.name}` 
    });
    
    await Transaction.create({ 
        user: recipient._id, 
        type: 'credit', 
        amount: numAmount, 
        description: `Tip from ${me.name}` 
    });

    // 7. Real-time Updates
    const io = req.app.get('io') || global.io;
    if (io) {
        // Update Sender Balance
        io.to(String(me._id)).emit('wallet:update', { balance: me.wallet.balance });
        
        // Update Recipient Balance
        io.to(String(recipient._id)).emit('wallet:update', { balance: recipient.wallet.balance });
        
        // Notify Recipient
        io.to(String(recipient._id)).emit('notification', {
            type: 'wallet',
            message: `You received ${numAmount} coins from ${me.name}!`
        });
    }

    res.json({ ok: true, message: `Sent ${numAmount} to ${recipient.name}` });

  } catch (err) {
    console.error("Tip Error:", err);
    res.status(500).json({ message: 'Transaction failed' });
  }
};