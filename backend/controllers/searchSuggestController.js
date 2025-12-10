// backend/controllers/searchSuggestController.js
const User = require('../models/User');
const Post = require('../models/Post');

/**
 * Basic suggestion engine:
 * - Suggest users with high follower count who are not followed by me
 * - Suggest trending hashtags from recent posts
 */
exports.suggestions = async (req, res) => {
  try {
    const meId = req.user?._id;
    const topUsers = await User.find().sort({ 'followers.length': -1, createdAt: -1 }).limit(50).select('name avatar followers');
    const suggestions = topUsers.filter(u => meId ? !u.followers.map(String).includes(String(meId)) : true).slice(0, 10);
    const recent = await Post.aggregate([{ $sort: { createdAt: -1 } }, { $limit: 200 }, { $project: { hashtags: 1 } }]);
    const tags = {};
    recent.forEach(r => (r.hashtags||[]).forEach(h => tags[h] = (tags[h]||0)+1));
    const trendingHashtags = Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,8).map(t=>t[0]);
    res.json({ users: suggestions.map(u=>({ _id:u._id, name:u.name, avatar:u.avatar })), trendingHashtags });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
