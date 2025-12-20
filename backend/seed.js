// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Load env vars
dotenv.config();

// Import Models
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const GameScore = require('./models/GameScore');
const Event = require('./models/Event');
const Product = require('./models/Product');
const Reel = require('./models/Reel');

// Configuration
const TOTAL_USERS = 20;
const MAX_POSTS_PER_USER = 5;
const MAX_COMMENTS_PER_POST = 5;
const MAX_FOLLOWING = 8; // Max people a user follows

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ DB Connection Error:', err);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  console.log('⚠️  Clearing existing data...');
  // Clear all collections to ensure a clean slate
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
    GameScore.deleteMany({}),
    Event.deleteMany({}),
    Product.deleteMany({}),
    Reel.deleteMany({})
  ]);

  console.log('🌱 Seeding Users...');
  const users = [];
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt); // Default password for all users

  // Create Users
  for (let i = 0; i < TOTAL_USERS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    users.push({
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: hashedPassword,
      avatar: faker.image.avatar(),
      coverPhoto: faker.image.urlPicsumPhotos({ width: 800, height: 300 }),
      bio: faker.person.bio(),
      location: faker.location.city(),
      isVerified: Math.random() > 0.8, // 20% verified
      role: 'user',
      wallet: {
        balance: parseFloat(faker.finance.amount({ min: 10, max: 5000, dec: 2 })),
        totalReceived: 0,
        totalSent: 0
      },
      badges: Math.random() > 0.7 ? ['early-adopter'] : [],
      followers: [],
      following: [],
      geo: {
        type: 'Point',
        coordinates: [faker.location.longitude(), faker.location.latitude()]
      }
    });
  }

  const createdUsers = await User.insertMany(users);
  console.log(`✅ ${createdUsers.length} Users Created`);

  // --- Create Social Graph (Follows) ---
  console.log('🔗 Building Social Graph...');
  for (const user of createdUsers) {
    const followCount = Math.floor(Math.random() * MAX_FOLLOWING);
    // Filter out self
    const potentialFollows = createdUsers.filter(u => u._id.toString() !== user._id.toString());
    
    // Shuffle and pick random users to follow
    const toFollow = potentialFollows.sort(() => 0.5 - Math.random()).slice(0, followCount);
    
    user.following = toFollow.map(u => u._id);
    await user.save();

    // Update the 'followers' array of the target users and create notifications
    for (const target of toFollow) {
      target.followers.push(user._id);
      await target.save();
      
      await Notification.create({
        user: target._id,
        actor: user._id,
        type: 'follow',
        message: `${user.name} started following you.`,
        isRead: Math.random() > 0.5
      });
    }
  }

  // --- Create Posts & Reels ---
  console.log('📝 Creating Content (Posts & Reels)...');
  const allPosts = [];
  
  for (const user of createdUsers) {
    const postCount = Math.floor(Math.random() * MAX_POSTS_PER_USER);
    
    for (let j = 0; j < postCount; j++) {
      const isImage = Math.random() > 0.3; // 70% chance of image post
      
      const post = new Post({
        user: user._id,
        content: faker.lorem.paragraph(),
        // Use Picsum for reliable test images
        images: isImage ? [faker.image.urlPicsumPhotos({ width: 600, height: 600 })] : [],
        hashtags: [faker.word.sample(), 'trending', 'life'],
        likes: [],
        createdAt: faker.date.past()
      });

      // Add Random Likes to Post
      const likeCount = Math.floor(Math.random() * 10);
      const likers = createdUsers
        .filter(u => u._id.toString() !== user._id.toString())
        .sort(() => 0.5 - Math.random())
        .slice(0, likeCount);
      
      post.likes = likers.map(u => u._id);
      await post.save();
      allPosts.push(post);

      // Randomly create a Reel for this user too
      if (Math.random() > 0.8) {
         // Note: We use a static video URL for seeding because generating fake videos is hard
         await Reel.create({
            user: user._id,
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
            caption: `My cool reel! #${faker.word.sample()}`,
            likes: likers.map(u => u._id),
            createdAt: faker.date.recent()
         });
      }
    }
  }

  // --- Create Comments ---
  console.log('💬 Creating Comments...');
  for (const post of allPosts) {
    const commentCount = Math.floor(Math.random() * MAX_COMMENTS_PER_POST);
    
    for (let k = 0; k < commentCount; k++) {
      const commenter = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      const comment = await Comment.create({
        post: post._id,
        user: commenter._id,
        text: faker.lorem.sentence(),
        likes: []
      });

      post.comments.push(comment._id);
      
      // Notify post owner
      if (post.user.toString() !== commenter._id.toString()) {
        await Notification.create({
            user: post.user,
            actor: commenter._id,
            type: 'comment',
            data: { postId: post._id },
            message: `${commenter.name} commented on your post`
        });
      }
    }
    await post.save();
  }

  // --- Create Gamification Scores ---
  console.log('🎮 Creating Game Scores...');
  const games = ['snake', '2048', 'quiz'];
  for (const user of createdUsers) {
    if (Math.random() > 0.5) {
      await GameScore.create({
        user: user._id,
        gameId: games[Math.floor(Math.random() * games.length)],
        score: Math.floor(Math.random() * 2000)
      });
    }
  }

  // --- Create Marketplace Items ---
  console.log('🛍️  Creating Shop Items...');
  for (let m = 0; m < 10; m++) {
    const owner = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    await Product.create({
      owner: owner._id,
      title: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      desc: faker.commerce.productDescription(),
      image: faker.image.urlLoremFlickr({ category: 'tech' }),
      stock: Math.floor(Math.random() * 20)
    });
  }

  // --- Create Events ---
  console.log('📅 Creating Events...');
  for (let e = 0; e < 5; e++) {
    const host = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    await Event.create({
      host: host._id,
      title: `${faker.music.genre()} Night`,
      description: faker.lorem.sentences(2),
      date: faker.date.future(),
      location: faker.location.city(),
      type: 'physical',
      image: faker.image.urlLoremFlickr({ category: 'nightlife' }),
      attendees: []
    });
  }

  console.log('✨ Database Seeded Successfully!');
  console.log('ℹ️  Login with any user using email from DB and password: "password123"');
  process.exit();
};

seedData();