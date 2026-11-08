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

// Replace your existing postToGroup logic with this updated version
exports.postToGroup = async (req, res) => {
    try {
        const { text, images } = req.body;
        const groupId = req.params.groupId; // Assuming ID comes from URL

        // Verify group exists
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Ensure user is a member of the group before posting (Add your specific check here)

        // Create the post and ATTACH the group ID
        const newPost = await Post.create({
            user: req.user._id,
            group: groupId, // THIS IS THE CRITICAL FIX
            text: text,
            images: images || []
        });

        // Optionally update group's post count or latest activity here

        res.status(201).json({ success: true, post: newPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
