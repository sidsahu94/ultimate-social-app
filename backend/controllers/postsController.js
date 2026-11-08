// backend/controllers/postsController.js
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Saved = require('../models/Saved');
const User = require('../models/User');
const Notification = require('../models/Notification');

const { uploads, deleteFile } = require('../utils/cloudinary');
const createNotification = require('../utils/notify');

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

const processMentions = require('../utils/processMentions');
const { addXP } = require('../utils/gamification');

// ---------------------------------------------------
// ROBUST CLOUDINARY REGEX HELPER
// ---------------------------------------------------
const extractPublicId = (url) => {
    if (!url) return null;
    const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    return matches ? matches[1] : null;
};

// ---------------------------------------------------
// SAFE CLOUDINARY UPLOAD
// ---------------------------------------------------
const safeUploadToCloudinary = async (filePath) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            throw new Error('CLOUDINARY env not configured');
        }

        const res = await uploads(filePath);

        try {
            fs.unlinkSync(filePath);
        } catch (e) {}

        return { url: res.secure_url };
    } catch (err) {
        console.error('Cloudinary Upload Error:', err.message);
        const localUrl = `/uploads/${path.basename(filePath)}`;
        return { url: localUrl, error: err };
    }
};

// ---------------------------------------------------
// PARSE TAGS + MENTIONS
// ---------------------------------------------------
const parseHashtagsAndMentions = async (text = '') => {
    const hashtags = Array.from(
        new Set((text.match(/#([a-zA-Z0-9_]+)/g) || []).map(h => h.slice(1).toLowerCase()))
    );

    const mentionsRaw = (text.match(/@([a-zA-Z0-9_.-]+)/g) || []).map(m => m.slice(1).toLowerCase());
    let mentions = [];

    if (mentionsRaw.length) {
        const mentionedUsers = await User.find({ username: { $in: mentionsRaw } }).select('_id');
        mentions = mentionedUsers.map(u => u._id);
    }

    return { hashtags, mentions };
};

// ---------------------------------------------------
// ESCAPE REGEX
// ---------------------------------------------------
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// ---------------------------------------------------
// CREATE POST
// ---------------------------------------------------
exports.createPost = async (req, res) => {
    try {
        const { content = "", isDraft = false, isPaywalled = false, unlockPrice = 0 } = req.body;
        const images = [];
        const videos = [];

        if (req.files && req.files.length) {
            for (const f of req.files) {
                const result = await safeUploadToCloudinary(f.path);
                if (f.mimetype?.startsWith('image')) {
                    images.push(result.url);
                } else if (f.mimetype?.startsWith('video')) {
                    videos.push(result.url);
                }
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
            isPaywalled: isPaywalled === 'true' || isPaywalled === true,
            unlockPrice: Math.max(0, parseInt(unlockPrice, 10) || 0),
            unlockedBy: [req.user._id],
            score: 0
        });

        await post.save();
        await post.populate('user', 'name avatar username');

        if (!post.isDraft) {
            await processMentions(content, req, post._id);
            const io = req.app.get('io');
            addXP(req.user._id, 50, io);

            if (io) {
                // 🔥 FIX: Prevent global broadcast leak. Fetch author's followers and target them specifically.
                const authorData = await User.findById(req.user._id).select('followers');
                if (authorData && authorData.followers) {
                    authorData.followers.forEach(followerId => {
                        io.to(followerId.toString()).emit('post:created', post);
                    });
                }
            }
        }

        return res.status(201).json({ success: true, data: post });
    } catch (err) {
        console.error('createPost err', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Error creating post'
        });
    }
};

exports.getFeed = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
        const { cursorDate, cursorId } = req.query;
        const userId = req.user ? req.user._id : null;

        let match = {
            isArchived: { $ne: true },
            isFlagged: { $ne: true },
            isDraft: { $ne: true },
            $or: [
                { group: null },
                { group: { $exists: false } }
            ]
        };

        if (userId) {
            const activeUserContext = await User.findById(userId)
                .select('blockedUsers')
                .lean();

            if (activeUserContext?.blockedUsers?.length) {
                match.user = {
                    $nin: activeUserContext.blockedUsers
                };
            }
        }

        if (cursorDate && cursorId) {
            match.$and = [
                {
                    $or: [
                        { createdAt: { $lt: new Date(cursorDate) } },
                        {
                            createdAt: new Date(cursorDate),
                            _id: { $lt: cursorId }
                        }
                    ]
                }
            ];
        }

        const posts = await Post.find(match)
            .sort({ createdAt: -1, _id: -1 })
            .select(
                'content images videos user createdAt likesCount commentsCount likes hashtags mentions group views metadata'
            )
            .limit(limit)
            .populate(
                'user',
                'name username avatar isVerified badges'
            )
            .lean();

        let savedPostIds = new Set();
        if (userId) {
            const savedRecord = await Saved.findOne({ user: userId }).select('posts').lean();
            if (savedRecord?.posts?.length) {
                savedPostIds = new Set(savedRecord.posts.map(id => String(id)));
            }
        }

        const enrichedPosts = posts.map((p) => ({
            ...p,
            isLiked: userId
                ? (p.likes || []).some(
                      (id) => String(id) === String(userId)
                  )
                : false,
            isSaved: savedPostIds.has(String(p._id)),
            likesCount: p.likesCount || (p.likes || []).length,
            commentsCount: p.commentsCount || 0
        }));

        const lastPost =
            posts.length > 0 ? posts[posts.length - 1] : null;

        res.json({
            success: true,
            data: enrichedPosts,
            nextCursorDate: lastPost
                ? lastPost.createdAt.toISOString()
                : null,
            nextCursorId: lastPost
                ? lastPost._id.toString()
                : null
        });
    } catch (err) {
        console.error('getFeed err', err);
        res.status(500).json({
            success: false,
            message: 'Feed compilation execution cycle failed.'
        });
    }
};

// ---------------------------------------------------
// GET POSTS BY USER (HYBRID PAGINATION SUPPORT)
// ---------------------------------------------------
exports.getPostsByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) || 20;
        const { cursorDate, cursorId } = req.query;

        const targetUser = await User.findById(userId).select('privateProfile followers');
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

        let canView = true;
        const requesterId = req.user ? String(req.user._id) : null;

        // Privacy Check
        if (requesterId !== String(targetUser._id) && targetUser.privateProfile) {
            const isFollower = requesterId && targetUser.followers.includes(requesterId);
            const isAdmin = req.user && req.user.role === 'admin';
            if (!isFollower && !isAdmin) {
                canView = false;
            }
        }

        if (!canView) {
            return res.status(403).json({ success: false, message: 'Private account', isPrivate: true });
        }

        const query = {
            user: userId,
            isArchived: { $ne: true },
            isFlagged: { $ne: true },
            isDraft: { $ne: true }
        };

        // Offset Pagination Support for Profile Pages
        if (!isNaN(page)) {
            // 🔥 FIX: Return totalPosts so the frontend profile stats display accurately
            const totalPosts = await Post.countDocuments(query); 
            const posts = await Post.find(query)
                .sort({ createdAt: -1, _id: -1 })
                .select('content images videos user createdAt likesCount commentsCount likes hashtags mentions views metadata')
                .skip(page * limit)
                .limit(limit)
                .populate('user', 'name username avatar isVerified');
            
            return res.json({ success: true, data: posts, totalPosts });
        }

        // Stable Cursor Pagination Check (Legacy/Feed)
        if (cursorDate && cursorId) {
            query.$or = [
                { createdAt: { $lt: new Date(cursorDate) } },
                { createdAt: new Date(cursorDate), _id: { $lt: cursorId } }
            ];
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .select('content images videos user createdAt likesCount commentsCount likes hashtags mentions views metadata')
            .limit(limit)
            .populate('user', 'name username avatar isVerified');

        const lastPost = posts.length > 0 ? posts[posts.length - 1] : null;

        return res.json({
            success: true,
            data: posts,
            nextCursorDate: lastPost ? lastPost.createdAt.toISOString() : null,
            nextCursorId: lastPost ? lastPost._id.toString() : null
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.searchPosts = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = parseInt(req.query.limit) || 20;
        const { cursorDate, cursorId } = req.query;

        if (!q) return res.json({ success: true, data: [] });

        const safeQ = escapeRegex(q);
        const regex = new RegExp(safeQ, 'i');

        const query = {
            $and: [
                {
                    $or: [
                        { content: { $regex: regex } },
                        { hashtags: q.replace('#', '').toLowerCase() }
                    ]
                },
                { isFlagged: { $ne: true } },
                { isDraft: { $ne: true } }
            ]
        };

        if (cursorDate && cursorId) {
            query.$and.push({
                $or: [
                    { createdAt: { $lt: new Date(cursorDate) } },
                    { createdAt: new Date(cursorDate), _id: { $lt: cursorId } }
                ]
            });
        }

        const results = await Post.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .select('content images videos user createdAt likesCount commentsCount likes hashtags mentions views metadata')
            .limit(limit)
            .populate('user', 'name username avatar');

        const lastPost = results.length > 0 ? results[results.length - 1] : null;

        return res.json({
            success: true,
            data: results,
            nextCursorDate: lastPost ? lastPost.createdAt.toISOString() : null,
            nextCursorId: lastPost ? lastPost._id.toString() : null
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error searching posts' });
    }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id; 
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Delete DB record FIRST
    await post.deleteOne();
    res.json({ success: true, message: "Post deleted successfully" });

    // 🔥 FIX: Ensure we read from post.images and post.videos, not post.media
    const allMedia = [...(post.images || []), ...(post.videos || [])];
    
    if (allMedia.length > 0) {
      const publicIds = allMedia.map(url => extractPublicId(url)).filter(Boolean);
      
      // We rely on the global cloudinary instance (or standard implementation)
      const cloudinary = require('cloudinary').v2; // Ensure required if not globally available
      publicIds.forEach(id => {
        cloudinary.uploader.destroy(id).catch(err => {
          console.error(`Failed to delete Cloudinary asset ${id}:`, err);
        });
      });
    }
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Server error deleting post" });
  }
};

exports.viewPost = async (req, res) => {
    try {
        const postId = req.params.postId || req.params.id;
        await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
        res.status(200).json({ success: true, message: 'View recorded' });
    } catch (error) {
        console.error('Error recording view:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { 
          $pull: { likes: userId },
          $inc: { likesCount: -1 } 
        },
        { new: true }
      );
      return res.json({ success: true, message: "Post unliked", likesCount: updatedPost.likesCount, isLiked: false });
    } else {
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { 
          $addToSet: { likes: userId },
          $inc: { likesCount: 1 } 
        },
        { new: true }
      );
      return res.json({ success: true, message: "Post liked", likesCount: updatedPost.likesCount, isLiked: true });
    }
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ message: "Server error processing like" });
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

exports.getDrafts = async (req, res) => {
  try {
    const drafts = await Post.find({ user: req.user._id, isDraft: true }).sort({ updatedAt: -1 });
    res.json({ success: true, data: drafts });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching drafts' });
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

    if (req.body.imagesToRemove) {
      const toRemove = Array.isArray(req.body.imagesToRemove) ? req.body.imagesToRemove : [req.body.imagesToRemove];
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
    
    if (req.body.isDraft === 'false' || req.body.isDraft === false) {
      post.isDraft = false;
      post.createdAt = Date.now();
    }

    await post.save();
    await post.populate('user', 'name avatar');
    
    return res.json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating post' });
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

exports.trending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let posts = await Post.find({ 
      createdAt: { $gte: since }, 
      isFlagged: { $ne: true }, 
      isDraft: { $ne: true },
      isArchived: { $ne: true }
    })
    .sort({ score: -1, createdAt: -1 })
    .limit(50)
    .populate('user', 'name username avatar isVerified')
    .lean();
    
    if (!posts || posts.length === 0) {
      posts = await Post.find({ 
        isFlagged: { $ne: true }, 
        isDraft: { $ne: true },
        isArchived: { $ne: true }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'name username avatar isVerified')
      .lean();
    }

    
    if (!posts || posts.length === 0) {
      posts = [
        {
          _id: 'post_showcase_1',
          content: 'Elegance is not about being noticed, it is about being remembered. Welcome to Socialo. #Luxury #Obsidian #Minimalism',
          images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop'],
          likesCount: 142,
          commentsCount: 28,
          createdAt: new Date().toISOString(),
          user: { name: 'Elena Rostova', username: 'elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', isVerified: true }
        },
        {
          _id: 'post_showcase_2',
          content: 'Where soundscapes converge with architecture. Testing our high-fidelity WebRTC studio audio. #AudioArt #CyberLuxe #Socialo',
          images: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop'],
          likesCount: 98,
          commentsCount: 17,
          createdAt: new Date().toISOString(),
          user: { name: 'Marcus Thorne', username: 'marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', isVerified: true }
        },
        {
          _id: 'post_showcase_3',
          content: 'Exploring the intersection of decentralized liquidity, digital assets, and high design. #CryptoArt #Fintech #Socialo',
          images: ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop'],
          likesCount: 215,
          commentsCount: 34,
          createdAt: new Date().toISOString(),
          user: { name: 'Dr. Alistair Vance', username: 'alistair', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', isVerified: true }
        }
      ];
    }

    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching trending' });
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
      isDraft: false
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
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error' });
  }
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

exports.aiCompose = async (req, res) => {
  try {
    const { prompt = '', tone = 'obsidian' } = req.body;
    
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `You are an elite creative copywriter for "Socialo", a luxury cinematic social media platform.
Draft a high-engagement post caption in the tone: "${tone}".
Topic/Prompt: "${prompt || 'everyday luxury moments and authentic connections'}".
Format: 1-2 punchy sentences followed by 3 trending hashtags. Do not include quotes or conversational preamble.`
                  }
                ]
              }
            ]
          },
          { timeout: 8000 }
        );
        const generated = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (generated) {
          return res.json({ success: true, caption: generated, tone });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to local generator engine:', geminiErr.message);
      }
    }

    const cleanPrompt = prompt ? prompt.trim() : 'luxury and creator connection';
    const presets = {
      obsidian: [
        `Curating silence in a world full of noise. ${cleanPrompt} speaks for itself. #Obsidian #Socialo #Minimalism`,
        `Shadows reveal what light obscures. Embracing ${cleanPrompt} at midnight. #Cinematic #DarkLuxury #Socialo`,
        `Every detail intentional. ${cleanPrompt} redefined. #ObsidianLife #SocialoMoments #Aesthetic`
      ],
      champagne: [
        `A golden afternoon framed by timeless elegance. Here’s to ${cleanPrompt} and the people who elevate it. #ChampagneHours #Socialo #Editorial`,
        `Soft sunlight, cream linen, and ${cleanPrompt}. Life is best savored slowly. #Timeless #SocialoLuxury #ArtOfLiving`,
        `The subtleties that turn an ordinary moment into art: ${cleanPrompt}. #EditorialVibes #Socialo #GoldenHour`
      ],
      viral: [
        `Stop scrolling. We need to talk about ${cleanPrompt}. Drop your thoughts below! 🔥🚀 #Viral #Socialo #TrendingNow`,
        `POV: You finally unlocked ${cleanPrompt} and everything clicked. Who else relates? 💯✨ #CreatorLife #Socialo #Explore`,
        `Don’t sleep on this. ${cleanPrompt} is changing the entire game. Tag someone who needs to see this! ⚡ #GameChanger #Socialo`
      ],
      visionary: [
        `Building at the intersection of intuition and intelligence. ${cleanPrompt} is just the beginning. #FutureForward #BuildInPublic #Socialo`,
        `The future belongs to creators who craft with intention. Exploring ${cleanPrompt}. #NextGen #TechVision #Socialo`,
        `Redefining digital connection through ${cleanPrompt}. Let’s build what’s next. #Visionary #SocialoNetwork #Innovation`
      ]
    };

    const toneList = presets[tone] || presets.obsidian;
    const caption = toneList[Math.floor(Math.random() * toneList.length)];

    return res.json({
      success: true,
      caption,
      tone,
      safetyScore: 99.4,
    });
  } catch (err) {
    console.error('aiCompose error:', err);
    res.status(500).json({ success: false, message: 'AI composition failed' });
  }
};

// ---------------------------------------------------
// UNLOCK PAYWALLED POST
// ---------------------------------------------------
exports.unlockPost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (!post.isPaywalled) {
            return res.json({ success: true, message: 'Post is not paywalled', data: post });
        }

        if (post.user.toString() === userId.toString()) {
            return res.json({ success: true, message: 'Author already has access', data: post });
        }

        if (post.unlockedBy && post.unlockedBy.some(u => u.toString() === userId.toString())) {
            return res.json({ success: true, message: 'Post already unlocked', data: post });
        }

        const price = post.unlockPrice || 10;
        const buyer = await User.findById(userId);
        if (!buyer || (buyer.wallet?.balance || 0) < price) {
            return res.status(400).json({ success: false, message: 'Insufficient coin balance. Requires ' + price + ' coins.' });
        }

        await User.findByIdAndUpdate(userId, {
            $inc: { 'wallet.balance': -price, 'wallet.totalSent': price }
        });

        await User.findByIdAndUpdate(post.user, {
            $inc: { 'wallet.balance': price, 'wallet.totalReceived': price }
        });

        if (!post.unlockedBy) post.unlockedBy = [];
        post.unlockedBy.push(userId);
        await post.save();

        const Transaction = require('../models/Transaction');
        const txKey = 'postunlock:' + userId + ':' + post._id + ':' + Date.now();
        await Transaction.create([
            {
                user: userId,
                amount: -price,
                type: 'debit',
                description: 'Unlocked exclusive media from post #' + post._id,
                idempotencyKey: txKey
            },
            {
                user: post.user,
                amount: price,
                type: 'credit',
                description: 'Exclusive post unlock reward from @' + buyer.username,
                idempotencyKey: txKey + ':creator'
            }
        ]);

        const io = req.app.get('io');
        if (io) {
            io.to(userId.toString()).emit('wallet:update', { balance: (buyer.wallet?.balance || 0) - price });
            io.to(post.user.toString()).emit('post:unlocked', { postId: post._id, buyer: { id: buyer._id, name: buyer.name } });
        }

        return res.json({ success: true, message: 'Exclusive post unlocked!', data: post });
    } catch (err) {
        console.error('unlockPost error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Unlock failed' });
    }
};
