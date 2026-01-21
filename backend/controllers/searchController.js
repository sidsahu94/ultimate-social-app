// backend/controllers/searchController.js
const User = require('../models/User');
const Post = require('../models/Post');

// --- Helper: Sanitize Regex Input to prevent ReDoS Attacks ---
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

exports.global = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    
    // Return empty structure if query is empty
    if (!q) {
        return res.json({ 
            success: true, 
            data: { users: [], posts: [], hashtags: [] } 
        });
    }

    // 🔥 FIX: Sanitize the input before creating the RegExp
    const safeQuery = escapeRegex(q);
    const regex = new RegExp(safeQuery, 'i'); 

    // Run queries in parallel for performance
    const [users, posts] = await Promise.all([
        // 1. Search Users (Name or Email/Handle)
        User.find({
            $or: [
                { name: { $regex: regex } },
                { email: { $regex: regex } } // Or username if you have it
            ],
            isDeleted: { $ne: true },
            userStatus: { $ne: 'Banned' } // Exclude banned users if applicable
        })
        .select('name avatar isVerified bio followers')
        .limit(10),

        // 2. Search Posts (Content or Hashtags)
        Post.find({
            $or: [
                { content: { $regex: regex } },
                { hashtags: safeQuery.toLowerCase() } // Exact match for hashtags is often faster/better
            ],
            isArchived: { $ne: true },
            isFlagged: { $ne: true },
            isDraft: { $ne: true }
        })
        .populate('user', 'name avatar isVerified')
        .sort({ createdAt: -1 }) // Newest first
        .limit(10)
    ]);

    // 3. Extract Hashtags (Simple aggregation from posts or separate collection)
    // This is a simplified extraction from the found posts
    const hashtags = [...new Set(posts.flatMap(p => p.hashtags || []))]
        .filter(tag => tag.includes(safeQuery.toLowerCase()))
        .slice(0, 5);

    res.json({
        success: true,
        data: {
            users,
            posts,
            hashtags
        }
    });

  } catch (err) {
    console.error("Global Search Error:", err);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};