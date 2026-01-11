// backend/controllers/postsController.js
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Saved = require('../models/Saved');
const User = require('../models/User');
const { uploads, deleteFile } = require('../utils/cloudinary'); // 🔥 Updated import
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const processMentions = require('../utils/processMentions');
const { addXP } = require('../utils/gamification'); // 🔥 Gamification

// Helper: Safe Cloudinary Upload
const safeUploadToCloudinary = async (filePath) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('CLOUDINARY env not configured');
    const res = await uploads(filePath);
    try { fs.unlinkSync(filePath); } catch (e) {}
    return { url: res.secure_url };
  } catch (err) {
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

// --- CRUD Operations ---

exports.createPost = async (req, res) => {
  try {
    const { content = "", isDraft = false } = req.body;
    const images = [];
    const videos = [];

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
    });

    await post.save();
    await post.populate('user', 'name avatar');
    
    if (!post.isDraft) {
        await processMentions(content, req, post._id);
        
        // 🔥 GAMIFICATION: Award 50 XP
        const io = req.app.get('io');
        addXP(req.user._id, 50, io); 
        
        if (io) io.emit('post:created', post);
    }

    return res.status(201).json(post);
  } catch (err) {
    console.error('createPost err', err);
    return res.status(500).json({ message: err.message || 'Error creating post' });
  }
};

// 🔥 "THE ALGORITHM" FEED
exports.getFeed = async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));
    const userId = req.user ? req.user._id : null;

    // 1. Get User's Top Interests
    let topInterests = [];
    if (userId) {
        const userDoc = await User.findById(userId).select('interestProfile blockedUsers');
        
        if (userDoc?.interestProfile) {
            topInterests = Array.from(userDoc.interestProfile.entries())
                .sort((a, b) => b[1] - a[1]) // Sort by score
                .slice(0, 5) // Top 5 tags
                .map(entry => entry[0]); 
        }
    }

    let matchStage = { 
      isArchived: { $ne: true },
      isFlagged: { $ne: true },
      isDraft: { $ne: true }
    };

    if (userId) {
        const user = await User.findById(userId).select('blockedUsers');
        const blockedIds = (user?.blockedUsers || []).map(id => new mongoose.Types.ObjectId(id));
        matchStage["user"] = { $nin: blockedIds };
    }

    const posts = await Post.aggregate([
      { $match: matchStage },
      
      // 🔥 Calculate Personalization Score
      { $addFields: {
          likesWeight: { $multiply: [{ $size: { $ifNull: ["$likes", []] } }, 2] },
          commentsWeight: { $multiply: [{ $size: { $ifNull: ["$comments", []] } }, 3] },
          
          // Interest Boost: +50 points if tag matches
          interestBoost: {
             $cond: {
                if: { $gt: [ { $size: { $setIntersection: ["$hashtags", topInterests] } }, 0 ] },
                then: 50, 
                else: 0
             }
          },

          // Time Decay (Fresher is better)
          recencyScore: { 
             $divide: [
                { $subtract: [new Date(), "$createdAt"] }, 
                1000 * 60 * 60 
             ]
          }
      }},
      
      { $addFields: {
          finalScore: { 
              $subtract: [
                  { $add: ["$likesWeight", "$commentsWeight", "$interestBoost"] }, 
                  { $multiply: ["$recencyScore", 2] } 
              ]
          }
      }},
      
      { $sort: { finalScore: -1, createdAt: -1 } }, 
      { $skip: page * limit },
      { $limit: limit },
      
      // Lookup User
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      
      // 🔥 Filter Ghost Users (Deleted Accounts)
      { $match: { "userInfo.isDeleted": { $ne: true } } },
      
      { $project: {
          content: 1, images: 1, videos: 1, likes: 1, comments: 1, createdAt: 1, views: 1, poll: 1, hashtags: 1,
          "user._id": "$userInfo._id",
          "user.name": "$userInfo.name",
          "user.avatar": "$userInfo.avatar",
          "user.isVerified": "$userInfo.isVerified",
          "user.badges": "$userInfo.badges"
      }}
    ]);

    return res.json(posts);
  } catch (err) {
    console.error('getFeed err', err);
    return res.status(500).json({ message: 'Feed error', error: err.message });
  }
};

exports.getDrafts = async (req, res) => {
    try {
        const drafts = await Post.find({ user: req.user._id, isDraft: true }).sort({ updatedAt: -1 });
        res.json(drafts);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching drafts' });
    }
};

exports.viewPost = async (req, res) => {
    try {
        const { id } = req.params;
        await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });
        res.json({ success: true });
    } catch (e) { res.status(200).json({ success: false }); }
};

exports.getPostById = async (req, res) => {
  try {
    const id = req.params.postId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid post id' });

    const post = await Post.findById(id)
      .populate('user', 'name avatar')
      .populate({ 
          path: 'comments', 
          select: 'text user createdAt', 
          populate: { path: 'user', select: 'name avatar' } 
      });

    if (!post) return res.status(404).json({ message: 'Post not found' });
    return res.json(post);
  } catch (err) {
    return res.status(500).json({ message: 'Error getting post' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not allowed' });

    if (req.body.content !== undefined) {
      post.content = req.body.content;
      const { hashtags, mentions } = await parseHashtagsAndMentions(post.content);
      post.hashtags = hashtags;
      post.mentions = mentions;
    }

    // Handle Image Removal
    if (req.body.imagesToRemove) {
        const toRemove = Array.isArray(req.body.imagesToRemove) ? req.body.imagesToRemove : [req.body.imagesToRemove];
        
        // 🔥 CLEANUP: Delete from Cloudinary
        for (const url of toRemove) {
            await deleteFile(url);
        }

        post.images = post.images.filter(imgUrl => !toRemove.includes(imgUrl));
    }

    if (req.files?.length) {
      for (const f of req.files) {
        const resUpload = await safeUploadToCloudinary(f.path);
        if (f.mimetype?.startsWith('image')) post.images.push(resUpload.url);
        else if (f.mimetype?.startsWith('video')) post.videos.push(resUpload.url);
      }
    }

    post.updatedAt = Date.now();
    await post.save();
    await post.populate('user', 'name avatar');
    return res.json(post);
  } catch (err) {
    return res.status(500).json({ message: 'Error updating post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // 🔥 CLEANUP: Delete images/videos from Cloudinary
    if (post.images && post.images.length > 0) {
        for (const img of post.images) await deleteFile(img);
    }
    if (post.videos && post.videos.length > 0) {
        for (const vid of post.videos) await deleteFile(vid);
    }

    // Cleanup related data
    await Saved.updateMany({ posts: id }, { $pull: { posts: id } });
    await Comment.deleteMany({ _id: { $in: post.comments } });
    await Post.findByIdAndDelete(id);
    
    const io = req.app.get('io');
    if (io) io.emit('post:deleted', { id });

    return res.json({ message: 'Post deleted', id });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting post' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user._id.toString();
    const already = post.likes.map(String).includes(uid);

    if (already) {
        post.likes = post.likes.filter(l => l.toString() !== uid);
    } else {
        post.likes.push(req.user._id);
        
        // 🔥 UPDATE INTEREST PROFILE
        if (post.hashtags && post.hashtags.length > 0) {
            const incUpdate = {};
            post.hashtags.forEach(tag => {
                incUpdate[`interestProfile.${tag}`] = 1; 
            });
            // Fire and forget
            User.findByIdAndUpdate(req.user._id, { $inc: incUpdate }).exec();
        }
    }

    await post.save();
    
    const io = req.app.get('io');
    if (io) {
        io.emit('post:updated', { _id: post._id, likes: post.likes });
    }
    
    return res.json({ success: true, likesCount: post.likes.length, liked: !already });
  } catch (err) {
    return res.status(500).json({ message: 'Error toggling like' });
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

    res.json({ saved: existingIndex === -1, count: savedRecord.posts.length });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling bookmark' });
  }
};

exports.getBookmarks = async (req, res) => {
  try {
    // 🔥 Added pagination to bookmarks in extraController, this is a fallback for simple fetch
    const savedRecord = await Saved.findOne({ user: req.user._id }).populate({
        path: 'posts',
        populate: { path: 'user', select: 'name avatar' }
    });
    const validPosts = (savedRecord?.posts || []).filter(p => p !== null);
    res.json(validPosts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookmarks' });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page || 0);
    const limit = parseInt(req.query.limit || 20);

    const targetUser = await User.findById(userId).select('privateProfile followers');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    let canView = true;
    const requesterId = req.user ? String(req.user._id) : null;
    
    if (requesterId !== String(targetUser._id) && targetUser.privateProfile) {
        const isFollower = requesterId && targetUser.followers.includes(requesterId);
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isFollower && !isAdmin) canView = false;
    }

    if (!canView) return res.status(403).json({ message: 'Private account', isPrivate: true });

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

    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.trending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, isFlagged: { $ne: true }, isDraft: { $ne: true } } },
      { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $limit: 50 }
    ]);
    await Post.populate(posts, { path: 'user', select: 'name avatar' });
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching trending' });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const results = await Post.find({
      $or: [ { content: { $regex: regex } }, { hashtags: q.toLowerCase() } ],
      isFlagged: { $ne: true },
      isDraft: { $ne: true }
    })
    .populate('user', 'name avatar')
    .limit(100)
    .sort({ createdAt: -1 });

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: 'Error searching posts' });
  }
};

exports.schedulePost = async (req, res) => {
  try {
    const { content = "", scheduledAt } = req.body;
    if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt is required' });

    const when = new Date(scheduledAt);
    if (when.getTime() <= Date.now()) return res.status(400).json({ message: 'Future time required' });

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
      isDraft: false
    });

    await post.save();
    return res.status(201).json(post);
  } catch (err) {
    return res.status(500).json({ message: 'Error scheduling post' });
  }
};

exports.getScheduledPosts = async (req, res) => {
  try {
    const items = await Post.find({ user: req.user._id, status: 'scheduled' })
      .populate('user', 'name avatar')
      .sort({ scheduledAt: 1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching scheduled posts' });
  }
};

exports.getPostLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('likes', 'name avatar bio role isVerified');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post.likes || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reactPost = async (req, res) => {
    try {
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Error' }); }
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