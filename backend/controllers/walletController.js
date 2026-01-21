// backend/controllers/walletController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Helper for consistent error responses
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

// --- 1. GET MY WALLET ---
exports.me = async (req, res) => {
  try {
    const me = await User.findById(req.user._id)
      .select('wallet lastAirdrop referralCode walletPin')
      .lean();
      
    res.json({
        ...me.wallet,
        lastAirdrop: me.lastAirdrop,
        referralCode: me.referralCode,
        hasPin: !!me.walletPin 
    });
  } catch (e) {
    console.error("Wallet Fetch Error:", e);
    res.status(500).json({ message: 'Server error fetching wallet' });
  }
};

// --- 2. SET WALLET PIN ---
exports.setPin = async (req, res) => {
  try {
    const { pin, oldPin } = req.body; // Expect oldPin
    const user = await User.findById(req.user._id).select('+walletPin');

    if (!pin || pin.length !== 6 || isNaN(pin)) {
      return fail(res, 'PIN must be exactly 6 digits');
    }

    // 🔥 FIX: Verify old PIN if it exists to prevent unauthorized overwrite
    if (user.walletPin) {
        if (!oldPin) return fail(res, 'Please enter your current PIN to change it.', 403);
        
        const isMatch = await bcrypt.compare(oldPin, user.walletPin);
        if (!isMatch) return fail(res, 'Current PIN is incorrect.', 401);
    }

    const hashed = await bcrypt.hash(pin, 10);
    user.walletPin = hashed;
    await user.save();
    
    res.json({ success: true, message: 'Wallet PIN updated successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Error setting PIN' });
  }
};

// --- 3. CHECK PIN STATUS ---
exports.checkPinStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletPin').lean();
    res.json({ hasPin: !!user.walletPin });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 4. DAILY AIRDROP ---
exports.airdrop = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const now = new Date();
    
    if (me.lastAirdrop) {
        const diff = now - new Date(me.lastAirdrop);
        const hours = diff / (1000 * 60 * 60);
        if (hours < 24) {
            const timeLeft = Math.ceil(24 - hours);
            return fail(res, `Come back in ${timeLeft} hours!`);
        }
    }

    const AMOUNT = 200;
    await User.findByIdAndUpdate(req.user._id, {
        $inc: { "wallet.balance": AMOUNT },
        $set: { lastAirdrop: now }
    });

    Transaction.create({
        user: me._id,
        type: 'credit',
        amount: AMOUNT,
        description: 'Daily Airdrop Reward'
    });

    const io = req.app.get('io') || global.io;
    if (io) {
        io.to(String(me._id)).emit('wallet:update', { balance: me.wallet.balance + AMOUNT });
    }

    res.json({ success: true, message: `Received ${AMOUNT} coins!`, balance: me.wallet.balance + AMOUNT });
  } catch (e) {
    res.status(500).json({ message: 'Server error processing airdrop' });
  }
};

// --- 5. SECURE TRANSFER (TIP) ---
exports.tip = async (req, res) => {
  let session = null;
  try {
    const { to, amount, pin, idempotencyKey } = req.body; 
    const numAmount = Math.abs(Number(amount));

    if (!numAmount || numAmount < 1) return fail(res, 'Invalid amount (min 1 coin)');

    // 1. Idempotency Check (Fast Fail)
    if (idempotencyKey) {
        const existingTx = await Transaction.findOne({ idempotencyKey });
        if (existingTx) {
            return res.json({ success: true, message: 'Transaction already processed (Cached)', cached: true });
        }
    }

    // 2. Fetch Sender & Verify PIN
    const sender = await User.findById(req.user._id).select('+walletPin wallet');
    if (!sender.walletPin) return fail(res, 'Please set a Wallet PIN first in Settings', 403);
    const isPinValid = await bcrypt.compare(pin, sender.walletPin);
    if (!isPinValid) return fail(res, 'Incorrect PIN', 401);
    
    if (sender.wallet.balance < numAmount) return fail(res, 'Insufficient balance');

    // 3. Resolve Recipient
    const recipient = await User.findById(to);
    if (!recipient) return fail(res, 'User not found', 404);
    if (sender._id.equals(recipient._id)) return fail(res, 'Cannot tip yourself');

    // 4. START ACID SESSION
    session = await mongoose.startSession();
    session.startTransaction();

    // A. Deduct from Sender
    const updatedSender = await User.findOneAndUpdate(
        { _id: sender._id, "wallet.balance": { $gte: numAmount } },
        { $inc: { "wallet.balance": -numAmount, "wallet.totalSent": numAmount } },
        { session, new: true }
    );

    if (!updatedSender) throw new Error("Balance check failed during atomic update");

    // B. Add to Recipient
    await User.findByIdAndUpdate(
        recipient._id,
        { $inc: { "wallet.balance": numAmount, "wallet.totalReceived": numAmount } },
        { session }
    );

    // C. Log Transactions
    const txs = [
        { 
            user: sender._id, 
            type: 'debit', 
            amount: numAmount, 
            description: `Tip to ${recipient.name}`,
            idempotencyKey 
        },
        { 
            user: recipient._id, 
            type: 'credit', 
            amount: numAmount, 
            description: `Tip from ${sender.name}` 
        }
    ];
    await Transaction.insertMany(txs, { session });

    // D. Commit
    await session.commitTransaction();
    session.endSession();

    // 5. Real-time Updates
    const io = req.app.get('io') || global.io;
    if (io) {
        io.to(String(sender._id)).emit('wallet:update', { balance: updatedSender.wallet.balance });
        io.to(String(recipient._id)).emit('wallet:update', { balance: recipient.wallet.balance + numAmount });
        io.to(String(recipient._id)).emit('notification', {
            type: 'wallet',
            message: `You received ${numAmount} coins from ${sender.name}!`
        });
    }

    res.json({ success: true, message: `Sent ${numAmount} to ${recipient.name}` });

  } catch (err) {
    if (session) {
        await session.abortTransaction();
        session.endSession();
    }
    // Duplicate key error code 11000 means idempotency worked (race condition caught by DB)
    if (err.code === 11000) {
        return res.json({ success: true, message: 'Transaction processed successfully' });
    }
    console.error("Tip Transaction Failed:", err);
    res.status(500).json({ success: false, message: "Transaction failed" });
  }
};