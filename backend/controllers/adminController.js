const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment'); // 🔥 Added
const Notification = require('../models/Notification'); // 🔥 Added
const Story = require('../models/Story'); // 🔥 Added
const GameScore = require('../models/GameScore'); // 🔥 Added
const Product = require('../models/Product'); // 🔥 Added

exports.getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    res.json({ userCount, postCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').limit(200);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔥 FIX: robust cleanup (copied logic from usersController)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Content Cleanup
    await Post.deleteMany({ user: userId });
    await Comment.deleteMany({ user: userId });
    await Story.deleteMany({ user: userId });
    await GameScore.deleteMany({ user: userId });
    await Product.deleteMany({ owner: userId });

    // 2. Social Cleanup (Pull ID from arrays)
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );

    // 3. Remove Likes
    await Post.updateMany({ likes: userId }, { $pull: { likes: userId } });

    // 4. Notifications
    await Notification.deleteMany({ $or: [{ user: userId }, { actor: userId }] });

    // 5. Delete User
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User and all associated data deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
// ... existing imports and functions ...

exports.listPosts = async (req, res) => {
  try {
    // Return latest 100 posts for moderation
    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('user', 'name email avatar');
        
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Ensure exports.deletePost is also handled. 
// Since postsController.deletePost handles cleanup (images, comments),
// we can usually reuse it or replicate logic. 
// Since you implemented a robust deleteUser, let's allow postsController.deletePost 
// to handle admin deletion (it already checks req.user.role === 'admin').