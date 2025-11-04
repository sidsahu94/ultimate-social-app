// backend/controllers/postsController.js
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const cloudinaryUtil = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

const safeUploadToCloudinary = async (filePath) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('CLOUDINARY env not configured');
    }
    const res = await cloudinaryUtil.uploads(filePath);
    return { url: res.secure_url };
  } catch (err) {
    const localUrl = `/uploads/${path.basename(filePath)}`;
    console.error('Cloudinary upload failed, using local file. Error:', err.message || err);
    return { url: localUrl, error: err };
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content = "", hashtags = "" } = req.body;
    const images = [];
    const videos = [];

    if (req.files && req.files.length) {
      for (const f of req.files) {
        const result = await safeUploadToCloudinary(f.path);
        if (f.mimetype && f.mimetype.startsWith('image')) images.push(result.url);
        else if (f.mimetype && f.mimetype.startsWith('video')) videos.push(result.url);
      }
    }

    const post = new Post({
      user: req.user._id,
      content,
      images,
      videos,
      hashtags: Array.isArray(hashtags) ? hashtags : (hashtags ? hashtags.split(',').map(h => h.trim()) : []),
    });

    await post.save();
    await post.populate('user', 'name avatar');
    res.status(201).json(post);
  } catch (err) {
    console.error('createPost err', err);
    res.status(500).json({ message: err.message || 'Error creating post' });
  }
};

exports.getFeed = async (req, res) => {
  try {
    // pagination
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '20', 10)));

    let filter;
    if (req.user) {
      // personalize: show posts by following + self
      const me = await req.user.populate('following');
      const followingIds = (me.following || []).map(f => f._id);
      filter = { $or: [{ user: { $in: followingIds } }, { user: req.user._id }] };
    } else {
      // anonymous: show recent public posts (non-archived)
      filter = { isArchived: { $ne: true } };
    }

    const posts = await Post.find(filter)
      .populate('user', 'name avatar')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'name avatar' }
      })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);

    res.json(posts);
  } catch (err) {
    console.error('getFeed err', err);
    res.status(500).json({ message: 'Error fetching feed', error: err.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const id = req.params.postId || req.params.id;
    if (!id) return res.status(400).json({ message: 'Post id missing' });
    const post = await Post.findById(id)
      .populate('user', 'name avatar')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'name avatar' }
      });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error('getPostById err', err);
    res.status(500).json({ message: 'Error getting post', error: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not allowed' });

    if (req.body.content !== undefined) post.content = req.body.content;

    if (req.files && req.files.length) {
      for (const f of req.files) {
        const resUpload = await safeUploadToCloudinary(f.path);
        if (f.mimetype && f.mimetype.startsWith('image')) post.images.push(resUpload.url);
        else if (f.mimetype && f.mimetype.startsWith('video')) post.videos.push(resUpload.url);
      }
    }

    post.updatedAt = Date.now();
    await post.save();
    await post.populate('user', 'name avatar');
    res.json(post);
  } catch (err) {
    console.error('updatePost err', err);
    res.status(500).json({ message: 'Error updating post', error: err.message });
  }
};
// backend/controllers/postsController.js
// (replace the existing exports.deletePost implementation with this)

exports.deletePost = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Post id missing' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Authorization: only owner or admin can delete
    const requesterId = req.user && req.user._id ? req.user._id.toString() : null;
    if (!requesterId) return res.status(401).json({ message: 'Not authenticated' });

    const ownerId = (post.user && post.user.toString()) || null;
    if (ownerId !== requesterId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Optional: remove related comments (safe cleanup)
    try {
      if (Array.isArray(post.comments) && post.comments.length) {
        await Comment.deleteMany({ _id: { $in: post.comments } });
      }
    } catch (cleanupErr) {
      // don't block deleting post if comment cleanup fails — log it
      console.warn('Failed to cleanup comments for post', id, cleanupErr);
    }

    // Delete the post document
    await Post.findByIdAndDelete(id);

    // Optionally: notify listeners / remove notifications — implement if you use Notification model
    // await Notification.deleteMany({ link: new RegExp(id) }).catch(()=>{});

    res.json({ message: 'Post deleted', id });
  } catch (err) {
    // improved logging for debugging
    console.error('deletePost err', err);
    // send error message to client (avoid sending stack in production)
    return res.status(500).json({ message: 'Error deleting post', error: err.message });
  }
};


exports.likePost = async (req, res) => {
  try {
    // accept multiple param names to avoid route mismatch bugs
    const postId = req.params.postId || req.params.id || req.body.postId;
    if (!postId) {
      return res.status(400).json({ message: 'postId is required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user._id.toString();
    const alreadyIndex = post.likes.map(String).indexOf(uid);

    if (alreadyIndex !== -1) {
      // remove like
      post.likes = post.likes.filter(l => l.toString() !== uid);
    } else {
      // add like — ensure uniqueness server-side
      if (!post.likes.map(String).includes(uid)) {
        post.likes.push(req.user._id);
      }
    }

    await post.save();
    await post.populate('user', 'name avatar');
    res.json({ success: true, likesCount: post.likes.length, liked: alreadyIndex === -1 });
  } catch (err) {
    console.error('likePost err', err);
    res.status(500).json({ message: 'Error toggling like', error: err.message });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('getPostsByUser err', err);
    res.status(500).json({ message: 'Error fetching user posts', error: err.message });
  }
};

exports.trending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const posts = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $limit: 50 }
    ]);
    // populate user manually after aggregation:
    await Post.populate(posts, { path: 'user', select: 'name avatar' });
    if (!posts.length) {
      const all = await Post.aggregate([
        { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
        { $sort: { likesCount: -1 } },
        { $limit: 50 }
      ]);
      await Post.populate(all, { path: 'user', select: 'name avatar' });
      return res.json(all);
    }
    res.json(posts);
  } catch (err) {
    console.error('trending err', err);
    res.status(500).json({ message: 'Error fetching trending', error: err.message });
  }
};
