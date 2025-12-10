const Payout = require('../models/Payout');
const User = require('../models/User');

exports.create = async (req,res)=>{
  const { creatorId, amount, method='manual', note } = req.body;
  const p = await Payout.create({ creator: creatorId, amount, method, note });
  res.status(201).json(p);
};

exports.list = async (req,res)=>{
  const items = await Payout.find().populate('creator','name email');
  res.json(items);
};

exports.markPaid = async (req,res)=>{
  const { id } = req.params;
  const p = await Payout.findById(id);
  if (!p) return res.status(404).json({ message:'Not found' });
  p.status = 'paid'; p.paidAt = new Date();
  await p.save();
  // ideally transfer via payment gateway — here simulate
  const u = await User.findById(p.creator);
  u.wallet.balance += p.amount; // settle to wallet for demo
  await u.save();
  res.json(p);
};
