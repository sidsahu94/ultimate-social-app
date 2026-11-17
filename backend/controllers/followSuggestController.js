// backend/controllers/followSuggestController.js
const User = require('../models/User');

class BoundedLruCache {
  constructor(maxSize = 500, ttlMs = 30000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.map = new Map();
  }
  get(key) {
    const item = this.map.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.ttlMs) {
      this.map.delete(key);
      return null;
    }
    this.map.delete(key);
    this.map.set(key, item);
    return item;
  }
  set(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}
const suggestCache = new BoundedLruCache(500, 30000);

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
