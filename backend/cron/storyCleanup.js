// backend/cron/storyCleanup.js
const cron = require('node-cron');
const Story = require('../models/Story');
const { deleteFile } = require('../utils/cloudinary');

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('🧹 Running Story Cleanup...');
  try {
    const now = new Date();
    
    // 1. Find expired stories
    const expiredStories = await Story.find({ expiresAt: { $lt: now } });
    
    if (expiredStories.length === 0) return;

    // 2. Delete media from Cloudinary
    for (const story of expiredStories) {
      if (story.media) {
         // This uses the deleteFile utility we fixed earlier
         await deleteFile(story.media);
      }
    }

    // 3. Delete from DB
    const ids = expiredStories.map(s => s._id);
    await Story.deleteMany({ _id: { $in: ids } });
    
    console.log(`✅ Cleaned up ${ids.length} expired stories.`);
  } catch (err) {
    console.error('Story cleanup failed:', err);
  }
});