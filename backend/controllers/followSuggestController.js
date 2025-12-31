const User = require('../models/User');

exports.suggest = async (req,res)=>{
  try {
      const meId = req.user._id;
      
      // 1. Get my data: who I follow AND who I block
      const me = await User.findById(meId).select('following blockedUsers').lean();
      
      const following = new Set((me.following || []).map(String));
      const blocked = new Set((me.blockedUsers || []).map(String));
      
      const pool = new Set();

      // 2. Popular users (Simple Heuristic)
      // In production, you might use a graph database or more complex aggregation
      const popular = await User.find()
        .sort({ 'followers.length': -1 })
        .limit(100) // Look at top 100
        .select('_id followers');

      popular.forEach(u => {
          const uid = String(u._id);
          // Filter: Not me, Not already following, Not blocked
          if (uid !== String(meId) && !following.has(uid) && !blocked.has(uid)) {
              pool.add(uid);
          }
      });

      // 3. Fetch details for the candidates
      const candidates = await User.find({ _id: { $in: Array.from(pool) } })
        .select('name avatar followers')
        .limit(20)
        .lean();

      // Sort by popularity (follower count)
      candidates.sort((a,b)=> (b.followers?.length||0) - (a.followers?.length||0));
      
      res.json(candidates);
  } catch (err) {
      console.error('Suggest error:', err);
      res.status(500).json({ message: 'Server error' });
  }
};