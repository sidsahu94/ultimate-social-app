// backend/controllers/groupsController.js
const Group = require('../models/Group');
const Post = require('../models/Post');
const User = require('../models/User');

exports.createGroup = async (req, res) => {
  try {
    const { name, handle, description, privacy } = req.body;
    if (!name || !handle) return res.status(400).json({ message: 'Missing name or handle' });
    const exists = await Group.findOne({ handle });
    if (exists) return res.status(400).json({ message: 'Handle already taken' });

    const g = new Group({
      name, handle, description, privacy: privacy || 'public',
      members: [req.user._id],
      admins: [req.user._id]
    });
    await g.save();
    res.status(201).json(g);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.joinGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Group not found' });
    if (g.members.map(String).includes(String(req.user._id))) return res.json({ joined: true });
    if (g.privacy === 'private') return res.status(403).json({ message: 'This group is private' });
    g.members.push(req.user._id);
    await g.save();
    res.json({ joined: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.leaveGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Group not found' });
    g.members = g.members.filter(m => String(m) !== String(req.user._id));
    g.admins = g.admins.filter(a => String(a) !== String(req.user._id));
    await g.save();
    res.json({ left: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id).populate('members', 'name avatar').populate('admins', 'name avatar');
    if (!g) return res.status(404).json({ message: 'Group not found' });
    res.json(g);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.postToGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Group not found' });
    if (!g.members.map(String).includes(String(req.user._id))) return res.status(403).json({ message: 'Not a member' });

    const post = new Post({
      user: req.user._id,
      content: req.body.content || '',
      images: req.body.images || [],
      videos: req.body.videos || []
    });
    await post.save();
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
