// backend/controllers/appsController.js
const Event = require('../models/Event');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GameScore = require('../models/GameScore');
const Post = require('../models/Post');
const mongoose = require('mongoose');

// =================================================================
// EVENTS
// =================================================================

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ date: { $gte: new Date() } })
      .populate('host', 'name avatar')
      .sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (e) { 
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
      image 
    });
    res.status(201).json({ success: true, data: event });
  } catch (e) { 
      res.status(500).json({ success: false, message: 'Error creating event' }); 
  }
};

// 🔥 FIX: Atomic Join (Race Condition Prevention)
exports.joinEvent = async (req, res) => {
  try {
    // $addToSet atomic operator is key here
    const event = await Event.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { attendees: req.user._id } },
        { new: true }
    ).populate('host', 'name avatar');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, data: event });
  } catch (e) { 
     res.status(500).json({ success: false, message: 'Error joining event' }); 
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (String(event.host) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (e) { 
      res.status(500).json({ success: false, message: 'Server error' }); 
  }
};

// =================================================================
// WALLET
// =================================================================

exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ 
        success: true,
        data: {
            balance: user.wallet?.balance || 0, 
            transactions 
        }
    });
  } catch (e) { 
      res.status(500).json({ success: false, message: 'Error fetching wallet' }); 
  }
};

// =================================================================
// ANALYTICS
// =================================================================

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
      success: true,
      data: {
        overview: {
            followers: user.followers.length,
            posts: postCount,
            likes: totalLikes,
            engagement: postCount > 0 ? ((totalLikes / postCount).toFixed(1)) + ' avg' : '0'
        },
        // Real or Mocked Chart Data
        chartData: [10, 25, 15, 30, 45, 60, totalLikes] 
      }
    });
  } catch (e) { 
      console.error(e);
      res.status(500).json({ success: false, message: 'Error fetching analytics' }); 
  }
};

// =================================================================
// GAMES
// =================================================================

exports.getLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;

    // 🔥 FIX: Aggregation Pipeline to show unique user high scores only
    const scores = await GameScore.aggregate([
      // 1. Filter by Game ID
      { $match: { gameId: gameId } },
      // 2. Sort by Score Descending
      { $sort: { score: -1 } },
      // 3. Group by User, keeping the highest score (first one due to sort)
      { 
        $group: { 
          _id: "$user", 
          score: { $first: "$score" },
          docId: { $first: "$_id" }
        } 
      },
      // 4. Sort the grouped results
      { $sort: { score: -1 } },
      // 5. Limit to Top 10
      { $limit: 10 },
      // 6. Join with User collection to get name/avatar
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      // 7. Unwind the user array (lookup returns array)
      { $unwind: "$userDetails" },
      // 8. Project final shape (matching what frontend expects)
      {
        $project: {
          score: 1,
          user: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            avatar: "$userDetails.avatar"
          }
        }
      }
    ]);

    res.json({ success: true, data: scores });
  } catch (e) { 
      console.error(e);
      res.status(500).json({ success: false, message: 'Error fetching leaderboard' }); 
  }
};

// 🔥 TRANSACTIONAL SCORE SUBMISSION (Secure)
exports.submitScore = async (req, res) => {
  let session = null;
  try {
    const { gameId, score } = req.body;
    const userId = req.user._id;

    if (!score || score < 0) return res.status(400).json({ success: false, message: 'Invalid score' });

    // Try to start a Mongoose Transaction (ACID)
    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch (err) {
        session = null; // Fallback if not on Replica Set
    }

    const opts = session ? { session } : {};

    // 1. Save Score
    await GameScore.create([{ user: userId, gameId, score }], opts);

    // 2. Reward Logic
    const reward = Math.floor(score / 100); 
    const DAILY_CAP = 500;
    
    // Check Daily Limit
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const todaysTransactions = await Transaction.find({
        user: userId,
        type: 'credit',
        description: { $regex: /Reward for/ }, 
        createdAt: { $gte: today }
    }); 

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
        const freshUser = await User.findById(userId).select('wallet.balance');
        io.to(String(userId)).emit('wallet:update', { balance: freshUser.wallet.balance });
    }

    res.json({ success: true, message: 'Score saved', earned });

  } catch (e) { 
    if (session) {
        await session.abortTransaction();
        session.endSession();
    }
    console.error("Game submission error:", e);
    res.status(500).json({ success: false, message: 'Error saving score' }); 
  }
};