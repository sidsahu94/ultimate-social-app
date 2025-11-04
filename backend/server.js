// backend/index.js  (or server.js) — replace your current server file with this (or merge changes)
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
// e.g. in backend/index.js (or server.js) after creating `server`
const FIVE_MINUTES = 5 * 60 * 1000;
server.setTimeout(Number(process.env.SERVER_TIMEOUT_MS || FIVE_MINUTES));


// Configure Socket.IO — default path '/socket.io' works with client io() default
const io = socketio(server, {
  cors: {
    // In production, the SPA will be served by same origin; allowing all here is OK for dev.
    origin: process.env.ALLOWED_ORIGINS || '*',
  },
  transports: ['websocket', 'polling'],
});


// Middleware
app.use(express.json());
app.use(cors()); // consider restricting origin in production
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error', err));

// Routes (unchanged)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/conversations', require('./routes/conversations'));

// --- SOCKET.IO events (same as your previous code) ---
io.on('connection', socket => {
  console.log('New client connected:', socket.id);

  socket.on('sendMessage', (data) => {
    // Example: data.to may be socket id or room — adapt to your app logic
    if (data && data.to) {
      io.to(data.to).emit('receiveMessage', data);
    } else {
      // broadcast fallback
      socket.broadcast.emit('receiveMessage', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// --- Serve frontend in production (or whenever build exists) ---
// Locate frontend build directory relative to backend
const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist'); // Vite default output - adjust if you output to 'build'

if (process.env.NODE_ENV === 'production' || require('fs').existsSync(clientBuildPath)) {
  // Serve static assets
  app.use(express.static(clientBuildPath));

  // This should be AFTER API routes. For any route not handled by server (and not /api or /uploads),
  // return the SPA html. We use a wildcard that excludes /api and /uploads.
  app.get('*', (req, res, next) => {
    // If request is for API or uploads or socket.io, skip and let the route handlers respond
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // In development, optionally expose a helpful route
  app.get('/', (req, res) => {
    res.send('API running. Frontend not built. Run `npm run build` in frontend and restart backend to serve static files.');
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
