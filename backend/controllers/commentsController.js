// backend/controllers/commentsController.js
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");

/**
 * POST /api/comments/:postId
 * Creates a comment and emits 'comment:created' to the post room.
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

    // Emit real-time event to post room and notify post owner
    try {
      const io = req.app.get("io") || global.io;
      if (io) {
        io.to(`post:${post._id}`).emit("comment:created", comment);
        // also send a notification event to post owner socket (if needed)
        if (String(post.user) !== String(req.user._id)) {
          io.emit("notify:user", {
            userId: post.user,
            payload: {
              type: "comment",
              data: { commentId: comment._id, postId: post._id, from: { _id: req.user._id, name: req.user.name } },
            },
          });
        }
      }
    } catch (e) {
      console.warn("Could not emit socket comment:created", e && e.message ? e.message : e);
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
