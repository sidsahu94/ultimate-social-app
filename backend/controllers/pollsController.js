
// backend/controllers/pollsController.js
const Post = require('../models/Post');
const PollVote = require('../models/PollVote');
const mongoose = require('mongoose');

// --- 1. CREATE POLL ---
exports.createPollPost = async (req, res) => {
  try {
    const { question, options = [], expiresAt } = req.body;
    
    if (!question || !options.length) {
      return res.status(400).json({ message: 'Invalid poll data. Question and options are required.' });
    }

    // Create the post with the new lightweight schema (counts only, no user IDs array)
    const post = await Post.create({
      user: req.user._id,
      content: question, // Storing question in content allows it to be searchable via standard text index
      poll: {
        question,
        options: options.map(text => ({ 
          text, 
          count: 0 // Initialize count to 0
        })),
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    await post.populate('user', 'name avatar');
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) io.emit('post:created', post);

    res.status(201).json(post);
  } catch (err) {
    console.error('Create poll error:', err);
    res.status(500).json({ message: 'Server error creating poll' });
  }
};

// --- 2. VOTE (Transactional & Scalable) ---
exports.vote = async (req, res) => {
  const { id } = req.params;
  const { index } = req.body;
  const userId = req.user._id;
  const optIndex = Number(index);

  let session = null;

  try {
    // Start ACID Transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // 1. Fetch Post to validate existence and expiry
    const post = await Post.findById(id).session(session);
    if (!post || !post.poll) throw new Error('Poll not found');
    
    if (post.poll.expiresAt && new Date() > new Date(post.poll.expiresAt)) {
      throw new Error('Poll has ended');
    }

    if (optIndex < 0 || optIndex >= post.poll.options.length) {
      throw new Error('Invalid option index');
    }

    // 2. Check if user already voted on this poll
    const existingVote = await PollVote.findOne({ postId: id, userId }).session(session);
    
    if (existingVote) {
      // A. User clicked the SAME option they already chose -> Do nothing (or return current state)
      if (existingVote.optionIndex === optIndex) {
        await session.abortTransaction();
        session.endSession();
        return res.json(post); 
      }
      
      // B. User changing vote: Decrement the OLD option count
      await Post.updateOne(
        { _id: id },
        { $inc: { [`poll.options.${existingVote.optionIndex}.count`]: -1 } }
      ).session(session);
      
      // Remove the old vote record
      await existingVote.deleteOne({ session });
    }

    // 3. Create the NEW vote record
    await PollVote.create([{ 
      postId: id, 
      userId, 
      optionIndex: optIndex 
    }], { session });

    // 4. Increment the NEW option count
    const updatedPost = await Post.findOneAndUpdate(
      { _id: id },
      { $inc: { [`poll.options.${optIndex}.count`]: 1 } },
      { new: true, session }
    ).populate('user', 'name avatar');

    // Commit changes
    await session.commitTransaction();
    
    // 5. Emit real-time update to socket room
    const io = req.app.get('io');
    if (io) {
      io.emit('post:updated', { 
        _id: updatedPost._id, 
        poll: updatedPost.poll 
      });
    }

    // Return the updated post object
    // We manually attach `userVotedIndex` for the frontend to highlight the selection immediately
    const result = updatedPost.toObject();
    result.poll.userVotedIndex = optIndex; 

    res.json(result);

  } catch (err) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Vote error:', err);
    res.status(400).json({ message: err.message || 'Vote failed' });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};