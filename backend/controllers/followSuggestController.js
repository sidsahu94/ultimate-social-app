// backend/controllers/followSuggestController.js
const User = require('../models/User');

const suggestCache = new Map();

exports.suggest = async (req, res) => {
  try {
    const meId = req.user._id;
    const cacheKey = String(meId);
    const cached = suggestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return res.json(cached.data);
    }

    const me = await User.findById(meId).select('following blockedUsers').lean();
    if (!me) return res.json([]);

    const following = new Set((me.following || []).map(String));
    const blocked = new Set((me.blockedUsers || []).map(String));

    const popular = await User.aggregate([
      { $match: { _id: { $ne: meId }, isDeleted: { $ne: true } } },
      {
        $addFields: {
          followerCount: { $size: { $ifNull: ['$followers', []] } },
        },
      },
      { $sort: { followerCount: -1, createdAt: -1 } },
      { $limit: 50 },
      {
        $project: {
          _id: 1,
          name: 1,
          avatar: 1,
          followers: 1,
          followerCount: 1,
        },
      },
    ]);

    const pool = [];
    for (const u of popular) {
      const uid = String(u._id);
      if (!following.has(uid) && !blocked.has(uid)) {
        pool.push(uid);
      }
    }

    if (pool.length === 0) return res.json([]);

    const candidates = await User.find({ _id: { $in: pool } })
      .select('name avatar followers')
      .lean();

    candidates.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0));

    const result = candidates.slice(0, 20);
    suggestCache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json(result);
  } catch (err) {
    console.error('Follow suggest error:', err);
    res.status(500).json({ message: 'Error retrieving suggestions' });
  }
};
