// backend/controllers/callsController.js

// ⚠️ NOTE: In a production environment with multiple server instances (clustering),
// in-memory storage (Map) will not work. You should replace this with Redis.
// For a single-instance deployment, this Map + Cleanup logic is sufficient.

const calls = new Map();

// 🔥 CLEANUP: Run every hour to remove stale rooms older than 24 hours
setInterval(() => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  for (const [roomId, data] of calls.entries()) {
    if (now - data.createdAt > ONE_DAY) {
      calls.delete(roomId);
    }
  }
}, 60 * 60 * 1000); // 1 Hour Interval

exports.createRoom = async (req, res) => {
  try {
    // Generate a unique room ID (simple random string)
    const roomId = (Math.random() * 1e9 | 0).toString(36) + Date.now().toString(36);
    
    calls.set(roomId, {
      peers: [],
      createdAt: Date.now() // Track creation time for cleanup
    });

    res.json({ roomId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!calls.has(roomId)) {
      return res.status(404).json({ message: 'Room not found or expired' });
    }

    const room = calls.get(roomId);
    const userId = req.user._id.toString();

    // Prevent duplicates in peer list
    if (!room.peers.includes(userId)) {
      room.peers.push(userId);
    }

    res.json({ joined: true, roomId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};