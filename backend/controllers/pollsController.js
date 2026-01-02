// backend/controllers/pollsController.js
const Post = require('../models/Post');

exports.createPollPost = async (req, res) => {
  try {
    const { question, options = [], expiresAt } = req.body;
    
    if (!question || !options.length) {
      return res.status(400).json({ message: 'Invalid poll data' });
    }

    const post = await Post.create({
      user: req.user._id,
      content: question, // Optional: store question in content for searching
      poll: {
        question,
        options: options.map(t => ({ text: t, votes: [] })),
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    await post.populate('user', 'name avatar');
    
    // Emit real-time event if using sockets
    const io = req.app.get('io');
    if (io) io.emit('post:created', post);

    res.status(201).json(post);
  } catch (err) {
    console.error('Create poll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.vote = async (req, res) => {
  const { id, index } = req.params;
  const userId = req.user._id;
  const optIndex = Number(index);

  try {
    const post = await Post.findById(id);
    if (!post || !post.poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check expiry
    if (post.poll.expiresAt && new Date() > new Date(post.poll.expiresAt)) {
      return res.status(400).json({ message: 'Poll has ended' });
    }

    // 🔥 ATOMIC UPDATE STEP 1: Remove existing vote from ANY option
    // (This allows users to change their vote safely)
    await Post.updateOne(
      { _id: id },
      { $pull: { "poll.options.$[].votes": userId } }
    );

    // 🔥 ATOMIC UPDATE STEP 2: Add vote to the specific option
    // We use dynamic key interpolation `poll.options.${optIndex}.votes`
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $addToSet: { [`poll.options.${optIndex}.votes`]: userId } },
      { new: true } // Return the updated document
    ).populate('user', 'name avatar');

    res.json(updatedPost);
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ message: 'Vote failed' });
  }
};