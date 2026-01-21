// backend/controllers/shopController.js
const ShopItem = require('../models/ShopItem');
const User = require('../models/User');
const Transaction = require('../models/Transaction'); // <--- ADD THIS

exports.list = async (req,res)=>{
  const items = await ShopItem.find().sort({ createdAt:-1 });
  res.json(items);
};

exports.create = async (req,res)=>{
  const { title, description, price, stock } = req.body;
  const image = req.file ? `/uploads/${require('path').basename(req.file.path)}` : '';
  const item = await ShopItem.create({ title, description, price: Number(price), stock: Number(stock||1), image, createdBy: req.user._id });
  res.status(201).json(item);
};

exports.buy = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ShopItem.findById(id);
    
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.stock < 1) return res.status(400).json({ message: 'Sold Out' });

    const user = await User.findById(req.user._id);
    
    // Check Balance
    if (user.wallet.balance < item.price) {
        return res.status(400).json({ message: 'Insufficient balance' });
    }

    // 1. Deduct Balance
    user.wallet.balance -= item.price;
    await user.save();

    // 2. Reduce Stock
    item.stock -= 1;
    await item.save();

    // 3. 🔥 FIX: Create Transaction Record
    await Transaction.create({
        user: req.user._id,
        type: 'debit',
        amount: item.price,
        description: `Purchased: ${item.title}`,
        status: 'success'
    });

    // Optional: Emit socket event for real-time wallet update if io is attached
    const io = req.app.get('io');
    if (io) {
        io.to(String(req.user._id)).emit('wallet:update', { balance: user.wallet.balance });
    }

    res.json({ success: true, message: 'Purchase successful', item });

  } catch (err) {
    console.error("Shop buy error:", err);
    res.status(500).json({ message: 'Server error during purchase' });
  }
};