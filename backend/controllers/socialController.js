// backend/controllers/socialController.js
const User = require('../models/User');
const Post = require('../models/Post');

exports.updateGeo = async (req,res)=>{
  const { lat, lng } = req.body;
  if (typeof lat!=='number' || typeof lng!=='number') return res.status(400).json({message:'lat/lng required'});
  await User.findByIdAndUpdate(req.user._id, { geo: { type:'Point', coordinates:[lng,lat] }});
  res.json({ ok:true });
};

exports.nearby = async (req,res)=>{
  const { lat, lng, km = 25 } = req.query;
  if (!lat || !lng) return res.json([]);
  const users = await User.find({
    geo: { $near: { $geometry: { type:'Point', coordinates:[Number(lng), Number(lat)] }, $maxDistance: Number(km)*1000 } }
  }).select('name avatar geo');
  res.json(users);
};

exports.badges = async (req,res)=>{
  const meId = req.user._id;
  const posts = await Post.find({ user: meId });
  const likes = posts.reduce((n,p)=> n + (p.likes?.length||0), 0);
  const badges = new Set();
  if (likes >= 50) badges.add('popular');
  if (posts.length >= 20) badges.add('creator');
  if ((await User.findById(meId)).isVerified) badges.add('verified');
  await User.findByIdAndUpdate(meId, { badges:[...badges] });
  res.json({ badges:[...badges] });
};

exports.memories = async (req, res) => {
    try {
        const now = new Date();
        const month = now.getMonth() + 1; // MongoDB months map 1-12
        const date = now.getDate();
        const currentYear = now.getFullYear();

        const memories = await Post.find({
            user: req.user._id,
            $expr: {
                $and: [
                    { $eq: [{ $month: '$createdAt' }, month] },
                    { $eq: [{ $dayOfMonth: '$createdAt' }, date] },
                    { $lt: [{ $year: '$createdAt' }, currentYear] }
                ]
            }
        }).sort({ createdAt: -1 }).populate('user', 'name username avatar');

        res.json({ success: true, data: memories });
    } catch (error) {
        console.error("Memories Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch memories" });
    }
};

exports.linkNft = async (req,res)=>{
  const { nftUrl } = req.body;
  await User.findByIdAndUpdate(req.user._id, { nftPfpUrl:nftUrl });
  res.json({ ok:true, nftPfpUrl:nftUrl });
};