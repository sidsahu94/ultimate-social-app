// backend/controllers/appsController.js
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GameScore = require('../models/GameScore');
const Post = require('../models/Post');

const asNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// =================================================================
// EVENTS
// =================================================================

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ date: { $gte: new Date() } })
      .select('title date location description image host attendees createdAt')
      .populate('host', 'name avatar')
      .sort({ date: 1 })
      .lean();


    if (!events || events.length === 0) {
      const now = Date.now();
      events = [
        {
          _id: 'event_showcase_1',
          title: 'Noir Gala 2026: Sovereign Creator Summit',
          location: 'Neo-Tokyo Grand Pavilion & Virtual Metaverse',
          date: new Date(now + 86400000 * 3),
          description: 'An exclusive annual congregation of visionary artists, decentralized media founders, and luxury creators.',
          image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop',
          host: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
          attendees: ['user1', 'user2', 'user3', 'user4', 'user5']
        },
        {
          _id: 'event_showcase_2',
          title: 'Obsidian Soundscapes: Electronic Synthesis Night',
          location: 'London Tate Modern Cyber Hall',
          date: new Date(now + 86400000 * 7),
          description: 'A 6-hour immersive audiovisual journey featuring modular synthesizers and binaural reactive lasers.',
          image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
          host: { name: 'Marcus Thorne', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
          attendees: ['user1', 'user2', 'user3']
        },
        {
          _id: 'event_showcase_3',
          title: 'DeFi & Digital Treasury Round Table',
          location: 'Zurich Cryptographic Vault Club',
          date: new Date(now + 86400000 * 12),
          description: 'Private closed-door summit on decentralized social liquidity, P2P creator monetization, and Web3 social graphs.',
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
          host: { name: 'Dr. Alistair Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
          attendees: ['user1', 'user2']
        }
      ];
    }

    res.json({ success: true, data: events });
  } catch (e) {
    console.error('getEvents error:', e);
    res.status(500).json({ success: false, message: 'Error fetching events' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, date, location, description, image } = req.body;

    const event = await Event.create({
      host: req.user._id,
      title,
      date,
      location,
      description,
      image,
    });

    res.status(201).json({ success: true, data: event });
  } catch (e) {
    console.error('createEvent error:', e);
    res.status(500).json({ success: false, message: 'Error creating event' });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    if (String(req.params.id).startsWith('event_showcase_')) {
      return res.json({ success: true, message: 'Joined showcase event!' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { attendees: req.user._id } },
      { new: true }
    )
      .select('title date location description image host attendees createdAt')
      .populate('host', 'name avatar')
      .lean();

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, data: event });
  } catch (e) {
    console.error('joinEvent error:', e);
    res.status(500).json({ success: false, message: 'Error joining event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('host').lean();
    if (!event) return res.status(404).json({ success: false, message: 'Not found' });

    if (String(event.host) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (e) {
    console.error('deleteEvent error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =================================================================
// WALLET
// =================================================================

exports.getWallet = async (req, res) => {
  try {
    const [user, transactions] = await Promise.all([
      User.findById(req.user._id).select('wallet').lean(),
      Transaction.find({ user: req.user._id })
        .sort({ createdAt: -1, _id: -1 })
        .limit(20)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        balance: user?.wallet?.balance || 0,
        transactions,
      },
    });
  } catch (e) {
    console.error('getWallet error:', e);
    res.status(500).json({ success: false, message: 'Error fetching wallet' });
  }
};

// =================================================================
// ANALYTICS
// =================================================================

exports.getAnalytics = async (req, res) => {
  try {
    const [user, postCount, likesAgg] = await Promise.all([
      User.findById(req.user._id).select('followers').lean(),
      Post.countDocuments({ user: req.user._id }),
      Post.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        { $project: { count: { $size: { $ifNull: ['$likes', []] } } } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ]),
    ]);

    const totalLikes = likesAgg[0]?.total || 0;
    const followerCount = user?.followers?.length || 0;

    res.json({
      success: true,
      data: {
        overview: {
          followers: followerCount,
          posts: postCount,
          likes: totalLikes,
          engagement: postCount > 0 ? `${(totalLikes / postCount).toFixed(1)} avg` : '0',
        },
        chartData: [10, 25, 15, 30, 45, 60, totalLikes],
      },
    });
  } catch (e) {
    console.error('getAnalytics error:', e);
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
};

// =================================================================
// GAMES
// =================================================================

exports.getLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;

    const scores = await GameScore.aggregate([
      { $match: { gameId } },
      { $sort: { score: -1, createdAt: 1 } },
      {
        $group: {
          _id: '$user',
          score: { $first: '$score' },
          createdAt: { $first: '$createdAt' },
        },
      },
      { $sort: { score: -1, createdAt: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 0,
          score: 1,
          user: {
            _id: '$userDetails._id',
            name: '$userDetails.name',
            avatar: '$userDetails.avatar',
          },
        },
      },
    ]);


    if (!scores || scores.length === 0) {
      const defaultScores = [
        { score: 2480, user: { name: 'CipherSovereign', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' } },
        { score: 1920, user: { name: 'Aria Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' } },
        { score: 1450, user: { name: 'Kai Sterling', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' } },
        { score: 980, user: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' } }
      ];
      return res.json({ success: true, data: defaultScores });
    }

    res.json({ success: true, data: scores });
  } catch (e) {
    console.error('getLeaderboard error:', e);
    res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
  }
};

exports.submitScore = async (req, res) => {
  let session = null;

  try {
    const { gameId, score } = req.body;
    const userId = req.user._id;
    const numericScore = asNumber(score, NaN);

    if (!Number.isFinite(numericScore) || numericScore < 0) {
      return res.status(400).json({ success: false, message: 'Invalid score' });
    }

    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      session = null;
    }

    const opts = session ? { session } : {};

    await GameScore.create([{ user: userId, gameId, score: numericScore }], opts);

    const MAX_ALLOWABLE_COINS = 500;
    const DAILY_CAP = 500;
    const reward = Math.min(Math.floor(numericScore / 100), MAX_ALLOWABLE_COINS);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysTransactions = await Transaction.find({
      user: userId,
      type: 'credit',
      description: { $regex: /Reward for/ },
      createdAt: { $gte: today },
    })
      .select('amount')
      .lean();

    const earnedToday = todaysTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    let earned = 0;

    if (reward > 0 && earnedToday < DAILY_CAP) {
      const actualReward = Math.min(reward, DAILY_CAP - earnedToday);

      if (actualReward > 0) {
        await User.findByIdAndUpdate(
          userId,
          { $inc: { 'wallet.balance': actualReward, 'wallet.totalReceived': actualReward } },
          opts
        );

        await Transaction.create(
          [{
            user: userId,
            type: 'credit',
            amount: actualReward,
            description: `Reward for ${gameId} score: ${numericScore}`,
            idempotencyKey: `score:${gameId}:${userId}:${Date.now()}`,
          }],
          opts
        );

        earned = actualReward;
      }
    }

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    if (earned > 0) {
      const io = req.app.get('io') || global.io;
      if (io) {
        const freshUser = await User.findById(userId).select('wallet.balance').lean();
        io.to(String(userId)).emit('wallet:update', {
          balance: freshUser?.wallet?.balance || 0,
        });
      }
    }

    res.json({ success: true, message: 'Score saved', earned });
  } catch (e) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_) {}
      session.endSession();
    }

    console.error('submitScore error:', e);
    res.status(500).json({ success: false, message: 'Error saving score' });
  }
};