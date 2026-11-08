// backend/controllers/commentsController.js
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const createNotification = require('../utils/notify'); 

const mongoose = require('mongoose');

/**
 * POST /api/comments/:postId
 * Creates a comment, updates the post counters atomically, emits socket event, and notifies the author.
 */
exports.create = async (req, res) => {
  try {
    const { text, audio } = req.body; // Supports voice comments (audio URL)
    
    // Validation: Must have text OR audio
    if (!text?.trim() && !audio) {
        return res.status(400).json({ message: "Comment cannot be empty" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
        return res.status(400).json({ message: "Invalid post or content ID" });
    }

    let post = await Post.findById(req.params.postId);
    let isReel = false;
    if (!post) {
      const Reel = require('../models/Reel');
      post = await Reel.findById(req.params.postId);
      isReel = true;
    }

    if (!post) return res.status(404).json({ message: "Post or Reel not found" });

    // 1. Create Comment (Standalone Document)
    // We do NOT push this ID into the Post document array to ensure scalability.
    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      text: text?.trim(),
      audio
    });

    // 2. 🔥 Scalable: Increment Count Only (Atomic Operation)
    if (!isReel) {
      await Post.findByIdAndUpdate(post._id, { 
          $inc: { commentsCount: 1, score: 2 } 
      });
    }

    // Populate user details for the frontend
    await comment.populate("user", "name avatar");

    // 3. Real-time Event
    const io = req.app.get("io");
    if (io) {
        io.to(`post:${post._id}`).emit("comment:created", comment);
    }

    // 4. Notify Author (if not self)
    if (String(post.user) !== String(req.user._id)) {
      await createNotification(req, {
        toUser: post.user,
        type: 'comment',
        data: { postId: post._id, commentId: comment._id },
        message: `${req.user.name} commented on your post`
      });
    }

    res.status(201).json(comment);
  } catch (e) {
    console.error("Create comment error:", e);
    res.status(500).json({ message: "Error adding comment" });
  }
};

/**
 * GET /api/comments/:postId
 * Fetches comments using cursor pagination.
 */
exports.listAll = async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
        return res.json({ success: true, data: [], nextCursor: null });
      }

      const limit = parseInt(req.query.limit) || 20;
      const page = parseInt(req.query.page) || 0;
      const cursor = req.query.cursor;
      const query = { post: req.params.postId };

      // Cursor Pagination
      if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
      }

      const comments = await Comment.find(query)
          .sort({ createdAt: -1 })
          .skip(cursor ? 0 : page * limit)
          .limit(limit)
          .populate('user', 'name avatar');

      const nextCursor = comments.length > 0
          ? comments[comments.length - 1].createdAt
          : null;

      res.json({
        success: true,
        data: comments.reverse(),
        nextCursor
      });
    } catch (e) {
      console.error('List comments error:', e);
      res.status(500).json({ message: 'Error fetching comments' });
    }
};

/**
 * DELETE /api/comments/:commentId
 * Deletes a comment and atomically decrements the post counters.
 */
exports.remove = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Authorization: Only the author or an admin can delete
    if (String(comment.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await comment.deleteOne();
    
    // 🔥 Scalable: Decrement Count Atomically
    await Post.findByIdAndUpdate(comment.post, { 
        $inc: { commentsCount: -1, score: -2 }
    });

    // Notify clients to remove the comment from UI
    const io = req.app.get("io");
    if (io) {
        io.to(`post:${comment.post}`).emit("comment:deleted", { commentId: comment._id });
    }

    res.json({ message: "Deleted" });
  } catch (e) {
    console.error("Delete comment error:", e);
    res.status(500).json({ message: "Error deleting comment" });
  }
};

/**
 * POST /api/comments/like/:commentId
 * Toggle like on a comment.
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

    res.json({ liked: !isLiked, likesCount: updatedComment.likes.length });
  } catch (e) {
    console.error("Toggle like error:", e);
    res.status(500).json({ message: "Error toggling like" });
  }
};