// backend/scripts/migrate_proxy_urls.js
// Usage: node migrate_proxy_urls.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Post = require('../models/Post');

const ALLOWED_HOSTS = ['res.cloudinary.com', 'images.unsplash.com'];

const shouldProxy = (url) => {
  try {
    const u = new URL(url);
    return ALLOWED_HOSTS.some(h => u.host.includes(h));
  } catch (e) {
    return false;
  }
};

const proxify = (url) => `/api/proxy/image?url=${encodeURIComponent(url)}`;

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected');

  const posts = await Post.find({ images: { $exists: true, $ne: [] } });
  let updated = 0;
  for (const p of posts) {
    let changed = false;
    p.images = p.images.map(img => {
      if (shouldProxy(img) && !img.startsWith('/api/proxy/image')) {
        changed = true;
        return proxify(img);
      }
      return img;
    });
    if (changed) {
      await p.save();
      updated++;
    }
  }
  console.log('Updated posts:', updated);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
