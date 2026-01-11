// backend/controllers/shopController.js
const ShopItem = require('../models/ShopItem');
const User = require('../models/User');

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

exports.buy = async (req,res)=>{
  const { id } = req.params;
  const item = await ShopItem.findById(id);
  if (!item || item.stock < 1) return res.status(400).json({ message:'Not available' });
  const user = await User.findById(req.user._id);
  if (user.wallet.balance < item.price) return res.status(400).json({ message:'Insufficient balance' });
  user.wallet.balance -= item.price;
  await user.save();
  item.stock -= 1;
  await item.save();
  // simple order: record in user (omitted full order model for brevity)
  res.json({ ok:true, item });
};
