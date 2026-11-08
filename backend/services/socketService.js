const jwt = require('jsonwebtoken');
const cookie = require('cookie'); // Requires: npm install cookie
const User = require('../models/User');
const ActiveCall = require('../models/ActiveCall'); // Required for WebRTC cleanup
const { handleCallSockets } = require('../controllers/callsController');

// Global timeout registry for reconnect grace period
const disconnectTimeouts = new Map();
// Global online users registry (userId -> Set of socketIds)
const activeOnlineUsers = new Map();
// Global audio lounge registry (userId -> { _id, name, avatar, isMuted, socketIds: Set<string> })
const loungeParticipants = new Map();

module.exports = (io) => {
  // =================================================================
  // MIDDLEWARE: Authentication & Session Validation
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
      // Supports both Access Token (handshake.auth) and long-lived Refresh Token (HttpOnly cookie)
      let decoded = null;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || '');
      } catch (err1) {
        try {
          decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || '');
        } catch (err2) {
          return next(new Error('Authentication error: Invalid credentials'));
        }
      }

      // 4. Validate User in DB
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

      // Auto-join personal room for direct emits
      socket.join(socket.userId);

      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid credentials'));
    }
  });

  // =================================================================
  // CONNECTION HANDLER
  // =================================================================
  io.on('connection', async (socket) => {
    const userId = socket.userId;

    // Attach mediasoup/WebRTC call signaling
    handleCallSockets(io, socket);

    // If this user reconnected during the grace period, cancel pending cleanup
    if (disconnectTimeouts.has(userId)) {
      clearTimeout(disconnectTimeouts.get(userId));
      disconnectTimeouts.delete(userId);
      console.log(`[WebRTC] Host ${userId} reconnected. Pending room cleanup canceled.`);
    }

    // ===========================
    // PRESENCE TRACKING
    // ===========================
    let userSockets = activeOnlineUsers.get(userId);
    const isFirstSocket = !userSockets || userSockets.size === 0;
    if (!userSockets) {
      userSockets = new Set();
      activeOnlineUsers.set(userId, userSockets);
    }
    userSockets.add(socket.id);

    // Send current list of online users to the newly connected client
    socket.emit('users:list', Array.from(activeOnlineUsers.keys()));

    // Broadcast user online event if this is their first active session
    if (isFirstSocket) {
      io.emit('user:online', userId);
    }

    // ===========================
    // CHAT EVENTS
    // ===========================

    socket.on('joinRoom', ({ room }) => {
      if (room) {
        socket.join(room);
        socket.to(room).emit('user-joined', { userId: socket.id, user: socket.user });
      }
    });

    socket.on('leaveRoom', ({ room }) => {
      if (room) socket.leave(room);
    });

    socket.on('typing', (data) => {
      if (data.chatId) {
        socket.to(data.chatId).emit('typing', {
          chatId: data.chatId,
          userId: userId,
          name: socket.user.name
        });
      }
    });

    // ===========================
    // WEBRTC CALLING EVENTS
    // ===========================

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

    socket.on('call:signal', ({ to, signal, from }) => {
      io.to(to).emit('call:signal', { signal, from });
    });

    socket.on('call:rejected', ({ roomId }) => {
      socket.to(roomId).emit('call:rejected');
    });

    socket.on('call:ended', ({ roomId }) => {
      io.to(roomId).emit('call:ended');
    });

    // ===========================
    // SOCIALO LIVE AUDIO SPACES EVENTS
    // ===========================
    socket.on('space:join', ({ spaceId, user }) => {
      if (!spaceId) return;
      const room = `space_${spaceId}`;
      socket.join(room);
      io.to(room).emit('space:user-joined', { spaceId, user: user || socket.user });
    });

    socket.on('space:leave', ({ spaceId, userId }) => {
      if (!spaceId) return;
      const room = `space_${spaceId}`;
      socket.leave(room);
      io.to(room).emit('space:user-left', { spaceId, userId: userId || socket.userId });
    });

    socket.on('space:raise-hand', ({ spaceId, user }) => {
      if (!spaceId) return;
      io.to(`space_${spaceId}`).emit('space:hand-raised', { spaceId, user: user || socket.user });
    });

    socket.on('space:promote-speaker', ({ spaceId, targetUserId }) => {
      if (!spaceId) return;
      io.to(`space_${spaceId}`).emit('space:speaker-promoted', { spaceId, targetUserId });
    });

    socket.on('space:speaking', ({ spaceId, userId, audioLevel }) => {
      if (!spaceId) return;
      socket.to(`space_${spaceId}`).emit('space:speaking', { spaceId, userId: userId || socket.userId, audioLevel });
    });

    // ===========================
    // LIVE STREAMING EVENTS
    // ===========================

    socket.on('live:host', ({ roomId }) => {
      socket.join(roomId);
    });

    socket.on('live:viewer', ({ roomId }) => {
      socket.join(roomId);
      socket.to(roomId).emit('live:viewer-joined', socket.id);
    });

    socket.on('live:signal', ({ to, data, roomId }) => {
      io.to(to).emit('live:signal', { data, from: socket.id });
    });

    socket.on('live:return', ({ roomId, data }) => {
      socket.to(roomId).emit('live:return', { data, from: socket.id });
    });

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
    // AUDIO LOUNGE
    // ===========================

    const getLoungeRoster = () => {
      return Array.from(loungeParticipants.values()).map((p) => ({
        _id: p._id,
        name: p.name,
        avatar: p.avatar,
        isMuted: p.isMuted,
      }));
    };

    socket.on('lounge:join', () => {
      socket.join('global-lounge');

      let participant = loungeParticipants.get(userId);
      if (!participant) {
        participant = {
          _id: userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
          isMuted: true,
          socketIds: new Set([socket.id]),
        };
        loungeParticipants.set(userId, participant);
      } else {
        participant.socketIds.add(socket.id);
      }

      const roster = getLoungeRoster();
      io.to('global-lounge').emit('lounge:update', roster);
      io.to('global-lounge').emit('lounge:user_joined', {
        _id: userId,
        name: socket.user.name,
        avatar: socket.user.avatar,
        isMuted: participant.isMuted,
      });
    });

    socket.on('lounge:toggle_mute', ({ isMuted }) => {
      const participant = loungeParticipants.get(userId);
      if (participant) {
        participant.isMuted = !!isMuted;
        const roster = getLoungeRoster();
        io.to('global-lounge').emit('lounge:update', roster);
        io.to('global-lounge').emit('lounge:user_updated', { userId, isMuted: !!isMuted });
      }
    });

    socket.on('lounge:leave', () => {
      socket.leave('global-lounge');
      const participant = loungeParticipants.get(userId);
      if (participant) {
        participant.socketIds.delete(socket.id);
        if (participant.socketIds.size === 0) {
          loungeParticipants.delete(userId);
          const roster = getLoungeRoster();
          io.to('global-lounge').emit('lounge:update', roster);
          io.to('global-lounge').emit('lounge:user_left', userId);
        }
      }
    });

    // ===========================
    // DISCONNECT
    // ===========================
    socket.on('disconnect', () => {
      // Clean up user from activeOnlineUsers registry
      const userSockets = activeOnlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeOnlineUsers.delete(userId);
          io.emit('user:offline', userId);
        }
      }

      // Clean up user from loungeParticipants registry
      const participant = loungeParticipants.get(userId);
      if (participant) {
        participant.socketIds.delete(socket.id);
        if (participant.socketIds.size === 0) {
          loungeParticipants.delete(userId);
          const roster = getLoungeRoster();
          io.to('global-lounge').emit('lounge:update', roster);
          io.to('global-lounge').emit('lounge:user_left', userId);
        }
      }

      // Start grace-period cleanup instead of destroying immediately
      const timeoutId = setTimeout(async () => {
        try {
          const calls = await ActiveCall.find({ host: userId });

          if (calls.length > 0) {
            // Notify participants that the room is closed
            calls.forEach((call) => {
              if (call.roomId) {
                io.to(call.roomId).emit('call:ended', {
                  reason: 'host_disconnected'
                });
              }
            });

            // Remove active call records after notifying clients
            await ActiveCall.deleteMany({ host: userId });

            console.log(`[WebRTC] Host ${userId} dropped. Room destroyed after grace period.`);
          }
        } catch (err) {
          console.error('Error cleaning up WebRTC call:', err);
        }

        // Cleanup timeout registry
        disconnectTimeouts.delete(userId);
      }, 15000); // 15 seconds grace period

      disconnectTimeouts.set(userId, timeoutId);
    });
  });
};