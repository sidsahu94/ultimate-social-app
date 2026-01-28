// backend/server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const path = require('path');
require('dotenv').config();

// Custom Modules
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const socketService = require('./services/socketService');

// Init App
const app = express();
const server = http.createServer(app);

// 🔥 Fix 1: Trust Proxy (Required for Render/Heroku deployment)
// This fixes the "X-Forwarded-For" validation error in logs and rate limiters
app.set('trust proxy', 1);

// 🔥 Fix 2: Secure timeout settings to prevent Slowloris attacks
server.headersTimeout = 65000;
server.keepAliveTimeout = 61000;

// --- SECURITY & PERFORMANCE MIDDLEWARE ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable for now to allow external images/scripts if needed
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://ultimate-social-app.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Required for HttpOnly Cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body Parsers
app.use(express.json({ limit: '50kb' })); // Limit JSON body size
app.use(cookieParser()); // Parse secure cookies
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(xss()); // Prevent XSS
app.use(compression()); // Gzip compression

// Rate Limiting (Global API)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

// --- STATIC FILES ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ DB Connection Error:', err);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB Disconnected. Attempting reconnect...');
});

// --- SOCKET.IO & REDIS SETUP ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  path: '/socket.io',
  pingTimeout: 60000,
});

// Redis Adapter (Only if REDIS_URL is present)
if (process.env.REDIS_URL) {
  (async () => {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      
      await Promise.all([pubClient.connect(), subClient.connect()]);
      
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Redis Adapter Connected for Socket.io');
    } catch (err) {
      console.warn('⚠️ Redis connection failed, falling back to memory adapter:', err.message);
    }
  })();
}

// Make io accessible globally (for controllers)
global.io = io;

// Initialize Socket Service (Events & Logic)
socketService(io);

// --- API ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/report', require('./routes/report'));
app.use('/api/extra', require('./routes/extra'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/apps', require('./routes/apps'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/polls', require('./routes/polls'));

// Optional Feature Routes
const optionalRoutes = [
    { path: '/api/search', file: './routes/search' },
    { path: '/api/live', file: './routes/live' },
    { path: '/api/social', file: './routes/social' },
    { path: '/api/shop', file: './routes/shop' },
    { path: '/api/payouts', file: './routes/payouts' },
    { path: '/api/moderation', file: './routes/moderation' },
    { path: '/api/follow-suggest', file: './routes/followSuggest' },
    { path: '/api/proxy', file: './routes/proxy' }
];

optionalRoutes.forEach(route => {
    try {
        app.use(route.path, require(route.file));
    } catch (e) {
        // console.warn(`Optional route ${route.path} skipped (module not found).`);
    }
});

// --- PRODUCTION: SERVE FRONTEND ---
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(clientBuildPath));
    
    // SPA Fallback: Any route not handled by API goes to index.html
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
            return next(); 
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
   app.get('/', (req, res) => {
     res.send('API is Running Successfully. Frontend is hosted separately in Dev mode.');
   });
}

// --- ERROR HANDLING ---
// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`⚡ SERVER RUNNING ON PORT ${PORT} | MODE: ${process.env.NODE_ENV || 'development'}`);
});