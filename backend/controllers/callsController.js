// backend/controllers/callsController.js
const ActiveCall = require('../models/ActiveCall');

// ⚠️ Note: Ensure your ActiveCall model has a TTL index on 'createdAt' 
// to automatically clean up stale calls after 24 hours.

exports.createRoom = async (req, res) => {
  try {
    // Generate a unique room ID
    const roomId = (Math.random() * 1e9 | 0).toString(36) + Date.now().toString(36);
    
    // 🔥 FIX: Persist room to DB instead of memory Map
    // This supports multi-server deployment (clustering)
    await ActiveCall.create({
        roomId,
        host: req.user._id,
        participants: [req.user._id]
    });

    res.json({ roomId });
  } catch (err) {
    console.error("Create Room Error:", err);
    res.status(500).json({ message: 'Error creating room' });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // 🔥 FIX: Check DB for room existence
    const call = await ActiveCall.findOne({ roomId });
    
    if (!call) {
      return res.status(404).json({ message: 'Room not found or expired' });
    }

    // Add user to participants if not present
    // Converting ObjectIds to strings for comparison is safer
    const userIdStr = req.user._id.toString();
    const participantsStr = call.participants.map(p => p.toString());

    if (!participantsStr.includes(userIdStr)) {
        call.participants.push(req.user._id);
        await call.save();
    }

    res.json({ joined: true, roomId });
  } catch (err) {
    console.error("Join Room Error:", err);
    res.status(500).json({ message: 'Error joining room' });
  }
};