// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const GameScore = require('./models/GameScore');
const Event = require('./models/Event');
const Product = require('./models/Product');
const Reel = require('./models/Reel');
const Story = require('./models/Story');
const Space = require('./models/Space');

const CURATED_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80'
];

const CURATED_PHOTOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&auto=format&fit=crop&q=85'
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ DB Connection Error:', err);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  console.log('🧹 Purging outdated collections...');
  try { await Product.collection.drop(); } catch (e) {}

  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
    GameScore.deleteMany({}),
    Event.deleteMany({}),
    Reel.deleteMany({}),
    Story.deleteMany({}),
    Space.deleteMany({})
  ]);

  console.log('👑 Seeding Core Creators & Master Accounts...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const initialUsers = [
    {
      name: 'Alex Rivera',
      username: 'admin',
      email: 'admin@socialapp.com',
      password: hashedPassword,
      avatar: CURATED_AVATARS[0],
      coverPhoto: CURATED_PHOTOS[0],
      bio: 'Creative Director & Founder at Socialo. Designing the future of artistic human connection.',
      location: 'San Francisco, CA',
      isVerified: true,
      role: 'admin',
      wallet: { balance: 8500, totalReceived: 3200, totalSent: 800 },
      badges: ['early-adopter', 'vip', 'creator'],
    },
    {
      name: 'Elena Vance',
      username: 'elena',
      email: 'user@socialapp.com',
      password: hashedPassword,
      avatar: CURATED_AVATARS[1],
      coverPhoto: CURATED_PHOTOS[1],
      bio: 'Digital artist & cinematic photographer. Exploring luxury generative themes.',
      location: 'Tokyo, Japan',
      isVerified: true,
      role: 'user',
      wallet: { balance: 4200, totalReceived: 1200, totalSent: 450 },
      badges: ['early-adopter', 'creator'],
    },
    {
      name: 'Julian Hayes',
      username: 'julian',
      email: 'julian@socialo.design',
      password: hashedPassword,
      avatar: CURATED_AVATARS[2],
      coverPhoto: CURATED_PHOTOS[2],
      bio: 'Architectural photographer. Capturing the interplay of light and brutalist shadow.',
      location: 'Berlin, Germany',
      isVerified: true,
      role: 'user',
      wallet: { balance: 2100, totalReceived: 400, totalSent: 100 },
      badges: ['creator', 'verified'],
    },
    {
      name: 'Seraphina Lin',
      username: 'seraphina',
      email: 'seraphina@socialo.ai',
      password: hashedPassword,
      avatar: CURATED_AVATARS[3],
      coverPhoto: CURATED_PHOTOS[3],
      bio: 'Synthesizing ambient electronica & neural audiovisuals. 🎶',
      location: 'Seoul, South Korea',
      isVerified: true,
      role: 'user',
      wallet: { balance: 6400, totalReceived: 2100, totalSent: 600 },
      badges: ['creator', 'vip'],
    },
    {
      name: 'Marcus Sterling',
      username: 'sterling',
      email: 'marcus@socialo.luxury',
      password: hashedPassword,
      avatar: CURATED_AVATARS[4],
      coverPhoto: CURATED_PHOTOS[4],
      bio: 'Horology, automotive engineering, and timeless minimalism.',
      location: 'London, UK',
      isVerified: true,
      role: 'user',
      wallet: { balance: 12000, totalReceived: 5000, totalSent: 1500 },
      badges: ['vip'],
    }
  ];

  // Generate 10 more users using faker with curated avatars
  for (let i = 0; i < 10; i++) {
    const fName = faker.person.firstName();
    const lName = faker.person.lastName();
    initialUsers.push({
      name: `${fName} ${lName}`,
      username: `${fName.toLowerCase()}${i + 1}`,
      email: faker.internet.email({ firstName: fName, lastName: lName }).toLowerCase(),
      password: hashedPassword,
      avatar: CURATED_AVATARS[(i + 5) % CURATED_AVATARS.length],
      coverPhoto: CURATED_PHOTOS[(i + 3) % CURATED_PHOTOS.length],
      bio: faker.person.bio(),
      location: `${faker.location.city()}, ${faker.location.country()}`,
      isVerified: i % 2 === 0,
      role: 'user',
      wallet: { balance: parseFloat(faker.finance.amount({ min: 500, max: 4000, dec: 2 })), totalReceived: 0, totalSent: 0 },
      badges: ['early-adopter'],
    });
  }

  const createdUsers = await User.insertMany(initialUsers);
  console.log(`✅ ${createdUsers.length} Users Created`);

  // --- Follow Graph ---
  console.log('🔗 Establishing Follow Graph...');
  for (const u of createdUsers) {
    const others = createdUsers.filter(o => String(o._id) !== String(u._id));
    const toFollow = others.sort(() => 0.5 - Math.random()).slice(0, 6);
    u.following = toFollow.map(o => o._id);
    await u.save();

    for (const target of toFollow) {
      if (!target.followers.includes(u._id)) {
        target.followers.push(u._id);
        await target.save();
      }
    }
  }

  // --- Posts & Content ---
  console.log('📸 Publishing Rich Editorial Posts...');
  const postTexts = [
    'Golden hour reflecting through geometric facades. The balance between stillness and human energy is where luxury lives. #Architecture #Cinematic #Socialo',
    'Curating soundscapes for deep work at midnight. What soundtrack fuels your creativity right now? Drop your favorites below! 🎧 #DeepWork #Electronica #SoundDesign',
    'Simplicity is the ultimate sophistication. Finding beauty in clean lines, obsidian textures, and timeless craftsmanship. #ObsidianNoir #Design #Minimalism',
    'Exploring generative neural rendering with WebGL. The speed of real-time shaders in 2026 is truly boundary-breaking. #GenerativeArt #CreativeCoding #TechVision',
    'Midnight in Tokyo. Neon reflections on rain-soaked asphalt. Every alley tells a quiet story. #StreetPhotography #TokyoNoir #Cyberpunk',
    'Just deployed the new decentralized real-time audio lounge. Crystal-clear WebRTC channels with zero latency. Join the space tonight! 🎙️ #AudioSpace #BuildInPublic',
    'A quiet moment in the studio with espresso and analogue sketches. Before code, there must always be vision. #DesignPhilosophy #ArtOfLiving',
    'The elegance of dark mode interfaces when crafted with intention. Contrast, glass specular sheens, and restrained colour accents. #UIUX #AuroraNoir #Masterpiece'
  ];

  const allPosts = [];
  for (let pIdx = 0; pIdx < postTexts.length; pIdx++) {
    const author = createdUsers[pIdx % createdUsers.length];
    const likers = createdUsers.filter(u => String(u._id) !== String(author._id)).slice(0, 4 + (pIdx % 6));

    const post = await Post.create({
      user: author._id,
      content: postTexts[pIdx],
      images: [CURATED_PHOTOS[pIdx % CURATED_PHOTOS.length]],
      hashtags: ['socialo', 'auroranoir', 'luxury', 'creative'],
      likes: likers.map(l => l._id),
      likesCount: likers.length,
      createdAt: new Date(Date.now() - (pIdx * 3.5 * 3600 * 1000))
    });
    allPosts.push(post);
  }

  // Add more spontaneous posts
  for (let i = 0; i < 15; i++) {
    const author = createdUsers[(i + 3) % createdUsers.length];
    const likers = createdUsers.filter(u => String(u._id) !== String(author._id)).slice(0, 3 + (i % 5));
    const post = await Post.create({
      user: author._id,
      content: `${faker.lorem.paragraph()} #Trending #SocialoLife`,
      images: i % 2 === 0 ? [CURATED_PHOTOS[(i + 4) % CURATED_PHOTOS.length]] : [],
      hashtags: ['trending', 'lifestyle', 'community'],
      likes: likers.map(l => l._id),
      likesCount: likers.length,
      createdAt: new Date(Date.now() - (i * 5.2 * 3600 * 1000))
    });
    allPosts.push(post);
  }

  console.log(`✅ ${allPosts.length} Editorial Posts Published`);

  // --- Comments ---
  console.log('💬 Weaving Engaging Conversations & Comments...');
  const commentSamples = [
    'The lighting here is absolutely mesmerizing!',
    'Incredible perspective. What focal length did you shoot this on?',
    'This aesthetic is pure luxury. Well done! ✨',
    'Bookmarking this for creative inspiration tonight.',
    'Couldn’t agree more. Intention over volume every single time.'
  ];

  for (const post of allPosts.slice(0, 12)) {
    const commenters = createdUsers.filter(u => String(u._id) !== String(post.user)).slice(0, 3);
    for (let cIdx = 0; cIdx < commenters.length; cIdx++) {
      const comment = await Comment.create({
        post: post._id,
        user: commenters[cIdx]._id,
        text: commentSamples[(cIdx + post.content.length) % commentSamples.length],
        likes: []
      });
      post.comments = post.comments || [];
      post.comments.push(comment._id);
      post.commentsCount = (post.commentsCount || 0) + 1;
    }
    await post.save();
  }

  // --- Active 24H Stories ---
  console.log('✨ Publishing 24-Hour Stories...');
  for (let sIdx = 0; sIdx < 6; sIdx++) {
    const author = createdUsers[sIdx];
    await Story.create({
      user: author._id,
      media: CURATED_PHOTOS[(sIdx + 2) % CURATED_PHOTOS.length],
      type: 'image',
      privacy: 'public',
      viewers: createdUsers.slice(7, 12).map(u => u._id),
      expiresAt: new Date(Date.now() + 20 * 3600 * 1000)
    });
  }

  // --- Live Audio Spaces ---
  console.log('🎙️ Initializing Live Audio Spaces...');
  await Space.create({
    title: 'Late Night Design & Audio Synthesis 🌙',
    topic: 'Luxury UI & Ambient Sound Design',
    host: createdUsers[0]._id,
    speakers: [createdUsers[0]._id, createdUsers[1]._id, createdUsers[3]._id],
    listeners: [createdUsers[2]._id, createdUsers[4]._id, createdUsers[5]._id],
    isActive: true,
    startedAt: new Date(Date.now() - 45 * 60 * 1000)
  });

  await Space.create({
    title: 'The Future of WebRTC & Edge Infrastructure ⚡',
    topic: 'Engineering & Scalability',
    host: createdUsers[1]._id,
    speakers: [createdUsers[1]._id, createdUsers[2]._id],
    listeners: [createdUsers[4]._id],
    isActive: true,
    startedAt: new Date(Date.now() - 20 * 60 * 1000)
  });

  // --- Reels ---
  console.log('🎬 Uploading High-Energy Reels...');
  const FAST_REEL_CLIPS = [
    { url: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/dog.mp4', caption: 'Kinetic energy in full bloom! 🐕✨ #Joy #Momentum #SocialoCinema' },
    { url: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/sea_turtle.mp4', caption: 'Azure currents & deep tranquility 🌊🐢 #OceanDrift #NatureArt' },
    { url: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/elephants.mp4', caption: 'Serengeti sovereigns under dusk 🐘🌅 #Wildlife #MajesticEarth' },
    { url: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/samples/cld-sample-video.mp4', caption: 'Precision cadence & fluid motion ⚡🏎️ #SpeedCraft #NoirVision' }
  ];
  for (let r = 0; r < FAST_REEL_CLIPS.length; r++) {
    const author = createdUsers[(r + 1) % createdUsers.length];
    await Reel.create({
      user: author._id,
      videoUrl: FAST_REEL_CLIPS[r].url,
      caption: FAST_REEL_CLIPS[r].caption,
      likes: createdUsers.slice(0, 5).map(u => u._id),
      createdAt: new Date(Date.now() - (r * 6 * 3600 * 1000))
    });
  }

  // --- Products in Shop ---
  console.log('💎 Cataloging Luxury Creator Marketplace Products...');
  const products = [
    { title: 'Obsidian Noir Lightroom Presets', price: 29.99, desc: '12 handcrafted cinematic cinema-grade LUTs and RAW camera profiles.', image: CURATED_PHOTOS[0] },
    { title: 'Socialo VIP Founder Badge', price: 99.00, desc: 'Lifetime verified profile badge, golden chat sheen, and exclusive space hosting privileges.', image: CURATED_PHOTOS[1] },
    { title: 'Ambient Modular Sound Pack (24-bit WAV)', price: 45.00, desc: 'Over 150 pristine analog synth pads, sub pulses, and field recordings.', image: CURATED_PHOTOS[3] },
    { title: 'Minimalist Titanium Pen & Journal', price: 120.00, desc: 'Precision machined aerospace-grade titanium pen with Italian leather notebook.', image: CURATED_PHOTOS[4] }
  ];

  for (const prod of products) {
    await Product.create({
      owner: createdUsers[0]._id,
      title: prod.title,
      price: prod.price,
      desc: prod.desc,
      image: prod.image,
      stock: 50,
      tags: ['luxury', 'creator', 'digital']
    });
  }

  // --- Community Events ---
  console.log('🗓️ Scheduling Global Creative Events...');
  await Event.create({
    host: createdUsers[0]._id,
    title: 'Socialo Global Creative Summit 2026',
    description: 'An interactive virtual gathering exploring the nexus of generative AI, WebRTC, and artistic luxury storytelling.',
    date: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    location: 'Metaspace Studio A & Virtual Live Stage',
    type: 'virtual',
    image: CURATED_PHOTOS[5],
    attendees: createdUsers.slice(1, 8).map(u => u._id)
  });

  // --- Gamification Scores ---
  console.log('🕹️ Generating Arcade Leaderboard Scores...');
  const games = ['snake', '2048', 'quiz'];
  for (const u of createdUsers.slice(0, 8)) {
    await GameScore.create({
      user: u._id,
      gameId: games[Math.floor(Math.random() * games.length)],
      score: 1200 + Math.floor(Math.random() * 2500)
    });
  }

  console.log('✨ All Masterpiece Data Successfully Injected into MongoDB Atlas!');
  console.log('================================================================');
  console.log('🔑 Alex Rivera (Admin): admin@socialapp.com / password123');
  console.log('🔑 Elena Vance (User):  user@socialapp.com  / password123');
  console.log('================================================================');
  process.exit(0);
};

seedData().catch(err => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
