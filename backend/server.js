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

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const io = socketio(server, {
  cors: { origin: allowedOrigins, credentials: true },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
});

app.set('io', io);
global.io = io; 

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE CONNECTION & AUTO-FIX ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Mongo connected');
    try {
        // Attempt to sync indexes, but don't crash if it fails
        await User.syncIndexes();
        await Post.syncIndexes();
        console.log('Indexes synced');
    } catch (e) { 
        console.warn('⚠️ Index sync warning (Safe to ignore):', e.message); 
    }
  })
  .catch(e => console.error('❌ Mongo Error:', e));

// --- ROUTES ---
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
app.use('/api/apps', require('./routes/apps')); // Fixes 404s for Games/Events
app.use('/api/wallet', require('./routes/wallet')); // Ensures Wallet works

// Optional Routes (Wrapped)
try { app.use('/api/search', require('./routes/search')); } catch(e){}
try { app.use('/api/live', require('./routes/live')); } catch(e){}
try { app.use('/api/social', require('./routes/social')); } catch(e){}
try { app.use('/api/polls', require('./routes/polls')); } catch(e){}
try { app.use('/api/shop', require('./routes/shop')); } catch(e){}
try { app.use('/api/payouts', require('./routes/payouts')); } catch(e){}
try { app.use('/api/moderation', require('./routes/moderation')); } catch(e){}
try { app.use('/api/tags', require('./routes/tags')); } catch(e){}
try { app.use('/api/follow-suggest', require('./routes/followSuggest')); } catch(e){}

// --- SOCKET LOGIC ---
const userSockets = new Map();
io.on('connection', (socket) => {
  const { userId } = socket.handshake.auth || {};
  if (userId) {
    userSockets.set(String(userId), socket.id);
    socket.join(String(userId));
  }

  socket.on('joinRoom', ({ room }) => { if(room) socket.join(room); });
  socket.on('leaveRoom', ({ room }) => { if(room) socket.leave(room); });
  
  socket.on('typing', (d) => socket.to(d.chatId).emit('typing', d));
  socket.on('stopTyping', (d) => {
      const sock = userSockets.get(String(d.toUserId));
      if(sock) io.to(sock).emit('stopTyping');
  });

  socket.on('sendMessage', ({ toUserIds, chatId, message }) => {
    if(Array.isArray(toUserIds)) {
        toUserIds.forEach(id => {
            const sock = userSockets.get(String(id));
            if(sock) io.to(sock).emit('receiveMessage', { chatId, message });
        });
    }
  });

  socket.on('disconnect', () => {
    if(userId) userSockets.delete(String(userId));
  });
});

// --- PRODUCTION SERVE ---
const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('API Running. Start Frontend via `npm run dev`'));
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));