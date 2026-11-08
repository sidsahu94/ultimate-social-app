// backend/controllers/marketplaceController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction'); 

exports.list = async (_req, res) => {
  const items = await Product.find().sort({ createdAt: -1 }).limit(200);
  res.json(items);
};

exports.mine = async (req, res) => {
  const items = await Product.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(items);
};

exports.create = async (req, res) => {
  const { title, price, desc, tags = [] } = req.body;
  const image = (req.file && `/uploads/${require('path').basename(req.file.path)}`) || req.body.image || '';
  const item = await Product.create({ owner: req.user._id, title, price, desc, image, tags });
  res.status(201).json(item);
};

// ADDED: ACID Transaction with standalone MongoDB fallback
exports.buyItem = async (req, res) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (_) {
    session = null;
  }
  const sessionOpts = session ? { session } : {};
  
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    // Fetch locking the documents to this session if active
    const user = session ? await User.findById(userId).session(session) : await User.findById(userId);
    const item = session ? await Product.findById(itemId).session(session) : await Product.findById(itemId);

    if (!item) throw new Error('Item not found');
    
    // Check if item has a stock limit, if so, enforce it
    if (item.stock !== undefined && item.stock <= 0) {
      throw new Error('Item out of stock');
    }
    
    if ((user.wallet?.balance || 0) < item.price) {
      throw new Error('Insufficient balance');
    }

    // Atomic Execution: Deduct balance from buyer, reduce stock, and credit seller
    await User.findByIdAndUpdate(userId, { 
      $inc: { 'wallet.balance': -item.price, 'wallet.totalSent': item.price } 
    }, sessionOpts);
    
    if (item.stock !== undefined) {
      await Product.findByIdAndUpdate(itemId, { $inc: { stock: -1 } }, sessionOpts);
    }
    
    // Credit seller if not self-purchase
    if (item.owner && String(item.owner) !== String(userId)) {
      await User.findByIdAndUpdate(item.owner, {
        $inc: { 'wallet.balance': item.price, 'wallet.totalReceived': item.price }
      }, sessionOpts);

      await Transaction.create([{
        user: item.owner,
        type: 'credit',
        amount: item.price,
        description: `Sold ${item.title}`,
        idempotencyKey: `marketplace:sale:${item.owner}:${itemId}:${Date.now()}`
      }], sessionOpts);
    }
    
    await Transaction.create([{ 
      user: userId, 
      type: 'debit', 
      amount: item.price, 
      description: `Bought ${item.title}`,
      idempotencyKey: `marketplace:buy:${userId}:${itemId}:${Date.now()}`
    }], sessionOpts);

    if (session) {
      await session.commitTransaction();
    }

    const io = req.app.get('io') || global.io;
    if (io) {
      if (item.owner && String(item.owner) !== String(userId)) {
        io.to(String(item.owner)).emit('notification', {
          type: 'sale',
          message: `Your item "${item.title}" was purchased for ${item.price} coins!`,
        });
      }
    }

    res.json({ success: true, message: 'Purchase successfully and securely executed' });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
    }
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (session) session.endSession();
  }
};