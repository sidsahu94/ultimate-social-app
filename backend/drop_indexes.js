// backend/drop_indexes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Drop ALL indexes on the 'posts' collection
    try {
        await mongoose.connection.collection('posts').dropIndexes();
        console.log('🔥 Successfully dropped all indexes on "posts" collection.');
    } catch (e) {
        console.log('⚠️ Could not drop indexes (maybe collection is empty?). Skipping.');
    }

    console.log('✅ Done. You can now restart your server.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();