// backend/controllers/storiesController.js
const Story = require('../models/Story');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const cloudinaryUtil = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

let createNotification = async () => {};
try {
  createNotification = require('../utils/notify');
} catch (_) {}

// --- UPLOAD STORY ---
exports.createStory = async (req, res) => {
  try {
    let mediaUrl = req.body.media || '';
    let isLocal = false;
    let type = req.body.type || 'image';

    if (req.file) {
      try {
        const uploadResult = await cloudinaryUtil.uploads(req.file.path);
        mediaUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.warn('Cloudinary story upload fallback to local:', uploadErr.message);
        mediaUrl = `/uploads/${path.basename(req.file.path)}`;
        isLocal = true;
      }
      type = req.file.mimetype?.includes('video') ? 'video' : 'image';
    }

    if (!mediaUrl) {
      const caption = req.body.caption || 'Socialo Story';
      const color = req.body.color || '#6558F5';
      const encodedSvg = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0E0508;stop-opacity:1"/><stop offset="50%" style="stop-color:${color};stop-opacity:0.4"/><stop offset="100%" style="stop-color:#1A0B12;stop-opacity:1"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#grad)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F7F7FC" font-size="52" font-family="sans-serif" font-weight="bold">${caption}</text></svg>`
      );
      mediaUrl = `data:image/svg+xml;utf8,${encodedSvg}`;
      type = 'image';
    }

    const story = new Story({
      user: req.user._id,
      media: mediaUrl,
      type,
      caption: req.body.caption || '', 
      color: req.body.color || '#ffffff',
      privacy: req.body.privacy || 'public',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
    });

    await story.save();
    await story.populate('user', 'name avatar username');

    if (!isLocal && req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    res.status(201).json(story);
  } catch (err) {
    console.error('createStory err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GET STORIES FEED ---
exports.getStories = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user._id.toString() : null;

    let followingIds = [];
    if (currentUserId) {
      const me = await User.findById(currentUserId).select('following');
      followingIds = me && Array.isArray(me.following) ? me.following.map(id => id) : [];
    }

    const targetUserIds = currentUserId ? [...followingIds, req.user._id] : [];

    const query = {
      expiresAt: { $gt: new Date() }
    };

    if (currentUserId) {
      query.$or = [
        { user: { $in: targetUserIds } },
        { privacy: 'public' }
      ];
    } else {
      query.privacy = 'public';
    }

    const activeStories = await Story.find(query)
      .populate('user', 'name avatar username')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = activeStories.map(story => {
      const isViewed = currentUserId && story.viewers && story.viewers.some(v => v.toString() === currentUserId);
      return {
        ...story,
        isViewed: !!isViewed,
        viewersCount: Array.isArray(story.viewers) ? story.viewers.length : 0,
        reactionsCount: Array.isArray(story.reactions) ? story.reactions.length : 0
      };
    });


    if (!enriched || enriched.length === 0) {
      const showcaseStories = [
        {
          _id: 'story_demo_1',
          user: { _id: 'demo_user_1', name: 'Elena Rostova', username: 'elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
          media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
          caption: 'Golden hour reflections by the Mediterranean 🌅✨',
          type: 'image',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          privacy: 'close_friends',
          isViewed: false,
          viewersCount: 28,
          reactionsCount: 14
        },
        {
          _id: 'story_demo_2',
          user: { _id: 'demo_user_2', name: 'Marcus Thorne', username: 'marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
          media: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
          caption: 'Midnight neon rehearsal in London ⚡🎧',
          type: 'image',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          privacy: 'public',
          isViewed: false,
          viewersCount: 42,
          reactionsCount: 19
        },
        {
          _id: 'story_demo_3',
          user: { _id: 'demo_user_3', name: 'Aria Chen', username: 'aria', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' },
          media: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
          caption: 'Behind the scenes at Tokyo Cyber Week 🗼🎆',
          type: 'image',
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
          privacy: 'public',
          isViewed: false,
          viewersCount: 65,
          reactionsCount: 31
        }
      ];
      return res.json(showcaseStories);
    }

    res.json(enriched);
  } catch (err) {
    console.error('getStories err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- MARK AS VIEWED ---
exports.markViewed = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findByIdAndUpdate(
      id,
      { $addToSet: { viewers: userId } },
      { new: true }
    );

    res.json({ success: true, viewersCount: story?.viewers?.length || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- REACT TO STORY ---
exports.reactToStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji = '❤️' } = req.body;
    const userId = req.user._id;

    const story = await Story.findById(id).populate('user', 'name avatar');
    if (!story) return res.status(404).json({ message: 'Story not found' });

    story.reactions = story.reactions || [];
    story.reactions.push({ user: userId, emoji, createdAt: new Date() });
    await story.save();

    const authorId = String(story.user?._id || story.user);
    if (authorId !== String(userId)) {
      try {
        await createNotification(req, {
          toUser: authorId,
          type: 'story',
          data: { storyId: id, emoji },
          message: `${req.user.name || 'Someone'} reacted ${emoji} to your story!`,
        });
      } catch (_) {}
    }

    res.json({ success: true, reaction: { user: userId, emoji }, totalReactions: story.reactions.length });
  } catch (err) {
    console.error('reactToStory err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- REPLY TO STORY (DIRECT CHAT INTEGRATION) ---
exports.replyToStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text cannot be empty' });
    }

    const story = await Story.findById(id).populate('user', 'name avatar');
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const authorId = String(story.user?._id || story.user);
    if (authorId === String(userId)) {
      return res.status(400).json({ message: 'Cannot reply to your own story' });
    }

    const memberIds = [String(userId), authorId];
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: memberIds, $size: 2 },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: memberIds,
        isGroup: false,
      });
    }

    const msg = await Message.create({
      chat: chat._id,
      sender: userId,
      content: `Replied to your story: "${text.trim()}"`,
      media: story.media,
      type: 'text',
    });

    await Chat.findByIdAndUpdate(chat._id, { lastMessage: msg._id });

    // Emit live socket event to author
    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(authorId).emit('receiveMessage', {
        chatId: chat._id,
        message: msg,
      });
    }

    try {
      await createNotification(req, {
        toUser: authorId,
        type: 'message',
        data: { chatId: chat._id, storyId: id },
        message: `${req.user.name || 'Someone'} replied to your story: "${text.trim().slice(0, 40)}"`,
      });
    } catch (_) {}

    res.json({ success: true, message: 'Reply sent', data: msg });
  } catch (err) {
    console.error('replyToStory err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GET STORY VIEWERS ---
exports.getViewers = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id).populate('viewers', 'name avatar username');
    if (!story) return res.status(404).json({ message: 'Story not found' });

    res.json({ success: true, viewers: story.viewers || [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- DELETE STORY ---
exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);

    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Story.findByIdAndDelete(id);
    res.json({ success: true, message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
