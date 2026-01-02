
// backend/routes/comments.js
const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const comments = require("../controllers/commentsController");

// Create a comment
router.post("/:postId", protect, comments.create);

// ✅ FIX: Use 'listAll' instead of 'list'
// The controller now exports 'listAll', so we must match that name here.
router.get("/:postId", protect, comments.listAll);

// Delete a comment
router.delete("/:commentId", protect, comments.remove);

// Toggle like
router.post("/like/:commentId", protect, comments.toggleLike);

module.exports = router;