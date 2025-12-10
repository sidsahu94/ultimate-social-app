const Live = require('../models/LiveStream');
const User = require('../models/User');

exports.start = async (req,res)=>{
  const { title } = req.body;
  const roomId = (req.user._id.toString().slice(-6) + Date.now().toString().slice(-4));
  const live = await Live.create({ roomId, host:req.user._id, title, isLive:true });
  res.json(live);
};

exports.end = async (req,res)=>{
  const { roomId } = req.params;
  const live = await Live.findOneAndUpdate({ roomId, host:req.user._id }, { isLive:false }, { new:true });
  if (!live) return res.status(404).json({message:'Not found'});
  res.json(live);
};

exports.get = async (req,res)=>{
  const { roomId } = req.params;
  const live = await Live.findOne({ roomId }).populate('host','name avatar').lean();
  if (!live) return res.status(404).json({message:'Not found'});
  res.json(live);
};

exports.list = async (_,res)=>{
  const lives = await Live.find({ isLive:true }).sort({ createdAt:-1 }).populate('host','name avatar');
  res.json(lives);
};

exports.superchat = async (req,res)=>{
  const { roomId } = req.params;
  const { amount, message } = req.body;
  const me = await User.findById(req.user._id);
  if (me.wallet.balance < amount) return res.status(400).json({message:'Insufficient balance'});
  const live = await Live.findOne({ roomId, isLive:true });
  if (!live) return res.status(404).json({message:'Stream not found'});

  me.wallet.balance -= amount;
  me.wallet.totalSent += amount;
  await me.save();

  const host = await User.findById(live.host);
  host.wallet.balance += amount;
  host.wallet.totalReceived += amount;
  await host.save();

  live.superchats.push({ from: req.user._id, amount, message });
  await live.save();

  res.json({ ok:true });
};
