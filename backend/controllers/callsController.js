// backend/controllers/callsController.js
// Minimal WebRTC signaling endpoints (offer/answer/ice) for simple server relay if needed
const calls = new Map(); // in-memory - for production use redis

exports.createRoom = async (req, res) => {
  try {
    const roomId = (Math.random()*1e9|0).toString(36);
    calls.set(roomId, { peers: [] });
    res.json({ roomId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!calls.has(roomId)) return res.status(404).json({ message: 'Room not found' });
    const room = calls.get(roomId);
    room.peers.push(req.user._id.toString());
    res.json({ joined: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
