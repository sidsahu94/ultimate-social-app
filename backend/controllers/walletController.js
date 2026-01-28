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
    
    // Simple update is fine here (low risk)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "wallet.balance": AMOUNT },
      $set: { lastAirdrop: now }
    });

    // Log transaction (fire and forget for airdrop)
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

// --- 5. SECURE TRANSFER (TIP) - ACID Transaction ---
exports.tip = async (req, res) => {
  let session = null;
  try {
    const { to, amount, pin, idempotencyKey } = req.body; 
    const numAmount = Math.abs(Number(amount));

    if (!numAmount || numAmount < 1) return fail(res, 'Invalid amount (min 1 coin)');

    // 1. Fetch Sender & Verify PIN (Read Operation)
    const sender = await User.findById(req.user._id).select('+walletPin wallet');
    if (!sender.walletPin) return fail(res, 'Please set a Wallet PIN first in Settings', 403);
    
    const isPinValid = await bcrypt.compare(pin, sender.walletPin);
    if (!isPinValid) return fail(res, 'Incorrect PIN', 401);
    
    if (sender.wallet.balance < numAmount) return fail(res, 'Insufficient balance');

    // 2. Resolve Recipient
    const recipient = await User.findById(to);
    if (!recipient) return fail(res, 'User not found', 404);
    if (sender._id.equals(recipient._id)) return fail(res, 'Cannot tip yourself');

    // 3. START ACID SESSION
    session = await mongoose.startSession();
    session.startTransaction();

    // 4. Log Transaction FIRST (Idempotency Guard)
    // 🔥 CRITICAL FIX: We insert the transaction first. 
    // If the idempotencyKey exists, MongoDB throws E11000 immediately, aborting the logic.
    // This prevents race conditions where two requests pass the "check" simultaneously.
    await Transaction.create([{
      user: sender._id,
      type: 'debit',
      amount: numAmount,
      description: `Tip to ${recipient.name}`,
      idempotencyKey // Relies on MongoDB Unique Index
    }], { session });

    // 5. Deduct from Sender (Atomic decrement with balance guard)
    const updatedSender = await User.findOneAndUpdate(
      { _id: sender._id, "wallet.balance": { $gte: numAmount } },
      { $inc: { "wallet.balance": -numAmount, "wallet.totalSent": numAmount } },
      { session, new: true }
    );

    if (!updatedSender) {
        // This happens if balance dropped between step 1 and step 5
        throw new Error("Balance check failed during atomic update");
    }

    // 6. Add to Recipient
    await User.findByIdAndUpdate(
      recipient._id,
      { $inc: { "wallet.balance": numAmount, "wallet.totalReceived": numAmount } },
      { session }
    );

    // 7. Log Recipient Credit Side
    await Transaction.create([{
      user: recipient._id,
      type: 'credit',
      amount: numAmount,
      description: `Tip from ${sender.name}`
    }], { session });

    // 8. Commit
    await session.commitTransaction();
    session.endSession();

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
      await session.abortTransaction();
      session.endSession();
    }
    
    // Handle Duplicate Key Error (Idempotency Success)
    if (err.code === 11000) {
      return res.json({ success: true, message: 'Transaction already processed (Cached)', cached: true });
    }
    
    console.error("Tip Transaction Failed:", err);
    
    // Handle specific balance error manually thrown above
    if (err.message === "Balance check failed during atomic update") {
        return fail(res, 'Insufficient balance (Concurrent transaction)');
    }

    res.status(500).json({ success: false, message: "Transaction failed" });
  }
};