// backend/controllers/payoutController.js
const Payout = require('../models/Payout');
const User = require('../models/User');

exports.create = async (req, res) => {
  try {
    const { amount, method = 'manual', details } = req.body;
    
    // 1. Validation
    if (!amount || amount < 10) return res.status(400).json({ message: 'Minimum withdrawal is 10 coins' });
    
    const user = await User.findById(req.user._id);
    if (user.wallet.balance < amount) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // 2. Deduct Balance Immediately (Lock funds)
    user.wallet.balance -= amount;
    await user.save();

    // 3. Create Payout Request
    // We map 'details' (from frontend) to 'note' (in DB schema)
    const payout = await Payout.create({
      creator: req.user._id,
      amount,
      method,
      note: details || 'Withdrawal Request',
      status: 'pending'
    });

    res.status(201).json(payout);
  } catch (err) {
    console.error("Payout Create Error:", err);
    res.status(500).json({ message: 'Server error processing payout' });
  }
};

exports.list = async (req, res) => {
  try {
    const items = await Payout.find()
        .populate('creator', 'name email avatar wallet')
        .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const payout = await Payout.findById(id);
    
    if (!payout) return res.status(404).json({ message: 'Payout not found' });
    if (payout.status === 'paid') return res.status(400).json({ message: 'Already paid' });

    payout.status = 'paid';
    payout.paidAt = new Date();
    await payout.save();

    // Notify user via Socket (Optional enhancement)
    const io = req.app.get('io');
    if (io) {
        io.to(String(payout.creator)).emit('notification', {
            type: 'system',
            message: `Your withdrawal of ${payout.amount} coins has been processed!`
        });
    }

    res.json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};