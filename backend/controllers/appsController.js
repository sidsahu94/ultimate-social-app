const Event = require('../models/Event');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GameScore = require('../models/GameScore');

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
    if (!event.attendees.includes(req.user._id)) {
      event.attendees.push(req.user._id);
      await event.save();
    }
    res.json(event);
  } catch (e) { res.status(500).json({ message: 'Error joining' }); }
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
    // Mock advanced data for now (replace with real aggregations later)
    res.json({
      overview: {
        followers: user.followers.length,
        views: 1205, // Placeholder
        engagement: '4.5%'
      },
      chartData: [10, 45, 30, 60, 75, 100]
    });
  } catch (e) { res.status(500).json({ message: 'Error' }); }
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

// ... existing imports

exports.submitScore = async (req, res) => {
  try {
    const { gameId, score } = req.body;
    const userId = req.user._id;

    // 1. Save Score (Always allow playing)
    await GameScore.create({ user: userId, gameId, score });

    // 2. Reward Logic (With Daily Cap)
    const reward = Math.floor(score / 100);

    if (reward > 0) {
      const user = await User.findById(userId);
      const today = new Date();
      today.setHours(0,0,0,0);

      // Find total earned today from games
      // (This requires looking up recent transactions or storing a "dailyEarned" field on User. 
      //  For this fix, we'll aggregate Transactions.)
      const todaysTransactions = await Transaction.find({
          user: userId,
          type: 'credit',
          description: { $regex: /Reward for/ }, // Matches our game description
          createdAt: { $gte: today }
      });

      const earnedToday = todaysTransactions.reduce((acc, t) => acc + t.amount, 0);
      const DAILY_CAP = 500;

      if (earnedToday >= DAILY_CAP) {
          return res.json({ message: 'Score saved (Daily limit reached)', earned: 0 });
      }

      // Cap the reward if it exceeds remaining limit
      const actualReward = Math.min(reward, DAILY_CAP - earnedToday);

      if (actualReward > 0) {
          user.wallet.balance += actualReward;
          user.wallet.totalReceived += actualReward;
          await user.save();

          await Transaction.create({
            user: userId,
            type: 'credit',
            amount: actualReward,
            description: `Reward for ${gameId} score: ${score}`
          });

          return res.json({ message: 'Score saved', earned: actualReward, newBalance: user.wallet.balance });
      }
    }

    res.json({ message: 'Score saved', earned: 0 });
  } catch (e) { 
    console.error(e);
    res.status(500).json({ message: 'Error saving score' }); 
  }
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