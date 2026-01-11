// backend/controllers/searchController.js
const User = require('../models/User');
const Post = require('../models/Post');

/**
 * GLOBAL SEARCH CONTROLLER
 * - Searches across Users, Posts, and Hashtags
 * - Ranking logic for posts = likes + recency weight
 * - Supports free-text and hashtag-based queries
 */
exports.global = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [], posts: [], hashtags: [] });

    // 🔍 1️⃣ Search USERS by name or email (text index + regex fallback)
    const users = await User.find({
      $or: [
        { $text: { $search: q } },
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name avatar followers badges')
      .limit(25);

    // 🔍 2️⃣ Search POSTS by content or hashtags (ranked)
    const posts = await Post.aggregate([
      {
        $match: {
          $or: [
            { content: { $regex: q, $options: 'i' } },
            { hashtags: q.startsWith('#') ? q.slice(1).toLowerCase() : q.toLowerCase() }
          ]
        }
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          recencyDays: {
            $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60 * 24]
          }
        }
      },
      {
        $addFields: {
          // Score = likes + (recency weight inverse)
          score: { $subtract: [{ $add: ['$likesCount', 5] }, '$recencyDays'] }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 50 }
    ]);

    // Populate user for posts
    await Post.populate(posts, { path: 'user', select: 'name avatar' });

    // 🔍 3️⃣ Trending Hashtags in past 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tagsAgg = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // ✅ Return combined search result
    res.json({
      query: q,
      users,
      posts,
      hashtags: tagsAgg.map(t => t._id)
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};
