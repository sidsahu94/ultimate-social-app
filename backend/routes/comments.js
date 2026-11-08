
// backend/routes/comments.js
const router = require("express").Router();
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const comments = require("../controllers/commentsController");

// Toggle like (MUST be defined before /:postId)
router.post("/like/:commentId", protect, comments.toggleLike);
router.post("/:commentId/like", protect, comments.toggleLike);

// Delete a comment
router.delete("/:commentId", protect, comments.remove);

// Create a comment
router.post("/:postId", protect, comments.create);

// List comments (public with optional auth)
router.get("/:postId", optionalAuth, comments.listAll);

module.exports = router;