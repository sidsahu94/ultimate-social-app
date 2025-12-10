// backend/routes/comments.js
const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const comments = require("../controllers/commentsController");

router.post("/:postId", protect, comments.create);
router.get("/:postId", protect, comments.list);
router.delete("/:commentId", protect, comments.remove);
router.post("/like/:commentId", protect, comments.toggleLike);

module.exports = router;
