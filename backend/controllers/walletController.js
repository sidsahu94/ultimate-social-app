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
    const { pin, oldPin } = req.body;
    const user = await User.findById(req.user._id).select('+walletPin');

    if (!pin || pin.length !== 6 || isNaN(pin)) {
      return fail(res, 'PIN must be exactly 6 digits');
    }

    // Verify old PIN if it exists to prevent unauthorized overwrite
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
    
    // 🔥 FIX: Use { new: true } to return the updated document, preventing stale socket emits
    const updatedUser = await User.findByIdAndUpdate(req.user._id, {
      $inc: { "wallet.balance": AMOUNT },
      $set: { lastAirdrop: now }
    }, { new: true });

    // Log transaction (fire and forget for airdrop)
    Transaction.create({
      user: me._id,
      type: 'credit',
      amount: AMOUNT,
      description: 'Daily Airdrop Reward',
      idempotencyKey: `airdrop:${me._id}:${now.toISOString().split('T')[0]}`
    }).catch(err => console.warn('Airdrop transaction log error:', err.message));

    const io = req.app.get('io') || global.io;
    if (io) {
      // Broadcast the exact new balance
      io.to(String(me._id)).emit('wallet:update', { balance: updatedUser.wallet.balance });
    }

    res.json({ success: true, message: `Received ${AMOUNT} coins!`, balance: updatedUser.wallet.balance });
  } catch (e) {
    console.error("Airdrop error:", e);
    res.status(500).json({ message: 'Server error processing airdrop' });
  }
};

// --- 5. SECURE TRANSFER (TIP) - ACID Transaction with Standalone Mongo Fallback ---
exports.tip = async (req, res) => {
  let session = null;
  try {
    const to = req.body.to || req.body.recipientId || req.body.targetUserId;
    const pin = req.body.pin || req.body.newPin;
    const idempotencyKey = req.body.idempotencyKey;
    const numAmount = Math.abs(Number(req.body.amount));

    if (!numAmount || numAmount < 1) return fail(res, 'Invalid amount (min 1 coin)');

    // 1. Fetch Sender & Verify PIN (Read Operation)
    const sender = await User.findById(req.user._id).select('+walletPin wallet');
    if (!sender.walletPin) {
      if (req.body.newPin && String(req.body.newPin).length === 6 && !isNaN(req.body.newPin)) {
        sender.walletPin = await bcrypt.hash(String(req.body.newPin), 10);
        await sender.save();
      } else {
        return fail(res, 'Please set a 6-digit Wallet PIN first', 403);
      }
    } else {
      const isPinValid = await bcrypt.compare(String(pin || ''), sender.walletPin);
      if (!isPinValid) return fail(res, 'Incorrect PIN', 401);
    }

    if (sender.wallet.balance < numAmount) return fail(res, 'Insufficient balance');

    // 2. Resolve Recipient
    if (!to) return fail(res, 'Recipient ID is required', 400);
    const recipient = await User.findById(to);
    if (!recipient) return fail(res, 'User not found', 404);
    if (sender._id.equals(recipient._id)) return fail(res, 'Cannot tip yourself');

    // 3. START SESSION IF SUPPORTED (Replica set environments)
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (_) {
      session = null;
    }
    const sessionOpts = session ? { session } : {};

    const safeIdempotencyKey = idempotencyKey || `tip:${sender._id}:${Date.now()}`;

    // 4. Log Transaction FIRST (Idempotency Guard)
    await Transaction.create([{
      user: sender._id,
      type: 'debit',
      amount: numAmount,
      description: `Tip to ${recipient.name}`,
      idempotencyKey: safeIdempotencyKey
    }], sessionOpts);

    // 5. Deduct from Sender (Atomic decrement with balance guard)
    const updatedSender = await User.findOneAndUpdate(
      { _id: sender._id, "wallet.balance": { $gte: numAmount } },
      { $inc: { "wallet.balance": -numAmount, "wallet.totalSent": numAmount } },
      { ...sessionOpts, new: true }
    );

    if (!updatedSender) {
        throw new Error("Balance check failed during atomic update");
    }

    // 6. Add to Recipient
    await User.findByIdAndUpdate(
      recipient._id,
      { $inc: { "wallet.balance": numAmount, "wallet.totalReceived": numAmount } },
      sessionOpts
    );

    // 7. Log Recipient Credit Side
    await Transaction.create([{
      user: recipient._id,
      type: 'credit',
      amount: numAmount,
      description: `Tip from ${sender.name}`,
      idempotencyKey: `tip-credit:${sender._id}:${recipient._id}:${Date.now()}`
    }], sessionOpts);

    // 8. Commit if session is active
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    // 9. Real-time Updates (Best Effort)
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
      try { await session.abortTransaction(); } catch (_) {}
      session.endSession();
    }
    
    // Handle Duplicate Key Error (Idempotency Success)
    if (err.code === 11000) {
      return res.json({ success: true, message: 'Transaction already processed (Cached)', cached: true });
    }
    
    console.error("Tip Transaction Failed:", err);
    
    if (err.message === "Balance check failed during atomic update") {
        return fail(res, 'Insufficient balance (Concurrent transaction)');
    }

    res.status(500).json({ success: false, message: "Transaction failed" });
  }
};