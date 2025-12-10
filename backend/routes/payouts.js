const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const User = require("../models/User");

// simple fake payout list
router.get("/", protect, adminOnly, async (req, res) => {
  const creators = await User.find({ role: "creator" }).select("name avatar earnings");
  res.json(creators);
});

router.post("/send/:id", protect, adminOnly, async (req, res) => {
  res.json({ message: `Payout sent to ${req.params.id}` });
});

module.exports = router;
