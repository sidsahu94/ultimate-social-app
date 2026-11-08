// backend/controllers/liveController.js
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

exports.superchat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { amount, message } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid superchat amount' });
    }

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ message: 'User not found' });
    me.wallet = me.wallet || { balance: 0, totalReceived: 0, totalSent: 0 };

    if ((me.wallet.balance || 0) < numericAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const live = await Live.findOne({ roomId, isLive: true });
    if (!live) return res.status(404).json({ message: 'Stream not found' });

    me.wallet.balance = (me.wallet.balance || 0) - numericAmount;
    me.wallet.totalSent = (me.wallet.totalSent || 0) + numericAmount;
    await me.save();

    const host = await User.findById(live.host);
    if (host) {
      host.wallet = host.wallet || { balance: 0, totalReceived: 0, totalSent: 0 };
      host.wallet.balance = (host.wallet.balance || 0) + numericAmount;
      host.wallet.totalReceived = (host.wallet.totalReceived || 0) + numericAmount;
      await host.save();
    }

    live.superchats = live.superchats || [];
    live.superchats.push({ from: req.user._id, amount: numericAmount, message: message || '' });
    await live.save();

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(roomId).emit('live:superchat', {
        from: { _id: me._id, name: me.name, avatar: me.avatar },
        amount: numericAmount,
        message: message || '',
      });
      if (host) {
        io.to(String(host._id)).emit('wallet:update', { balance: host.wallet.balance });
      }
      io.to(String(me._id)).emit('wallet:update', { balance: me.wallet.balance });
    }

    res.json({ ok: true, balance: me.wallet.balance });
  } catch (err) {
    console.error('Superchat error:', err);
    res.status(500).json({ message: 'Server error processing superchat' });
  }
};
