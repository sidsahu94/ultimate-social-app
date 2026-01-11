const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const compression = require('compression'); 

// --- Security Imports ---
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

// --- Redis Adapter Imports ---
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const { generalLimiter } = require('./middleware/rateLimit'); 
const errorHandler = require('./middleware/errorHandler');    
const AppError = require('./utils/AppError');
const User = require('./models/User');
const runJanitor = require('./utils/janitor');

dotenv.config();

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

// -------------------- 1. DATABASE CONNECTION (Resilient) --------------------
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    // Retry logic for production resilience
    setTimeout(connectDB, 5000);
  }
};
connectDB();

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB Disconnected. Attempting reconnect...');
});

// -------------------- 2. SECURITY & MIDDLEWARE --------------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false 
}));

app.use(mongoSanitize());
app.use(xss());
app.use(compression()); 

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', generalLimiter);
app.use(express.json({ limit: '50kb' })); 
app.use(cookieParser());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Janitor Cleanup (Run every 24h)
setInterval(() => { runJanitor(); }, 24 * 60 * 60 * 1000);

// -------------------- 3. API ROUTES --------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/chat/extras', require('./routes/chatExtras'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/proxy', require('./routes/proxy'));
app.use('/api/report', require('./routes/report'));
app.use('/api/extra', require('./routes/extra'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/apps', require('./routes/apps'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/integrations', require('./routes/integrations'));

// Optional Modules
try { app.use('/api/search', require('./routes/search')); } catch {}
try { app.use('/api/live', require('./routes/live')); } catch {}
try { app.use('/api/social', require('./routes/social')); } catch {}
try { app.use('/api/polls', require('./routes/polls')); } catch {}
try { app.use('/api/shop', require('./routes/shop')); } catch {}
try { app.use('/api/payouts', require('./routes/payouts')); } catch {}
try { app.use('/api/moderation', require('./routes/moderation')); } catch {}
try { app.use('/api/follow-suggest', require('./routes/followSuggest')); } catch {}

// -------------------- 4. SERVE FRONTEND --------------------
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next(); 
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API Running in Development Mode.');
  });
}

// -------------------- 5. ERROR HANDLING --------------------
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

// -------------------- 6. SOCKET.IO SERVER --------------------
const io = socketio(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000, 
});

app.set('io', io);
global.io = io;

// 🔥 REDIS ADAPTER SETUP
// Only run this if a REDIS_URL is provided in .env
if (process.env.REDIS_URL) {
  (async () => {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Redis Adapter Connected');
    } catch (err) {
      console.warn('⚠️ Redis connection failed, falling back to memory adapter.', err.message);
    }
  })();
}

const userSockets = new Map(); 
const onlineUsers = new Set(); 
const activeLoungeUsers = new Map(); 

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized: No token provided'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name avatar role isDeleted');
    
    if (!user || user.isDeleted) return next(new Error('Unauthorized'));

    socket.user = user; 
    socket.handshake.auth.userId = user._id.toString(); 
    socket.join(user._id.toString());

    next();
  } catch (err) {
    next(new Error('Unauthorized: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;

  if (userId) {
    userSockets.set(String(userId), socket.id);
    onlineUsers.add(String(userId));
    io.emit('user:online', userId);
  }

  socket.emit('users:list', Array.from(onlineUsers));

  // --- Rooms ---
  socket.on('joinRoom', ({ room }) => { if (room) socket.join(room); });
  socket.on('leaveRoom', ({ room }) => { if (room) socket.leave(room); });
  socket.on('typing', (data) => { if(data.chatId) socket.to(data.chatId).emit('typing', data); });

  // --- WebRTC ---
  socket.on('call:start', ({ toUserId, roomId, callerName, callerAvatar }) => {
    io.to(String(toUserId)).emit('call:incoming', { roomId, from: { _id: userId, name: callerName, avatar: callerAvatar } });
  });
  socket.on('call:signal', ({ to, signal, from }) => { io.to(to).emit('call:signal', { signal, from }); });
  socket.on('call:rejected', ({ roomId }) => { socket.to(roomId).emit('call:rejected'); socket.to(roomId).emit('call:ended'); });
  socket.on('call:ended', ({ roomId }) => { socket.to(roomId).emit('call:ended'); });

  // --- Night Lounge ---
  socket.on('lounge:join', () => {
      socket.join('global-lounge');
      activeLoungeUsers.set(userId, {
          _id: userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
          isMuted: true,
          isSpeaking: false
      });
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
          u.isSpeaking = !isMuted;
          activeLoungeUsers.set(userId, u);
          io.to('global-lounge').emit('lounge:update', Array.from(activeLoungeUsers.values()));
      }
  });

  socket.on('disconnect', () => {
    if (userId) {
      userSockets.delete(String(userId));
      onlineUsers.delete(String(userId));
      io.emit('user:offline', userId);
      
      if (activeLoungeUsers.has(userId)) {
          activeLoungeUsers.delete(userId);
          io.to('global-lounge').emit('lounge:update', Array.from(activeLoungeUsers.values()));
      }
    }
  });
});

// -------------------- 7. START SERVER (Graceful) --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});