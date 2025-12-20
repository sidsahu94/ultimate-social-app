// backend/server.js

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');

// Models
const User = require('./models/User');
const Post = require('./models/Post');

dotenv.config();

const app = express();
const server = http.createServer(app);

// -------------------- CORS --------------------
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const io = socketio(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
});

app.set('io', io);
global.io = io;

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------- DATABASE --------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('✅ MongoDB Connected');

    try {
      await User.syncIndexes();
      await Post.syncIndexes();
      console.log('✅ Indexes Synced');
    } catch (err) {
      console.warn('⚠️ Index sync warning:', err.message);
    }
  })
  .catch((err) => console.error('❌ MongoDB Error:', err));

// -------------------- ROUTES --------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/proxy', require('./routes/proxy'));
app.use('/api/chat/extras', require('./routes/chatExtras'));
app.use('/api/report', require('./routes/report'));
app.use('/api/extra', require('./routes/extra'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/apps', require('./routes/apps'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/tags', require('./routes/tags'));

// Optional Routes (Safe Load)
try { app.use('/api/search', require('./routes/search')); } catch {}
try { app.use('/api/live', require('./routes/live')); } catch {}
try { app.use('/api/social', require('./routes/social')); } catch {}
try { app.use('/api/polls', require('./routes/polls')); } catch {}
try { app.use('/api/shop', require('./routes/shop')); } catch {}
try { app.use('/api/payouts', require('./routes/payouts')); } catch {}
try { app.use('/api/moderation', require('./routes/moderation')); } catch {}
try { app.use('/api/tags', require('./routes/tags')); } catch {}
try { app.use('/api/follow-suggest', require('./routes/followSuggest')); } catch {}

// ==================================================
// 🔥 SOCKET.IO LOGIC (CHAT + WEBRTC)
// ==================================================
const userSockets = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  const { userId } = socket.handshake.auth || {};

  if (userId) {
    userSockets.set(String(userId), socket.id);
    socket.join(String(userId));
    console.log(`🟢 User connected: ${userId}`);
  }

  // Join chat/video room
  socket.on('joinRoom', ({ room }) => {
    if (!room) return;
    socket.join(room);

    // Notify existing users (critical for WebRTC initiator)
    socket.to(room).emit('user-joined', {
      userId: socket.id,
    });
  });

  socket.on('leaveRoom', ({ room }) => {
    if (room) socket.leave(room);
  });

  // Typing indicators
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('typing', data);
  });

  socket.on('stopTyping', (data) => {
    const sock = userSockets.get(String(data.toUserId));
    if (sock) io.to(sock).emit('stopTyping');
  });

  // Chat messages
  socket.on('sendMessage', ({ toUserIds, chatId, message }) => {
    if (!Array.isArray(toUserIds)) return;

    toUserIds.forEach((id) => {
      const sock = userSockets.get(String(id));
      if (sock) {
        io.to(sock).emit('receiveMessage', {
          chatId,
          message,
        });
      }
    });
  });

  // ---------------- WEBRTC SIGNALING ----------------
  // Relays Offer / Answer / ICE Candidates
  socket.on('call:signal', ({ to, signal, from }) => {
    if (!to || !signal) return;
    io.to(to).emit('call:signal', { signal, from });
  });

  socket.on('disconnect', () => {
    if (userId) {
      userSockets.delete(String(userId));
      console.log(`🔴 User disconnected: ${userId}`);
    }
  });
});

// -------------------- PRODUCTION BUILD --------------------
const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');

if (process.env.NODE_ENV === 'production' || fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/socket.io')
    ) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API Running. Start frontend using npm run dev');
  });
}

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
