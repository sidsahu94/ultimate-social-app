// backend/controllers/searchSuggestController.js
const User = require('../models/User');
const Post = require('../models/Post');

exports.suggestions = async (req, res) => {
  try {
    const meId = req.user?._id;
    
    // 1. Get popular users (simple logic: mostly followed)
    const topUsers = await User.find({ 
        _id: { $ne: meId }, // Exclude self
        isDeleted: { $ne: true }
    })
    .sort({ 'followers.length': -1, createdAt: -1 })
    .limit(20)
    .select('name avatar followers bio badges');

    // Filter out users I already follow
    // (Optimization: In a real app, do this in the DB query, but JS filter is fine for MVP)
    const suggestions = topUsers.filter(u => 
        meId ? !u.followers.map(String).includes(String(meId)) : true
    ).slice(0, 10);

    // 2. Get trending hashtags
    const recent = await Post.aggregate([
        { $match: { isArchived: false, isFlagged: false } },
        { $sort: { createdAt: -1 } }, 
        { $limit: 200 }, 
        { $project: { hashtags: 1 } }
    ]);
    
    const tags = {};
    recent.forEach(r => (r.hashtags||[]).forEach(h => tags[h] = (tags[h]||0)+1));
    const trendingHashtags = Object.entries(tags)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,8)
        .map(t=>t[0]);

    res.json({ 
        users: suggestions, 
        trendingHashtags 
    });
  } catch (err) { 
      console.error(err);
      res.status(500).json({ message: err.message }); 
  }
};