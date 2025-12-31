// backend/controllers/commentsController.js
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const createNotification = require('../utils/notify'); // 🔥 WIRED: Notification Helper

/**
 * POST /api/comments/:postId
 * Creates a comment, emits 'comment:created' to the post room, and notifies owner.
 */
exports.create = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text required" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      text: text.trim(),
    });

    post.comments.push(comment._id);
    await post.save();

    await comment.populate("user", "name avatar");

    // 1. Emit real-time event to post room (for CommentsModal)
    try {
      const io = req.app.get("io") || global.io;
      if (io) {
        io.to(`post:${post._id}`).emit("comment:created", comment);
      }
    } catch (e) {
      console.warn("Could not emit socket comment:created", e?.message);
    }

    // 2. 🔥 WIRE UP: Send Notification to Post Owner
    if (String(post.user) !== String(req.user._id)) {
      await createNotification(req, {
        toUser: post.user,
        type: 'comment',
        data: { postId: post._id, commentId: comment._id },
        message: `${req.user.name} commented: "${text.slice(0, 20)}${text.length > 20 ? '...' : ''}"`
      });
    }

    res.status(201).json(comment);
  } catch (e) {
    console.error("create comment err", e);
    res.status(500).json({ message: "Error adding comment" });
  }
};

/**
 * GET /api/comments/:postId
 * List comments for a post
 */
exports.list = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (e) {
    console.error("list comments err", e);
    res.status(500).json({ message: "Error fetching comments" });
  }
};

/**
 * DELETE /api/comments/:commentId
 * Only comment owner or admin can delete. Emits 'comment:deleted'.
 */
exports.remove = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Not found" });

    if (String(comment.user) !== String(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });

    await comment.deleteOne();
    try {
      await Post.updateOne({ _id: comment.post }, { $pull: { comments: comment._id } });
    } catch (e) {
      console.warn("Failed to remove comment reference from post", e);
    }

    // Emit deletion
    try {
      const io = req.app.get("io") || global.io;
      if (io) io.to(`post:${comment.post}`).emit("comment:deleted", { commentId: comment._id });
    } catch (e) {}

    res.json({ message: "Deleted" });
  } catch (e) {
    console.error("remove comment err", e);
    res.status(500).json({ message: "Error deleting comment" });
  }
};

/**
 * POST /api/comments/like/:commentId
 * Toggle like on a comment. Emits 'comment:liked' with updated count.
 */
exports.toggleLike = async (req, res) => {
  try {
    const c = await Comment.findById(req.params.commentId);
    if (!c) return res.status(404).json({ message: "Not found" });

    const uid = req.user._id.toString();
    const idx = c.likes.map(String).indexOf(uid);
    if (idx > -1) c.likes.splice(idx, 1);
    else c.likes.push(req.user._id);
    await c.save();

    // Emit updated like state
    try {
      const io = req.app.get("io") || global.io;
      if (io) io.to(`post:${c.post}`).emit("comment:liked", { commentId: c._id, likesCount: c.likes.length });
    } catch (e) {}

    res.json({ liked: idx === -1, likesCount: c.likes.length });
  } catch (e) {
    console.error("toggleLike err", e);
    res.status(500).json({ message: "Error toggling like" });
  }
};
exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 0);
    const limit = 20;
    
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .populate("user", "name avatar");
      
    res.json(comments);
  } catch (e) {
    res.status(500).json({ message: "Error fetching comments" });
  }
};