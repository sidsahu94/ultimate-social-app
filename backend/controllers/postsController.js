// backend/controllers/postsController.js
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Saved = require('../models/Saved');
const User = require('../models/User');
const Notification = require('../models/Notification'); // 🔥 Added for cleanup
const { uploads, deleteFile } = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const processMentions = require('../utils/processMentions');
const { addXP } = require('../utils/gamification');

// Helper: Safe Cloudinary Upload
const safeUploadToCloudinary = async (filePath) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('CLOUDINARY env not configured');
    const res = await uploads(filePath);
    try { fs.unlinkSync(filePath); } catch (e) {} // Clean up local file
    return { url: res.secure_url };
  } catch (err) {
    console.error("Cloudinary Upload Error:", err.message);
    const localUrl = `/uploads/${path.basename(filePath)}`;
    return { url: localUrl, error: err };
  }
};

const parseHashtagsAndMentions = async (text = '') => {
  const hashtags = Array.from(new Set((text.match(/#([a-zA-Z0-9_]+)/g) || []).map(h => h.slice(1).toLowerCase())));
  const mentionsRaw = (text.match(/@([a-zA-Z0-9_.-]+)/g) || []).map(m => m.slice(1).toLowerCase());
  let mentions = [];
  
  if (mentionsRaw.length) {
    const mentionedUsers = await User.find({ name: { $in: mentionsRaw } }).select('_id');
    mentions = mentionedUsers.map(u => u._id);
  }
  return { hashtags, mentions };
};

// Helper: Escape Regex for Search Safety
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// --- CRUD Operations ---

exports.createPost = async (req, res) => {
  try {
    const { content = "", isDraft = false } = req.body;
    const images = [];
    const videos = [];

    // Handle File Uploads
    if (req.files && req.files.length) {
      for (const f of req.files) {
        const result = await safeUploadToCloudinary(f.path);
        if (f.mimetype?.startsWith('image')) images.push(result.url);
        else if (f.mimetype?.startsWith('video')) videos.push(result.url);
      }
    }

    const { hashtags, mentions } = await parseHashtagsAndMentions(content);

    const post = new Post({
      user: req.user._id,
      content,
      images,
      videos,
      hashtags,
      mentions,
      isDraft: isDraft === 'true' || isDraft === true,
      score: 0 // Initialize score
    });

    await post.save();
    await post.populate('user', 'name avatar');

    if (!post.isDraft) {
        // Process Notifications
        await processMentions(content, req, post._id);
        
        // Gamification: Award 50 XP
        const io = req.app.get('io');
        addXP(req.user._id, 50, io); 
        
        // Real-time Feed Update
        if (io) io.emit('post:created', post);
    }

    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    console.error('createPost err', err);
    return res.status(500).json({ success: false, message: err.message || 'Error creating post' });
  }
};

// 🔥 OPTIMIZED FEED (Cursor-Based Pagination)
exports.getFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor; // ISO Date string
    const userId = req.user ? req.user._id : null;

    let match = {
      isArchived: { $ne: true },
      isFlagged: { $ne: true },
      isDraft: { $ne: true }
    };

    // Filter blocked users
    if (userId) {
      const user = await User.findById(userId).select('blockedUsers');
      if (user?.blockedUsers?.length) {
        match.user = { $nin: user.blockedUsers };
      }
    }

    // Apply Cursor
    if (cursor) {
      match.createdAt = { $lt: new Date(cursor) };
    }

    // High Performance Query using Partial Index
    const posts = await Post.find(match)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name avatar isVerified badges')
      .populate({ path: 'comments', select: 'text user', options: { limit: 2 } })
      .lean();

    // Add Metadata
    const enrichedPosts = posts.map(p => ({
      ...p,
      isLiked: userId ? (p.likes || []).some(id => String(id) === String(userId)) : false,
      likesCount: (p.likes || []).length,
      commentsCount: (p.comments || []).length
    }));

    // Determine next cursor
    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt : null;

    res.json({
        success: true,
        data: enrichedPosts,
        nextCursor
    });

  } catch (err) {
    console.error('getFeed err', err);
    res.status(500).json({ success: false, message: 'Feed error' });
  }
};

exports.getDrafts = async (req, res) => {
    try {
        const drafts = await Post.find({ user: req.user._id, isDraft: true }).sort({ updatedAt: -1 });
        res.json({ success: true, data: drafts });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error fetching drafts' });
    }
};

exports.viewPost = async (req, res) => {
    try {
        const { id } = req.params;
        // Fire and forget update
        await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });
        res.json({ success: true });
    } catch (e) { 
        res.status(200).json({ success: false }); 
    }
};

exports.getPostById = async (req, res) => {
  try {
    const id = req.params.postId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid post id' });

    const post = await Post.findById(id)
      .populate('user', 'name avatar')
      .populate({ 
          path: 'comments', 
          select: 'text user createdAt', 
          populate: { path: 'user', select: 'name avatar' } 
      });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    return res.json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error getting post' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not allowed' });

    if (req.body.content !== undefined) {
      post.content = req.body.content;
      const { hashtags, mentions } = await parseHashtagsAndMentions(post.content);
      post.hashtags = hashtags;
      post.mentions = mentions;
    }

    // Handle Image Removal
    if (req.body.imagesToRemove) {
        const toRemove = Array.isArray(req.body.imagesToRemove) ? req.body.imagesToRemove : [req.body.imagesToRemove];
        
        for (const url of toRemove) {
            await deleteFile(url);
        }

        post.images = post.images.filter(imgUrl => !toRemove.includes(imgUrl));
    }

    // Handle New Files
    if (req.files?.length) {
      for (const f of req.files) {
        const resUpload = await safeUploadToCloudinary(f.path);
        if (f.mimetype?.startsWith('image')) post.images.push(resUpload.url);
        else if (f.mimetype?.startsWith('video')) post.videos.push(resUpload.url);
      }
    }

    post.updatedAt = Date.now();
    
    // If it was a draft and we are publishing it
    if (req.body.isDraft === 'false' || req.body.isDraft === false) {
        post.isDraft = false;
        post.createdAt = Date.now(); // Reset timestamp to now
    }

    await post.save();
    await post.populate('user', 'name avatar');
    
    return res.json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    // Cleanup Media
    if (post.images && post.images.length > 0) {
        for (const img of post.images) await deleteFile(img);
    }
    if (post.videos && post.videos.length > 0) {
        for (const vid of post.videos) await deleteFile(vid);
    }

    // Cleanup Data Associations
    await Saved.updateMany({ posts: id }, { $pull: { posts: id } });
    await Comment.deleteMany({ _id: { $in: post.comments } });
    
    // 🔥 FIX: Remove associated notifications (Prevent Ghost Notifications)
    await Notification.deleteMany({ 'data.postId': id });

    await Post.findByIdAndDelete(id);
    
    const io = req.app.get('io');
    if (io) io.emit('post:deleted', { id });

    return res.json({ success: true, message: 'Post deleted', id });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting post' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const uid = req.user._id;

    // 1. Determine Action
    const postCheck = await Post.findById(postId).select('likes hashtags');
    if (!postCheck) return res.status(404).json({ success: false, message: 'Post not found' });

    const isLiked = postCheck.likes.includes(uid);

    // 2. 🔥 FIX: Atomic Update with Score Calculation
    // Logic: Trending Score = Likes + (Comments * 2)
    const update = isLiked 
      ? { $pull: { likes: uid }, $inc: { score: -1 } } 
      : { $addToSet: { likes: uid }, $inc: { score: 1 } };

    const post = await Post.findByIdAndUpdate(postId, update, { new: true })
      .populate('user', 'name avatar');
    
    // 3. Update Interest Graph (Background)
    if (!isLiked && postCheck.hashtags && postCheck.hashtags.length > 0) {
        const incUpdate = {};
        postCheck.hashtags.forEach(tag => {
            incUpdate[`interestProfile.${tag}`] = 1; 
        });
        User.findByIdAndUpdate(req.user._id, { $inc: incUpdate }).exec();
    }
    
    // 4. Notify Author (if not self)
    if (!isLiked && String(post.user._id) !== String(uid)) {
        // We import createNotification helper dynamically or reuse logic
        // For simplicity in this monolithic controller, we use the model directly
        // But ideally use utils/notify.js
        const createNotification = require('../utils/notify');
        await createNotification(req, {
            toUser: post.user._id,
            type: 'like',
            data: { postId: post._id },
            message: `${req.user.name} liked your post`
        });
    }

    const io = req.app.get('io');
    if (io) {
        io.emit('post:updated', { _id: post._id, likes: post.likes, score: post.score });
    }
    
    return res.json({ success: true, likesCount: post.likes.length, liked: !isLiked });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error toggling like' });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const postId = req.params.postId || req.body.postId;
    const userId = req.user._id;

    let savedRecord = await Saved.findOne({ user: userId });
    
    if (!savedRecord) {
      savedRecord = new Saved({ user: userId, posts: [] });
    }

    const strPostId = String(postId);
    const existingIndex = savedRecord.posts.findIndex(p => String(p) === strPostId);

    if (existingIndex > -1) {
      savedRecord.posts.splice(existingIndex, 1);
    } else {
      savedRecord.posts.push(postId);
    }

    await savedRecord.save();

    res.json({ success: true, saved: existingIndex === -1, count: savedRecord.posts.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error toggling bookmark' });
  }
};

exports.getBookmarks = async (req, res) => {
  try {
    const savedRecord = await Saved.findOne({ user: req.user._id }).populate({
        path: 'posts',
        populate: { path: 'user', select: 'name avatar' }
    });
    const validPosts = (savedRecord?.posts || []).filter(p => p !== null);
    res.json({ success: true, data: validPosts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching bookmarks' });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page || 0);
    const limit = parseInt(req.query.limit || 20);

    const targetUser = await User.findById(userId).select('privateProfile followers');
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    let canView = true;
    const requesterId = req.user ? String(req.user._id) : null;
    
    // Privacy Check
    if (requesterId !== String(targetUser._id) && targetUser.privateProfile) {
        const isFollower = requesterId && targetUser.followers.includes(requesterId);
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isFollower && !isAdmin) canView = false;
    }

    if (!canView) return res.status(403).json({ success: false, message: 'Private account', isPrivate: true });

    const posts = await Post.find({ 
        user: userId, 
        isArchived: { $ne: true }, 
        isFlagged: { $ne: true },
        isDraft: { $ne: true } 
    })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .populate('user', 'name avatar isVerified');

    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// 🔥 FIX: Optimized Trending Controller
exports.trending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Use simple find + sort by score (indexed) instead of heavy aggregation
    const posts = await Post.find({ 
        createdAt: { $gte: since }, 
        isFlagged: { $ne: true }, 
        isDraft: { $ne: true } 
    })
    .sort({ score: -1 }) // O(1) sort using index
    .limit(50)
    .populate('user', 'name avatar');
    
    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching trending' });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });

    const safeQ = escapeRegex(q);
    const regex = new RegExp(safeQ, 'i');

    const results = await Post.find({
      $or: [ { content: { $regex: regex } }, { hashtags: q.replace('#','').toLowerCase() } ],
      isFlagged: { $ne: true },
      isDraft: { $ne: true }
    })
    .populate('user', 'name avatar')
    .limit(100)
    .sort({ createdAt: -1 });

    return res.json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error searching posts' });
  }
};

exports.schedulePost = async (req, res) => {
  try {
    const { content = "", scheduledAt } = req.body;
    if (!scheduledAt) return res.status(400).json({ success: false, message: 'scheduledAt is required' });

    const when = new Date(scheduledAt);
    if (when.getTime() <= Date.now()) return res.status(400).json({ success: false, message: 'Future time required' });

    const images = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        const result = await safeUploadToCloudinary(f.path);
        images.push(result.url);
      }
    }

    const post = new Post({
      user: req.user._id,
      content,
      images,
      scheduledAt: when,
      status: 'scheduled',
      isDraft: false // Hidden from feed until cron job activates it
    });

    await post.save();
    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error scheduling post' });
  }
};

exports.getScheduledPosts = async (req, res) => {
  try {
    const items = await Post.find({ user: req.user._id, status: 'scheduled' })
      .populate('user', 'name avatar')
      .sort({ scheduledAt: 1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching scheduled posts' });
  }
};

exports.getPostLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('likes', 'name avatar bio role isVerified');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post.likes || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.reactPost = async (req, res) => {
    try {
        // Placeholder for future expanded reaction logic (Like 'Haha', 'Sad')
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: 'Error' }); }
};

exports.unfurlLink = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL required' });
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Bot/1.0' }, timeout: 5000 });
    const $ = cheerio.load(data);
    const meta = {
        title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
        description: $('meta[property="og:description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
        url: url
    };
    res.json(meta);
  } catch (err) {
    res.json({ title: '', description: '', image: '' }); 
  }
};