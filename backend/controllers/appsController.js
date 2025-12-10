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

exports.submitScore = async (req, res) => {
  try {
    await GameScore.create({ 
      user: req.user._id, 
      gameId: req.body.gameId, 
      score: req.body.score 
    });
    res.json({ message: 'Score saved' });
  } catch (e) { res.status(500).json({ message: 'Error' }); }
};