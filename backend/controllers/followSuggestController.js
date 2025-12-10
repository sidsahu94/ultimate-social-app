const User = require('../models/User');

exports.suggest = async (req,res)=>{
  const meId = req.user._id;
  // gather people you follow's follows (2-hop) and popular users
  const me = await User.findById(meId).select('following').lean();
  const following = (me.following || []).map(String);
  const pool = new Set();

  // 1) 2-hop: users followed by those you follow
  const twoHop = await User.find({ _id: { $in: following } }).select('following').lean();
  twoHop.forEach(u => (u.following||[]).forEach(f => pool.add(String(f))));

  // 2) popular users
  const popular = await User.find().sort({ 'followers.length': -1 }).limit(50).select('_id');
  popular.forEach(u => pool.add(String(u._id)));

  // remove yourself and already followed
  pool.delete(String(meId));
  following.forEach(f => pool.delete(String(f)));

  // fetch details & sort by follower count (simple ranking)
  const candidates = await User.find({ _id: { $in: Array.from(pool) } }).select('name avatar followers').lean();
  candidates.sort((a,b)=> (b.followers?.length||0) - (a.followers?.length||0));
  res.json(candidates.slice(0,20));
};
