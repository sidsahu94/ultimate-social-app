// backend/controllers/groupsController.js
const Group = require('../models/Group');
const Post = require('../models/Post');
const User = require('../models/User');

exports.listGroups = async (req, res) => {
  try {
    let groups = await Group.find()
      .populate('admins', 'name avatar username')
      .populate('members', 'name avatar username')
      .sort({ createdAt: -1 })
      .limit(50);

    // Provide default community hubs if database has no groups yet
    if (!groups || groups.length === 0) {
      const defaultGroups = [
        {
          name: 'AI Architects & Engineers',
          handle: 'ai-architects',
          description: 'Global community exploring frontier LLMs, neural networks, and agentic workflows.',
          privacy: 'public',
        },
        {
          name: 'Web3 & Financial Freedom',
          handle: 'web3-creators',
          description: 'Autonomous finance, tokenomics, DeFi, and digital creator economies.',
          privacy: 'public',
        },
        {
          name: 'Luxury Design & Cinematic UI',
          handle: 'luxury-ui',
          description: 'Designers shaping OLED dark aesthetics, motion graphics, and luxury digital products.',
          privacy: 'public',
        },
        {
          name: 'Founders & Visionaries Matrix',
          handle: 'founders-enclave',
          description: 'Builders, bootstrappers, and visionary entrepreneurs scaling disruptive tech.',
          privacy: 'public',
        }
      ];

      try {
        const adminUser = await User.findOne({ role: 'admin' });
        const creatorId = adminUser?._id || req.user?._id;
        if (creatorId) {
          groups = await Group.create(
            defaultGroups.map((g) => ({
              ...g,
              admins: [creatorId],
              members: [creatorId],
            }))
          );
        }
      } catch (_) {}
    }

    res.json({ success: true, data: groups || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, handle, description, privacy } = req.body;
    if (!name || !handle) return res.status(400).json({ message: 'Missing name or handle' });
    const exists = await Group.findOne({ handle });
    if (exists) return res.status(400).json({ message: 'Handle already taken' });

    const g = new Group({
      name,
      handle,
      description,
      privacy: privacy || 'public',
      members: [req.user._id],
      admins: [req.user._id]
    });
    await g.save();
    res.status(201).json({ success: true, data: g });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Group not found' });
    if (g.members.map(String).includes(String(req.user._id))) {
      return res.json({ success: true, joined: true });
    }
    if (g.privacy === 'private') {
      return res.status(403).json({ message: 'This group is private' });
    }
    g.members.push(req.user._id);
    await g.save();
    res.json({ success: true, joined: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Group not found' });
    g.members = g.members.filter(m => String(m) !== String(req.user._id));
    g.admins = g.admins.filter(a => String(a) !== String(req.user._id));
    await g.save();
    res.json({ success: true, left: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id)
      .populate('members', 'name avatar username')
      .populate('admins', 'name avatar username');
    if (!g) return res.status(404).json({ message: 'Group not found' });
    res.json({ success: true, data: g });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGroupPosts = async (req, res) => {
  try {
    const posts = await Post.find({ group: req.params.id })
      .populate('user', 'name avatar username isVerified')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: posts || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.postToGroup = async (req, res) => {
  try {
    const { text, content, images } = req.body;
    const postContent = content || text || '';
    const groupId = req.params.groupId || req.body.groupId;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const newPost = await Post.create({
      user: req.user._id,
      group: groupId,
      content: postContent,
      caption: postContent,
      images: images || []
    });

    await newPost.populate('user', 'name avatar username isVerified');

    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};
