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
const jwt = require('jsonwebtoken');

// --- Security Imports ---
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

// --- Utilities ---
const User = require('./models/User');
const Post = require('./models/Post');
const runJanitor = require('./utils/janitor');

dotenv.config();

const app = express();
const server = http.createServer(app);

// -------------------- 1. DATABASE CONNECTION --------------------
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

// -------------------- 2. SECURITY & MIDDLEWARE --------------------

// Content Security Policy (CSP) Configuration
// Allows images/videos from Cloudinary, Unsplash, and Google
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], 
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://*.googleusercontent.com"],
      mediaSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://storage.googleapis.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https://api.cloudinary.com", "https://*.google.com"],
    },
  },
}));

// Prevent NoSQL Injection
app.use(mongoSanitize());

// Prevent XSS Attacks
app.use(xss());

// Rate Limiter for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." }
});
app.use('/api/auth', authLimiter);

// Standard Middleware
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(cookieParser());

// CORS Setup
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Serve Local Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------- 3. JANITOR (Cleanup) --------------------
// Run cleanup every 24 hours (86400000 ms)
setInterval(() => {
    runJanitor();
}, 24 * 60 * 60 * 1000);

// -------------------- 4. API ROUTES --------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/chat/extras', require('./routes/chatExtras'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/conversations', require('./routes/conversations')); // Legacy alias
app.use('/api/proxy', require('./routes/proxy'));
app.use('/api/report', require('./routes/report'));
app.use('/api/extra', require('./routes/extra'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/apps', require('./routes/apps'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/tags', require('./routes/tags'));

// Optional Modules (Safe Load)
try { app.use('/api/search', require('./routes/search')); } catch {}
try { app.use('/api/live', require('./routes/live')); } catch {}
try { app.use('/api/social', require('./routes/social')); } catch {}
try { app.use('/api/polls', require('./routes/polls')); } catch {}
try { app.use('/api/shop', require('./routes/shop')); } catch {}
try { app.use('/api/payouts', require('./routes/payouts')); } catch {}
try { app.use('/api/moderation', require('./routes/moderation')); } catch {}
try { app.use('/api/follow-suggest', require('./routes/followSuggest')); } catch {}

// API 404 Handler (Prevents returning HTML for missing API endpoints)
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API Endpoint Not Found' });
});

// -------------------- 5. SOCKET.IO SERVER --------------------
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

const userSockets = new Map(); // userId -> socketId
const onlineUsers = new Set(); // userId

// --- Socket Security Middleware ---
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name role');
    
    if (!user) return next(new Error("Authentication error: User not found"));

    // Securely attach user to socket
    socket.user = user; 
    socket.handshake.auth.userId = user._id.toString(); // Sync for existing logic
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

// --- Socket Logic ---
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;

  if (userId) {
    userSockets.set(String(userId), socket.id);
    onlineUsers.add(String(userId));
    
    // Join personal room for notifications/calls
    socket.join(String(userId));
    
    // Broadcast Online Status
    io.emit('user:online', userId);
    console.log(`🟢 User connected: ${userId}`);
  }

  // Send initial presence list
  socket.emit('users:list', Array.from(onlineUsers));

  // --- Rooms ---
  socket.on('joinRoom', ({ room }) => {
    if (!room) return;
    socket.join(room);
    socket.to(room).emit('user-joined', { userId: socket.id });
  });

  socket.on('leaveRoom', ({ room }) => {
    if (room) socket.leave(room);
  });

  // --- Chat Features ---
  socket.on('typing', (data) => {
    // Broadcast to the specific chat room
    if(data.chatId) socket.to(data.chatId).emit('typing', data);
  });

  socket.on('sendMessage', ({ toUserIds, chatId, message }) => {
    if (!Array.isArray(toUserIds)) return;
    // Deliver via personal rooms (fallback if not in chat room)
    toUserIds.forEach((id) => {
      io.to(String(id)).emit('receiveMessage', { chatId, message });
    });
  });

  // --- Video Call Signaling ---
  
  // 1. Ringing Logic
  socket.on('call:start', ({ toUserId, roomId, callerName, callerAvatar }) => {
    io.to(String(toUserId)).emit('call:incoming', {
      roomId,
      from: {
        _id: userId,
        name: callerName,
        avatar: callerAvatar
      }
    });
  });

  // 2. WebRTC Handshake (Offer/Answer/Candidate)
  socket.on('call:signal', ({ to, signal, from }) => {
    // 'to' here can be a socketID (if P2P) or UserId depending on implementation
    // Assuming simple-peer P2P via socket ID from 'user-joined'
    io.to(to).emit('call:signal', { signal, from });
  });

  // 3. Reject/End Call
  socket.on('call:rejected', ({ roomId }) => {
    socket.to(roomId).emit('call:rejected');
    socket.to(roomId).emit('call:ended');
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    if (userId) {
      userSockets.delete(String(userId));
      onlineUsers.delete(String(userId));
      io.emit('user:offline', userId);
      console.log(`🔴 User disconnected: ${userId}`);
    }
  });
});

// -------------------- 6. PRODUCTION ASSETS (SPA) --------------------
// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
  
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));

    // Catch-all handler for React Router
    app.get('*', (req, res) => {
      // Don't intercept API calls or static files if they slip through
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/uploads')) {
          return res.status(404).json({ message: 'Not found' });
      }
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  } else {
    console.warn("⚠️ Frontend build not found in ../frontend/dist");
  }
} else {
  // Dev Fallback
  app.get('/', (req, res) => {
    res.send('API Running. Start frontend using npm run dev');
  });
}

// -------------------- 7. START SERVER --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);