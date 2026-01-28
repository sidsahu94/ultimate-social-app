// backend/services/socketService.js
const jwt = require('jsonwebtoken');
const cookie = require('cookie'); // Requires: npm install cookie
const User = require('../models/User');

module.exports = (io) => {
  // =================================================================
  // 🛡️ MIDDLEWARE: Authentication & Session Validation
  // =================================================================
  io.use(async (socket, next) => {
    try {
      let token = null;

      // 1. Priority: Try HttpOnly Cookie (Secure Production Method)
      if (socket.handshake.headers.cookie) {
        const parsedCookies = cookie.parse(socket.handshake.headers.cookie);
        token = parsedCookies.jwt; // Must match cookie name in authController
      }

      // 2. Fallback: Handshake Auth (For Mobile Apps / Dev testing)
      if (!token && socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // 3. Verify Token
      // Uses REFRESH_SECRET because we are using the long-lived cookie for the socket session
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      // 4. Validate User in DB (Prevents banned users from connecting)
      const user = await User.findById(decoded.id).select('_id name avatar role isDeleted');

      if (!user || user.isDeleted) {
        return next(new Error('Authentication error: User not found or deactivated'));
      }

      if (user.role === 'banned') {
        return next(new Error('Authentication error: Account banned'));
      }

      // 5. Attach User Context to Socket
      socket.user = user;
      socket.userId = user._id.toString();

      // 🔥 AUTO-JOIN PERSONAL ROOM
      // This is crucial for Redis scaling. We target users by io.to(userId)
      socket.join(socket.userId);

      next();
    } catch (err) {
      // console.error("Socket Auth Failed:", err.message);
      next(new Error('Authentication error: Invalid credentials'));
    }
  });

  // =================================================================
  // 🔌 CONNECTION HANDLER
  // =================================================================
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    // console.log(`✅ User Connected: ${socket.user.name} (${userId})`);

    // ===========================
    // 💬 CHAT EVENTS
    // ===========================

    // Join/Leave Chat Rooms (Groups or active chat windows)
    socket.on('joinRoom', ({ room }) => {
      if (room) {
        socket.join(room);
        // console.log(`User ${userId} joined room: ${room}`);
      }
    });

    socket.on('leaveRoom', ({ room }) => {
      if (room) socket.leave(room);
    });

    // Typing Indicators
    socket.on('typing', (data) => {
      if (data.chatId) {
        // Broadcast to specific room, excluding sender
        socket.to(data.chatId).emit('typing', {
          chatId: data.chatId,
          userId: userId,
          name: socket.user.name
        });
      }
    });

    // ===========================
    // 📞 WEBRTC CALLING EVENTS
    // ===========================

    // Initiate Call: Send offer to target user's personal room
    socket.on('call:start', ({ toUserId, roomId, callerName, callerAvatar }) => {
      io.to(toUserId).emit('call:incoming', {
        roomId,
        from: {
          _id: userId,
          name: callerName || socket.user.name,
          avatar: callerAvatar || socket.user.avatar
        }
      });
    });

    // Signaling (SDP / ICE Candidates)
    // Routing signals directly via personal rooms ensures they reach the user
    // regardless of which server node they are connected to.
    socket.on('call:signal', ({ to, signal, from }) => {
      io.to(to).emit('call:signal', { signal, from });
    });

    // Reject Call
    socket.on('call:rejected', ({ roomId }) => {
      // Notify callers in that specific call room
      socket.to(roomId).emit('call:rejected');
    });

    // End Call
    socket.on('call:ended', ({ roomId }) => {
      io.to(roomId).emit('call:ended');
      // Forcefully clear the room context if possible, or clients handle cleanup
    });

    // ===========================
    // 🔴 LIVE STREAMING EVENTS
    // ===========================

    socket.on('live:host', ({ roomId }) => {
      socket.join(roomId);
    });

    socket.on('live:viewer', ({ roomId }) => {
      socket.join(roomId);
      // Notify host a viewer joined (Host is in the room)
      socket.to(roomId).emit('live:viewer-joined', socket.id);
    });

    // WebRTC Signaling for Live Stream (One-to-Many)
    socket.on('live:signal', ({ to, data, roomId }) => {
      io.to(to).emit('live:signal', { data, from: socket.id });
    });

    socket.on('live:return', ({ roomId, data }) => {
      // Return answer to the host/sender
      socket.to(roomId).emit('live:return', { data, from: socket.id });
    });

    // Live Interaction (Comments/Hearts)
    socket.on('live:comment', (payload) => {
      io.to(payload.roomId).emit('live:comment', {
        ...payload,
        user: { _id: userId, name: socket.user.name, avatar: socket.user.avatar }
      });
    });

    socket.on('live:reaction', (payload) => {
      io.to(payload.roomId).emit('live:reaction', payload);
    });

    // ===========================
    // 🎧 AUDIO LOUNGE (Clubhouse Style)
    // ===========================
    
    // Note: managing active speakers list in a distributed system requires Redis.
    // For this implementation, we broadcast state changes to the room and let clients build the list.
    
    socket.on('lounge:join', () => {
        socket.join('global-lounge');
        // Announce join
        io.to('global-lounge').emit('lounge:user_joined', {
            _id: userId,
            name: socket.user.name,
            avatar: socket.user.avatar,
            isMuted: true
        });
    });

    socket.on('lounge:toggle_mute', ({ isMuted }) => {
        io.to('global-lounge').emit('lounge:user_updated', { userId, isMuted });
    });

    socket.on('lounge:leave', () => {
        socket.leave('global-lounge');
        io.to('global-lounge').emit('lounge:user_left', userId);
    });

    // ===========================
    // 🔌 DISCONNECT
    // ===========================
    socket.on('disconnect', () => {
      // console.log(`❌ User Disconnected: ${userId}`);
      // Automatic cleanup: Socket.io + Redis Adapter handles leaving rooms
      
      // Notify Lounge if they were there
      io.to('global-lounge').emit('lounge:user_left', userId);
    });
  });
};