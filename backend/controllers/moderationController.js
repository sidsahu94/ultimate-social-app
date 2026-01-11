// backend/controllers/moderationController.js
const Report = require('../models/ModerationReport');
const User = require('../models/User');
const Post = require('../models/Post');

exports.report = async (req,res)=>{
  const { targetType, targetId, reason, notes } = req.body;
  const r = await Report.create({ reporter: req.user._id, targetType, targetId, reason, notes });
  // notify moderators via socket will be emitted from controller consumer
  req.app.get('io')?.emit('mod:new-report', r);
  res.status(201).json(r);
};

exports.list = async (req,res)=>{
  const reports = await Report.find().sort({ createdAt:-1 }).populate('reporter','name');
  res.json(reports);
};

exports.action = async (req,res)=>{
  const { id } = req.params;
  const { action, notes } = req.body;
  const r = await Report.findById(id);
  if (!r) return res.status(404).json({message:'Not found'});
  r.status = 'actioned'; r.action = action; r.handledBy = req.user._id; r.notes = notes;
  await r.save();
  // basic action handling
  if (action === 'remove' && r.targetType === 'post') {
    await Post.findByIdAndUpdate(r.targetId, { isFlagged:true });
  }
  if (action === 'ban' && r.targetType === 'user') {
    await User.findByIdAndUpdate(r.targetId, { role: 'banned' });
  }
  req.app.get('io')?.emit('mod:report-updated', r);
  res.json(r);
};
