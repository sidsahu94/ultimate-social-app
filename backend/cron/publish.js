// backend/cron/publish.js
const Post = require('../models/Post');

setInterval(async () => {
  const now = new Date();
  const pending = await Post.find({ publishAt: { $lte: now }, isPublished: { $ne: true } });
  for (const p of pending) {
    p.isPublished = true;
    await p.save();
    // emit event
    global.io?.emit('post:published', p);
  }
}, 15 * 1000); // every 15s in DEV; increase in prod
