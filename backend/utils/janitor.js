// backend/utils/janitor.js
const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const Story = require('../models/Story');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const runJanitor = async () => {
  console.log('🧹 Janitor: Starting cleanup of orphaned files...');
  
  try {
    if (!fs.existsSync(UPLOADS_DIR)) return;

    const files = fs.readdirSync(UPLOADS_DIR);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // 1. Get all filenames currently in use in DB
    // (This is an expensive operation, so run it at low-traffic times, e.g. 4 AM)
    const posts = await Post.find({}, 'images videos');
    const users = await User.find({}, 'avatar coverPhoto');
    const stories = await Story.find({}, 'media');

    const usedFiles = new Set();

    posts.forEach(p => {
        (p.images || []).forEach(url => usedFiles.add(path.basename(url)));
        (p.videos || []).forEach(url => usedFiles.add(path.basename(url)));
    });
    users.forEach(u => {
        if(u.avatar) usedFiles.add(path.basename(u.avatar));
        if(u.coverPhoto) usedFiles.add(path.basename(u.coverPhoto));
    });
    stories.forEach(s => {
        if(s.media) usedFiles.add(path.basename(s.media));
    });

    // 2. Iterate disk files
    let deletedCount = 0;
    files.forEach(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        
        // If file is older than 24 hours AND not in DB -> Delete
        if ((now - stats.mtimeMs > ONE_DAY) && !usedFiles.has(file)) {
            fs.unlinkSync(filePath);
            deletedCount++;
        }
    });

    console.log(`🧹 Janitor: Cleanup complete. Deleted ${deletedCount} orphaned files.`);

  } catch (err) {
    console.error('Janitor failed:', err);
  }
};

module.exports = runJanitor;