// backend/cron/publish.js
const Post = require('../models/Post');

const publishScheduledPosts = async () => {
  try {
    const now = new Date();
    const pending = await Post.find({
      scheduledAt: { $lte: now },
      status: 'scheduled'
    });

    for (const p of pending) {
      p.status = 'published';
      p.isDraft = false;
      p.createdAt = now;
      await p.save();
      await p.populate('user', 'name username avatar');

      const io = global.io;
      if (io) {
        io.emit('post:created', p);
        io.emit('post:published', p);
      }
    }
  } catch (err) {
    console.error('Error publishing scheduled posts:', err);
  }
};

setInterval(publishScheduledPosts, 20 * 1000);

module.exports = publishScheduledPosts;
