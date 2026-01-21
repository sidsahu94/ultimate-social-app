// backend/controllers/commentsController.js
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const createNotification = require('../utils/notify'); 

/**
 * POST /api/comments/:postId
 * Creates a comment, updates the post, emits socket event, and notifies the author.
 */
exports.create = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text required" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Security Check: Blocked User
    const postOwner = await User.findById(post.user).select('blockedUsers');
    if (postOwner.blockedUsers && postOwner.blockedUsers.includes(req.user._id)) {
        return res.status(403).json({ message: "You are unable to comment on this post." });
    }

    const me = await User.findById(req.user._id).select('blockedUsers');
    if (me.blockedUsers && me.blockedUsers.includes(post.user)) {
        return res.status(403).json({ message: "You have blocked this user." });
    }

    // Create Comment
    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      text: text.trim(),
    });

    // 🔥 FIX: Atomic Update & Score Increment
    // Add comment to array AND increment trending score by 2 (Comments worth more than likes)
    await Post.findByIdAndUpdate(post._id, { 
        $push: { comments: comment._id },
        $inc: { score: 2 } 
    });

    await comment.populate("user", "name avatar");

    try {
      const io = req.app.get("io") || global.io;
      if (io) {
        io.to(`post:${post._id}`).emit("comment:created", comment);
      }
    } catch (e) {
      console.warn("Socket emit failed", e?.message);
    }

    // Notify Author (if not self)
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
 * List all comments for a post (Simple)
 */
exports.listAll = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (e) {
    res.status(500).json({ message: "Error fetching comments" });
  }
};

/**
 * GET /api/comments/:postId/paginated
 */
exports.listPaginated = async (req, res) => {
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

/**
 * DELETE /api/comments/:commentId
 */
exports.remove = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Not found" });

    if (String(comment.user) !== String(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });

    await comment.deleteOne();
    
    // Decrement score on delete and remove from array
    await Post.findByIdAndUpdate(comment.post, { 
        $pull: { comments: comment._id },
        $inc: { score: -2 }
    });

    try {
      const io = req.app.get("io") || global.io;
      if (io) io.to(`post:${comment.post}`).emit("comment:deleted", { commentId: comment._id });
    } catch (e) {}

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Error deleting comment" });
  }
};

/**
 * POST /api/comments/like/:commentId
 */
exports.toggleLike = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const uid = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Not found" });

    const isLiked = comment.likes.includes(uid);
    const update = isLiked 
      ? { $pull: { likes: uid } } 
      : { $addToSet: { likes: uid } };

    const updatedComment = await Comment.findByIdAndUpdate(commentId, update, { new: true });

    try {
      const io = req.app.get("io") || global.io;
      if (io) {
        io.to(`post:${updatedComment.post}`).emit("comment:liked", { 
          commentId: updatedComment._id, 
          likesCount: updatedComment.likes.length 
        });
      }
    } catch (e) {}

    res.json({ liked: !isLiked, likesCount: updatedComment.likes.length });
  } catch (e) {
    res.status(500).json({ message: "Error toggling like" });
  }
};