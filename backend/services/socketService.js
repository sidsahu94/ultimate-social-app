// backend/services/socketService.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory stores (Note: In a multi-server setup, use Redis)
const userSockets = new Map();       // userId -> socketId
const onlineUsers = new Set();       // Set of userIds
const activeLoungeUsers = new Map(); // userId -> { name, avatar, muteState }

module.exports = (io) => {
  // --- MIDDLEWARE: AUTHENTICATION ---
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Unauthorized: No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name avatar role isDeleted');

      if (!user || user.isDeleted) return next(new Error('Unauthorized: User invalid'));

      // Attach user info to socket session
      socket.user = user;
      socket.userId = user._id.toString();
      
      // Auto-join personal room for notifications/1:1 messages
      socket.join(socket.userId); 

      next();
    } catch (err) {
      // console.error("Socket Auth Error:", err.message);
      next(new Error('Unauthorized: Invalid token'));
    }
  });

  // --- CONNECTION HANDLER ---
  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    // 1. User Online Status
    userSockets.set(userId, socket.id);
    onlineUsers.add(userId);
    
    // Broadcast online status to everyone (or friends only in optimized version)
    io.emit('user:online', userId);
    
    // Send current online list to the connecting user
    socket.emit('users:list', Array.from(onlineUsers));

    // --- CHAT ROOMS ---
    socket.on('joinRoom', ({ room }) => { if (room) socket.join(room); });
    socket.on('leaveRoom', ({ room }) => { if (room) socket.leave(room); });
    
    // Typing Indicator (Secure Injection of Sender ID)
    socket.on('typing', (data) => {
      if (data.chatId) {
          // Send to everyone in room EXCEPT sender
          socket.to(data.chatId).emit('typing', { 
              chatId: data.chatId, 
              userId: userId // Injected from session
          });
      }
    });

    // --- VIDEO CALLS (1:1 WebRTC) ---
    socket.on('call:start', ({ toUserId, roomId, callerName, callerAvatar }) => {
      // Notify the recipient
      io.to(toUserId).emit('call:incoming', { 
        roomId, 
        from: { _id: userId, name: callerName, avatar: callerAvatar } 
      });
    });

    socket.on('call:signal', ({ to, signal, from }) => {
      // Route WebRTC signal (SDP/Candidate) to specific socket/room
      io.to(to).emit('call:signal', { signal, from });
    });

    socket.on('call:rejected', ({ roomId }) => {
      socket.to(roomId).emit('call:rejected');
      socket.to(roomId).emit('call:ended'); // Clean up room state
    });

    socket.on('call:ended', ({ roomId }) => {
      socket.to(roomId).emit('call:ended');
    });

    // --- AUDIO LOUNGE (Clubhouse Style) ---
    socket.on('lounge:join', () => {
      socket.join('global-lounge');
      activeLoungeUsers.set(userId, {
        _id: userId,
        name: socket.user.name,
        avatar: socket.user.avatar,
        isMuted: true,
        isSpeaking: false
      });
      // Broadcast full list to everyone in lounge
      io.to('global-lounge').emit('lounge:update', Array.from(activeLoungeUsers.values()));
    });

    socket.on('lounge:leave', () => {
      socket.leave('global-lounge');
      activeLoungeUsers.delete(userId);
      io.to('global-lounge').emit('lounge:update', Array.from(activeLoungeUsers.values()));
    });

    socket.on('lounge:toggle_mute', ({ isMuted }) => {
      if (activeLoungeUsers.has(userId)) {
        const u = activeLoungeUsers.get(userId);
        u.isMuted = isMuted;
        u.isSpeaking = !isMuted; // Simple logic: if unmuted, assume speaking
        activeLoungeUsers.set(userId, u);
        io.to('global-lounge').emit('lounge:update', Array.from(activeLoungeUsers.values()));
      }
    });

    // --- LIVE STREAMING (One-to-Many) ---
    // Host starts stream
    socket.on('live:host', ({ roomId }) => { 
        socket.join(roomId); 
        console.log(`Live stream host joined: ${roomId}`);
    });

    // Viewer joins stream
    socket.on('live:viewer', ({ roomId }) => { 
        socket.join(roomId);
        // Notify the host (and others) that a viewer is here
        // Ideally, 'live:viewer-request' triggers the host to initiate a WebRTC offer
        socket.to(roomId).emit('live:viewer-request', socket.id);
    });

    // Signaling for Live Stream
    socket.on('live:signal', ({ to, data, roomId }) => {
        io.to(to).emit('live:signal', { data, from: socket.id });
    });

    socket.on('live:return', ({ roomId, data }) => {
        // Send answer back to host
        // Note: In a mesh network, we might broadcast. 
        // Here we assume 'from' was passed in previous signal or we broadcast to room host logic.
        socket.to(roomId).emit('live:return', { data, from: socket.id });
    });
    
    // Live Comments
    socket.on('live:comment', (payload) => {
        io.to(payload.roomId).emit('live:comment', payload);
    });
    
    // Live Reactions (Hearts)
    socket.on('live:reaction', (payload) => {
        io.to(payload.roomId).emit('live:reaction', payload);
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      // 1. Remove from Online List
      userSockets.delete(userId);
      onlineUsers.delete(userId);
      io.emit('user:offline', userId);

      // 2. Remove from Audio Lounge
      if (activeLoungeUsers.has(userId)) {
        activeLoungeUsers.delete(userId);
        io.to('global-lounge').emit('lounge:update', Array.from(activeLoungeUsers.values()));
      }
      
      // 3. (Optional) Notify active call/stream rooms if needed
    });
  });
};