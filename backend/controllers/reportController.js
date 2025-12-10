// backend/controllers/reportController.js
const Report = require('../models/Report');

exports.createReport = async (req, res) => {
  try {
    const { targetUser, targetPost, reason, details } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason required' });

    const rpt = new Report({
      reporter: req.user._id,
      targetUser: targetUser || null,
      targetPost: targetPost || null,
      reason,
      details,
    });
    await rpt.save();
    return res.status(201).json(rpt);
  } catch (err) {
    console.error('createReport err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const q = await Report.find().sort({ createdAt: -1 }).populate('reporter', 'name email').populate('targetUser', 'name').populate('targetPost', 'content');
    return res.json(q);
  } catch (err) {
    console.error('getReports err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const id = req.params.id;
    const update = req.body;
    const r = await Report.findByIdAndUpdate(id, update, { new: true });
    return res.json(r);
  } catch (err) {
    console.error('updateReport err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
