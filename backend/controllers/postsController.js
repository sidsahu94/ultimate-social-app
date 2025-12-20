// backend/controllers/postsController.js
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const cloudinaryUtil = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

/* ------------------ Helpers ------------------ */
const safeUploadToCloudinary = async (filePath) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('CLOUDINARY env not configured');
    }
    const res = await cloudinaryUtil.uploads(filePath);
    return { url: res.secure_url };
  } catch (err) {
    const localUrl = `/uploads/${path.basename(filePath)}`;
    console.warn('Cloudinary upload failed, using local file. Error:', err?.message || err);
    return { url: localUrl, error: err };
  }
};

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const parseHashtagsAndMentions = async (text = '') => {
  const hashtags = Array.from(new Set((text.match(/#([a-zA-Z0-9_]+)/g) || []).map(h => h.slice(1).toLowerCase())));
  const mentionsRaw = (text.match(/@([a-zA-Z0-9_.-]+)/g) || []).map(m => m.slice(1).toLowerCase());
  let mentions = [];
  if (mentionsRaw.length) {
    // NOTE: This lookup assumes mention tokens map to emails like <token>@example.com.
    // Adapt this to your username / handle schema if different.
    const mentionedUsers = await User.find({ email: { $in: mentionsRaw.map(name => `${name}@example.com`) } }).select('_id'); 
    mentions = mentionedUsers.map(u => u._id);
  }
  return { hashtags, mentions };
};

/* ------------------ Post CRUD + utilities ------------------ */

exports.createPost = async (req, res) => {
  try {
    const { content = "" } = req.body;
    const images = [];
    const videos = [];

    if (req.files && req.files.length) {
      for (const f of req.files) {
        const result = await safeUploadToCloudinary(f.path);
        if (f.mimetype?.startsWith('image')) images.push(result.url);
        else if (f.mimetype?.startsWith('video')) videos.push(result.url);
        try { fs.unlinkSync(f.path); } catch (e) {}
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
    });

    await post.save();
    await post.populate('user', 'name avatar');
    return res.status(201).json(post);
  } catch (err) {
    console.error('createPost err', err);
    return res.status(500).json({ message: err.message || 'Error creating post' });
  }
};
exports.unfurlLink = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL required' });

    // Fetch the HTML
    const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'SocialAppBot/1.0' }, // Be polite
        timeout: 5000 
    });
    
    const $ = cheerio.load(data);
    
    // Scrape Open Graph (OG) tags standard
    const meta = {
        title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
        description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
        url: url
    };

    res.json(meta);
  } catch (err) {
    // If it fails, just return empty meta, don't crash
    console.error("Unfurl error:", err.message);
    res.json({ title: '', description: '', image: '' }); 
  }
};
exports.getFeed = async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Authentication required' });

    const userId = req.user._id;

    // 1. Get list of people I follow
    const user = await User.findById(userId).select('following');
    const followingIds = (user?.following || []).map(id => new mongoose.Types.ObjectId(id));
    followingIds.push(new mongoose.Types.ObjectId(userId)); // Include self

    const posts = await Post.aggregate([
      // Match posts from following
      { $match: { 
          isArchived: { $ne: true },
          isFlagged: { $ne: true },
          user: { $in: followingIds } 
      }},
      
      // Calculate Score: popularity & recency
      { $addFields: {
          popularityScore: { 
             $add: [
               { $size: { $ifNull: ["$likes", []] } }, 
               { $multiply: [{ $size: { $ifNull: ["$comments", []] } }, 2] } 
             ]
          },
          hoursAgo: {
             $divide: [
               { $subtract: [new Date(), "$createdAt"] },
               1000 * 60 * 60
             ]
          }
      }},
      { $addFields: {
          finalScore: {
             $divide: [
               { $add: ["$popularityScore", 1] }, 
               { $pow: [{ $add: ["$hoursAgo", 2] }, 1.5] }
             ]
          }
      }},
      
      { $sort: { finalScore: -1, createdAt: -1 } },
      { $skip: page * limit },
      { $limit: limit },
      
      // Lookup User details
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: {
          "user.password": 0, "user.email": 0, "popularityScore": 0, "finalScore": 0, "hoursAgo": 0
      }}
    ]);

    return res.json(posts);
  } catch (err) {
    console.error('getFeed err', err);
    return res.status(500).json({ message: 'Feed error', error: err.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const id = req.params.postId || req.params.id;
    if (!id) return res.status(400).json({ message: 'Post id missing' });
    if (!validateObjectId(id)) return res.status(400).json({ message: 'Invalid post id' });

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
    console.error('getPostById err', err);
    return res.status(500).json({ message: 'Error getting post', error: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Post id missing' });
    if (!validateObjectId(id)) return res.status(400).json({ message: 'Invalid post id' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const requesterId = req.user?._id?.toString();
    if (!requesterId) return res.status(401).json({ message: 'Not authenticated' });
    if (post.user.toString() !== requesterId && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not allowed' });

    if (req.body.content !== undefined) {
      post.content = req.body.content;
      const { hashtags, mentions } = await parseHashtagsAndMentions(post.content);
      post.hashtags = hashtags;
      post.mentions = mentions;
    }

    if (req.files?.length) {
      for (const f of req.files) {
        const resUpload = await safeUploadToCloudinary(f.path);
        if (f.mimetype?.startsWith('image')) post.images.push(resUpload.url);
        else if (f.mimetype?.startsWith('video')) post.videos.push(resUpload.url);
        try { fs.unlinkSync(f.path); } catch (e) {}
      }
    }

    post.updatedAt = Date.now();
    await post.save();
    await post.populate('user', 'name avatar');
    return res.json(post);
  } catch (err) {
    console.error('updatePost err', err);
    return res.status(500).json({ message: 'Error updating post', error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Post id missing' });
    if (!validateObjectId(id)) return res.status(400).json({ message: 'Invalid post id' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const requesterId = req.user?._id?.toString();
    if (!requesterId) return res.status(401).json({ message: 'Not authenticated' });

    const ownerId = post.user?.toString() || null;
    if (ownerId !== requesterId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Cleanup comments referenced by the post
    try {
      if (Array.isArray(post.comments) && post.comments.length) {
        await Comment.deleteMany({ _id: { $in: post.comments } });
      }
      // TODO: Remove post references in other collections (saved/bookmarks, notifications, etc.) if applicable
    } catch (cleanupErr) {
      console.warn('Failed to cleanup comments for post', id, cleanupErr?.message || cleanupErr);
    }

    await Post.findByIdAndDelete(id);
    return res.json({ message: 'Post deleted', id });
  } catch (err) {
    console.error('deletePost err', err);
    return res.status(500).json({ message: 'Error deleting post', error: err.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id || req.body.postId;
    if (!postId) return res.status(400).json({ message: 'postId is required' });
    if (!validateObjectId(postId)) return res.status(400).json({ message: 'Invalid post id' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user._id.toString();
    const already = post.likes.map(String).includes(uid);

    if (already) post.likes = post.likes.filter(l => l.toString() !== uid);
    else post.likes.push(req.user._id);

    await post.save();
    await post.populate('user', 'name avatar');
    return res.json({ success: true, likesCount: post.likes.length, liked: !already });
  } catch (err) {
    console.error('likePost err', err);
    return res.status(500).json({ message: 'Error toggling like', error: err.message });
  }
};

exports.reactPost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    const { emoji = '❤️' } = req.body;
    if (!validateObjectId(postId)) return res.status(400).json({ message: 'Invalid post id' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.reactions.push({ user: req.user._id, emoji, createdAt: new Date() });
    await post.save();
    res.json({ ok: true, reactions: post.reactions });
  } catch (err) {
    console.error('reactPost err', err);
    res.status(500).json({ message: 'Error reacting', error: err.message });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const postId = req.params.postId || req.body.postId;
    if (!validateObjectId(postId)) return res.status(400).json({ message: 'Invalid post id' });

    const me = await User.findById(req.user._id);
    const exists = me.bookmarks.map(String).includes(String(postId));
    if (exists) {
      me.bookmarks = me.bookmarks.filter(id => String(id) !== String(postId));
    } else {
      me.bookmarks.push(postId);
    }
    await me.save();
    res.json({ saved: !exists, bookmarksCount: me.bookmarks.length });
  } catch (err) {
    console.error('toggleBookmark err', err);
    res.status(500).json({ message: 'Error toggling bookmark', error: err.message });
  }
};

exports.getBookmarks = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: { path: 'user', select: 'name avatar' }
    });
    res.json(me.bookmarks || []);
  } catch (err) {
    console.error('getBookmarks err', err);
    res.status(500).json({ message: 'Error fetching bookmarks', error: err.message });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!validateObjectId(userId)) return res.status(400).json({ message: 'Invalid user id' });

    const posts = await Post.find({ user: userId, isArchived: { $ne: true }, isFlagged: { $ne: true } })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (err) {
    console.error('getPostsByUser err', err);
    return res.status(500).json({ message: 'Error fetching user posts', error: err.message });
  }
};

exports.trending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, isFlagged: { $ne: true } } },
      { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $limit: 50 }
    ]);
    await Post.populate(posts, { path: 'user', select: 'name avatar' });
    return res.json(posts);
  } catch (err) {
    console.error('trending err', err);
    return res.status(500).json({ message: 'Error fetching trending', error: err.message });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const results = await Post.find({
      $or: [
        { content: { $regex: regex } },
        { hashtags: q.toLowerCase() },
      ],
      isFlagged: { $ne: true }
    })
    .populate('user', 'name avatar')
    .limit(100)
    .sort({ createdAt: -1 });

    return res.json(results);
  } catch (err) {
    console.error('searchPosts err', err);
    return res.status(500).json({ message: 'Error searching posts', error: err.message });
  }
};

exports.schedulePost = async (req, res) => {
  try {
    const { content = "", hashtags = "", scheduledAt } = req.body;
    if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt is required' });

    const when = new Date(scheduledAt);
    if (isNaN(when.getTime())) return res.status(400).json({ message: 'Invalid scheduledAt' });
    if (when.getTime() <= Date.now()) return res.status(400).json({ message: 'scheduledAt must be a future time' });

    const images = [];
    const videos = [];

    if (req.files && req.files.length) {
      for (const f of req.files) {
        const result = await safeUploadToCloudinary(f.path);
        if (f.mimetype && f.mimetype.startsWith('image')) images.push(result.url);
        else if (f.mimetype && f.mimetype.startsWith('video')) videos.push(result.url);
        try { fs.unlinkSync(f.path); } catch (e) {}
      }
    }

    const post = new Post({
      user: req.user._id,
      content,
      images,
      videos,
      hashtags: Array.isArray(hashtags) ? hashtags : (hashtags ? hashtags.split(',').map(h => h.trim()) : []),
      scheduledAt: when,
      status: 'scheduled',
      createdAt: Date.now()
    });

    await post.save();
    await post.populate('user', 'name avatar');

    // Return scheduled post object
    return res.status(201).json(post);
  } catch (err) {
    console.error('schedulePost err', err);
    return res.status(500).json({ message: 'Error scheduling post', error: err.message });
  }
};

exports.getScheduledPosts = async (req, res) => {
  try {
    const userId = req.query.userId;
    const isAdmin = req.user && req.user.role === 'admin';

    let filter = { status: 'scheduled' };

    if (userId) {
      if (!validateObjectId(userId)) return res.status(400).json({ message: 'Invalid userId' });
      if (!isAdmin && String(req.user._id) !== String(userId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      filter.user = userId;
    } else {
      if (!isAdmin) filter.user = req.user._id;
    }

    const items = await Post.find(filter)
      .populate('user', 'name avatar')
      .sort({ scheduledAt: 1 })
      .limit(200);

    return res.json(items);
  } catch (err) {
    console.error('getScheduledPosts err', err);
    return res.status(500).json({ message: 'Error fetching scheduled posts', error: err.message });
  }
};
