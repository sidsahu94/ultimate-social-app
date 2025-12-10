// backend/routes/search.js
const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const searchController = require('../controllers/searchController');
const Post = require("../models/Post");
const User = require("../models/User");

// --- NEW GLOBAL SEARCH ---
// This will handle: GET /api/search/global?q=...
router.get("/global", searchController.global);

// --- ORIGINAL BASIC SEARCH (fallback) ---
// This will handle: GET /api/search?q=...
router.get("/", protect, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ users: [], posts: [] }); // Return object as expected
  
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  
  try {
    const [users, posts] = await Promise.all([
      User.find({ name: regex }).select("name avatar bio").limit(20),
      Post.find({ content: regex }).populate("user", "name avatar").limit(20),
    ]);
    res.json({ users, posts });
  } catch (err) {
    console.error("Basic search error:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

module.exports = router;