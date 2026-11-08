// backend/controllers/shopController.js
const ShopItem = require('../models/ShopItem');
const Product = require('../models/Product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const path = require('path');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

exports.list = async (req, res) => {
  try {
    let items = await ShopItem.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name avatar role')
      .lean();

    // Check Product collection to ensure all seeded and marketplace items are available
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate('owner', 'name avatar role')
      .lean();

    const normalizedProducts = (products || []).map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.desc || p.description || '',
      price: p.price,
      stock: p.stock ?? 50,
      image: p.image,
      category: (p.tags && p.tags[0]) || 'Digital',
      createdBy: p.owner,
      createdAt: p.createdAt,
    }));

    // Merge without duplicates
    const shopItemIds = new Set(items.map((i) => String(i._id)));
    for (const np of normalizedProducts) {
      if (!shopItemIds.has(String(np._id))) {
        items.push(np);
      }
    }

    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching shop items',
      error: err.message,
    });
  }
};

exports.mine = async (req, res) => {
  try {
    const userId = req.user._id;
    let items = await ShopItem.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name avatar role')
      .lean();

    const products = await Product.find({ owner: userId })
      .sort({ createdAt: -1 })
      .populate('owner', 'name avatar role')
      .lean();

    const normalizedProducts = (products || []).map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.desc || p.description || '',
      price: p.price,
      stock: p.stock ?? 50,
      image: p.image,
      category: (p.tags && p.tags[0]) || 'Digital',
      createdBy: p.owner,
      createdAt: p.createdAt,
    }));

    const shopItemIds = new Set(items.map((i) => String(i._id)));
    for (const np of normalizedProducts) {
      if (!shopItemIds.has(String(np._id))) {
        items.push(np);
      }
    }

    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching your shop items',
      error: err.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, desc, price, stock, category } = req.body;
    const safeTitle = String(title || '').trim();
    const safeDescription = String(description || desc || '').trim();

    if (!safeTitle) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const image = req.file ? `/uploads/${path.basename(req.file.path)}` : (req.body.image || '');

    const item = await ShopItem.create({
      title: safeTitle,
      description: safeDescription,
      price: toNumber(price, 0),
      stock: Math.max(1, toNumber(stock, 1)),
      category: category || 'Digital',
      image,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Error creating shop item',
      error: err.message,
    });
  }
};

exports.buy = async (req, res) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (_) {
    session = null;
  }
  const sessionOpts = session ? { session } : {};

  try {
    const { id } = req.params;
    const userId = req.user._id;

    let item = session ? await ShopItem.findById(id).session(session) : await ShopItem.findById(id);
    let isProduct = false;

    if (!item) {
      const prod = session ? await Product.findById(id).session(session) : await Product.findById(id);
      if (prod) {
        item = {
          _id: prod._id,
          title: prod.title,
          price: prod.price,
          stock: prod.stock ?? 50,
          createdBy: prod.owner,
        };
        isProduct = true;
      }
    }

    if (!item) throw new Error('Item not found');
    if (item.stock < 1) throw new Error('Sold out');
    if (String(item.createdBy) === String(userId)) {
      throw new Error('You cannot buy your own listing');
    }

    const user = session ? await User.findById(userId).session(session) : await User.findById(userId);
    if (!user) throw new Error('User not found');

    const currentBalance = toNumber(user.wallet?.balance, 0);
    if (currentBalance < item.price) throw new Error('Insufficient balance');

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { 'wallet.balance': -item.price } },
      { ...sessionOpts, new: true }
    );

    if (isProduct) {
      await Product.findByIdAndUpdate(id, { $inc: { stock: -1 } }, sessionOpts);
    } else {
      await ShopItem.findByIdAndUpdate(id, { $inc: { stock: -1 } }, sessionOpts);
    }

    await Transaction.create(
      [
        {
          user: userId,
          type: 'debit',
          amount: item.price,
          description: `Purchased: ${item.title}`,
          status: 'success',
          idempotencyKey: `shop:${userId}:${id}:${Date.now()}`,
        },
      ],
      sessionOpts
    );

    // Credit seller if creator is distinct from buyer
    if (item.createdBy && String(item.createdBy) !== String(userId)) {
      await User.findByIdAndUpdate(
        item.createdBy,
        { $inc: { 'wallet.balance': item.price } },
        sessionOpts
      );

      await Transaction.create(
        [
          {
            user: item.createdBy,
            type: 'credit',
            amount: item.price,
            description: `Sale proceeds: ${item.title}`,
            status: 'success',
            idempotencyKey: `sale:${item.createdBy}:${id}:${Date.now()}`,
          },
        ],
        sessionOpts
      );
    }

    if (session) {
      await session.commitTransaction();
    }

    const io = req.app.get('io') || global.io;
    if (io && updatedUser?.wallet) {
      io.to(String(userId)).emit('wallet:update', {
        balance: updatedUser.wallet.balance,
      });
    }
    if (io && item.createdBy && String(item.createdBy) !== String(userId)) {
      io.to(String(item.createdBy)).emit('wallet:update', {
        amount: item.price,
        message: `Sale proceeds: ₹${item.price} earned for "${item.title}"!`,
      });
    }

    return res.json({
      success: true,
      message: 'Purchase successful',
      data: {
        item,
        balance: updatedUser?.wallet?.balance ?? currentBalance - item.price,
      },
    });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
    }
    console.error('Shop buy error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Server error during purchase',
    });
  } finally {
    if (session) session.endSession();
  }
};
