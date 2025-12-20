// backend/routes/tags.js
const express = require('express');
const router = express.Router();
const { suggest } = require('../controllers/tagSuggestionController');
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
 router.post('/suggest', protect, suggest);

// Get popular hashtags matching query
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if(!q) return res.json([]);

        // Aggregation to find tags starting with 'q', count usage, sort by popularity
        const tags = await Post.aggregate([
            { $unwind: "$hashtags" }, // Split array into documents
            { $match: { hashtags: { $regex: `^${q}`, $options: 'i' } } }, // Filter match
            { $group: { _id: "$hashtags", count: { $sum: 1 } } }, // Count occurrences
            { $sort: { count: -1 } }, // Sort popular first
            { $limit: 5 } // Top 5
        ]);

        res.json(tags.map(t => t._id));
    } catch(e) {
        console.error(e);
        res.status(500).json([]);
    }
});

module.exports = router;