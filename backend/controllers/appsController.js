// backend/controllers/appsController.js
const Event = require('../models/Event');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GameScore = require('../models/GameScore');
const Post = require('../models/Post');
const mongoose = require('mongoose');

// --- EVENTS ---
exports.getEvents = async (req, res) => {
  try {
    // Fetch upcoming events
    const events = await Event.find({ date: { $gte: new Date() } })
      .populate('host', 'name avatar')
      .sort({ date: 1 });
    res.json(events);
  } catch (e) { res.status(500).json({ message: 'Error fetching events' }); }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, date, location, description } = req.body;
    const event = await Event.create({
      host: req.user._id,
      title,
      date,
      location,
      description
    });
    res.status(201).json(event);
  } catch (e) { res.status(500).json({ message: 'Error creating event' }); }
};

exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Prevent duplicate join
    if (!event.attendees.includes(req.user._id)) {
      event.attendees.push(req.user._id);
      await event.save();
    }
    res.json(event);
  } catch (e) { res.status(500).json({ message: 'Error joining' }); }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Not found' });
    
    // Check ownership
    if (String(event.host) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// --- WALLET ---
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ balance: user.wallet?.balance || 0, transactions });
  } catch (e) { res.status(500).json({ message: 'Error fetching wallet' }); }
};

// --- ANALYTICS ---
exports.getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // 1. Get Real Post Count
    const postCount = await Post.countDocuments({ user: req.user._id });

    // 2. Get Real Total Likes Received (Aggregation)
    const likesAgg = await Post.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        { $project: { count: { $size: { $ifNull: ["$likes", []] } } } },
        { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    const totalLikes = likesAgg[0]?.total || 0;

    res.json({
      overview: {
        followers: user.followers.length,
        posts: postCount,
        likes: totalLikes,
        engagement: postCount > 0 ? ((totalLikes / postCount).toFixed(1)) + ' avg' : '0'
      },
      // Dummy chart data for visualization (Real historical data requires a separate Analytics model)
      chartData: [10, 25, 15, 30, 45, 60, totalLikes] 
    });
  } catch (e) { 
      console.error(e);
      res.status(500).json({ message: 'Error fetching analytics' }); 
  }
};

// --- GAMES ---
exports.getLeaderboard = async (req, res) => {
  try {
    const scores = await GameScore.find({ gameId: req.params.gameId })
      .sort({ score: -1 })
      .limit(10)
      .populate('user', 'name avatar');
    res.json(scores);
  } catch (e) { res.status(500).json({ message: 'Error' }); }
};

// 🔥 TRANSACTIONAL SCORE SUBMISSION (Updated)
exports.submitScore = async (req, res) => {
  let session = null;
  try {
    const { gameId, score } = req.body;
    const userId = req.user._id;

    // Start ACID Session (Safe Fallback)
    // Check if we can use transactions (Replica Set only)
    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch (err) {
        // Fallback for standalone DB (Local Dev)
        session = null;
    }

    const opts = session ? { session } : {};

    // 1. Save Score
    await GameScore.create([{ user: userId, gameId, score }], opts);

    // 2. Reward Logic
    const reward = Math.floor(score / 100); // 1 Coin per 100 points
    const DAILY_CAP = 500;
    
    // Check Daily Limit
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const todaysTransactions = await Transaction.find({
        user: userId,
        type: 'credit',
        description: { $regex: /Reward for/ }, 
        createdAt: { $gte: today }
    }); // Transactions don't need session read usually for this check

    const earnedToday = todaysTransactions.reduce((acc, t) => acc + t.amount, 0);
    let earned = 0;

    if (reward > 0 && earnedToday < DAILY_CAP) {
        const actualReward = Math.min(reward, DAILY_CAP - earnedToday);
        
        if (actualReward > 0) {
            // Atomic Wallet Update
            await User.findByIdAndUpdate(
                userId, 
                { $inc: { "wallet.balance": actualReward, "wallet.totalReceived": actualReward } },
                opts
            );

            // Log Transaction
            await Transaction.create([{
                user: userId,
                type: 'credit',
                amount: actualReward,
                description: `Reward for ${gameId} score: ${score}`
            }], opts);
            
            earned = actualReward;
        }
    }

    // Commit Transaction
    if (session) {
        await session.commitTransaction();
        session.endSession();
    }
    
    // Emit socket event for instant wallet update on frontend
    const io = req.app.get('io') || global.io;
    if (io && earned > 0) {
        // 🔥 FIX: Fetch fresh balance to guarantee consistency
        const freshUser = await User.findById(userId).select('wallet.balance');
        io.to(String(userId)).emit('wallet:update', { balance: freshUser.wallet.balance });
    }

    res.json({ message: 'Score saved', earned });

  } catch (e) { 
    if (session) {
        await session.abortTransaction();
        session.endSession();
    }
    console.error(e);
    res.status(500).json({ message: 'Error saving score' }); 
  }
};