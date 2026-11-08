// backend/controllers/searchSuggestController.js
const User = require('../models/User');
const Post = require('../models/Post');

const searchCache = new Map();

exports.suggestions = async (req, res) => {
  try {
    const meId = req.user ? String(req.user._id) : 'guest';
    const cached = searchCache.get(meId);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return res.status(200).json(cached.data);
    }

    const userMatch = { isDeleted: { $ne: true } };
    if (req.user) {
      userMatch._id = { $ne: req.user._id };
    }

    const topUsers = await User.aggregate([
      { $match: userMatch },
      {
        $addFields: {
          followerCount: { $size: { $ifNull: ['$followers', []] } },
        },
      },
      { $sort: { followerCount: -1, createdAt: -1 } },
      { $limit: 20 },
      {
        $project: {
          name: 1,
          avatar: 1,
          followers: 1,
          bio: 1,
          badges: 1,
          followerCount: 1,
        },
      },
    ]);

    const suggestions = req.user
      ? topUsers.filter((u) => !(u.followers || []).map(String).includes(String(req.user._id))).slice(0, 10)
      : topUsers.slice(0, 10);

    const recentTags = await Post.aggregate([
      {
        $match: {
          isArchived: { $ne: true },
          isFlagged: { $ne: true },
          isDraft: { $ne: true },
        },
      },
      { $project: { hashtags: { $ifNull: ['$hashtags', []] } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 8 },
    ]);

    const trendingHashtags = recentTags.map((tag) => tag._id);

    const fallbackHashtags = ['Obsidian', 'CinemaNoir', 'WebRTC', 'NextGenSocial', 'LuxuryDesign', 'CreatorTreasury'];
    const finalHashtags = trendingHashtags.length > 0 ? trendingHashtags : fallbackHashtags;

    const fallbackUsers = [
      { _id: 'suggest_user_1', name: 'Elena Rostova', username: 'elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', bio: 'Digital Art Director • Neo-Tokyo', followerCount: 1420 },
      { _id: 'suggest_user_2', name: 'Marcus Thorne', username: 'marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', bio: 'Modular Synthesizer Architect', followerCount: 980 },
      { _id: 'suggest_user_3', name: 'Aria Chen', username: 'aria', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', bio: 'Cinematic Fashion & Visual Storyteller', followerCount: 2150 }
    ];
    const finalUsers = suggestions.length > 0 ? suggestions : fallbackUsers;

    const responsePayload = {
      users: finalUsers,
      trendingHashtags: finalHashtags,
    };

    searchCache.set(meId, { data: responsePayload, timestamp: Date.now() });

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Suggestions Error:', err);
    res.status(500).json({ message: err.message || 'Suggestion lookup failed' });
  }
};
