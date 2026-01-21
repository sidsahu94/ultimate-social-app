// backend/controllers/followSuggestController.js
const User = require('../models/User');

exports.suggest = async (req, res) => {
  try {
      const meId = req.user._id;
      
      // 1. Get my data safely
      const me = await User.findById(meId).select('following blockedUsers').lean();
      
      // If user deleted or DB corrupted, return empty list instead of crashing
      if (!me) return res.json([]); 

      const following = new Set((me.following || []).map(String));
      const blocked = new Set((me.blockedUsers || []).map(String));
      
      const pool = new Set();

      // 2. Get Popular Users
      const popular = await User.find({ _id: { $ne: meId } }) // Exclude self in DB query
        .sort({ 'followers.length': -1 })
        .limit(50)
        .select('_id followers');

      popular.forEach(u => {
          const uid = String(u._id);
          // Filter: Not already following, Not blocked
          if (!following.has(uid) && !blocked.has(uid)) {
              pool.add(uid);
          }
      });

      // 3. Fetch details
      if (pool.size === 0) return res.json([]); // Return empty array if no candidates

      const candidates = await User.find({ _id: { $in: Array.from(pool) } })
        .select('name avatar followers')
        .limit(20)
        .lean();

      candidates.sort((a,b)=> (b.followers?.length||0) - (a.followers?.length||0));
      
      res.json(candidates);
  } catch (err) {
      console.error('Suggest error:', err);
      // Return empty array on error so frontend .map() doesn't break
      res.status(500).json([]); 
  }
};