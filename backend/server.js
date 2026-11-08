// backend/server.js

// --- CORE IMPORTS & INITIALIZATION ---
const express = require('express');
const http = require('http');
const fs = require('fs');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// --- GRACEFUL SHUTDOWN UTILITY ---
let isShuttingDown = false;

async function gracefulShutdown(exitCode = 1) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    server.close(async () => {
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }
        logger.info('Graceful shutdown completed');
        process.exit(exitCode);
      } catch (err) {
        logger.error('Shutdown error:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

// --- CRITICAL PROCESS ERROR HANDLERS ---
process.on('unhandledRejection', async (reason) => {
  logger.error('Unhandled Rejection detected within operational stack:', reason);
  await gracefulShutdown(1);
});

process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception thrown inside main thread:', error);
  await gracefulShutdown(1);
});

// --- MODULE IMPORTS ---
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const path = require('path');

const config = require('./config/env');
const { validateEnv } = require('./config/envValidator');

validateEnv(); 

const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const socketService = require('./services/socketService');

app.set('trust proxy', 1);
server.headersTimeout = 65000;
server.keepAliveTimeout = 61000;

// --- SECURITY & PERFORMANCE ---
app.use(compression());
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      connectSrc: [
        "'self'", "ws:", "wss:", 
        "https://ultimate-social-app.onrender.com", 
        "wss://ultimate-social-app.onrender.com", 
        "https://newsdata.io", "https://www.googleapis.com"
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));

app.use(mongoSanitize());

const globalApiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
const feedLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 300 });

app.use('/api', globalApiLimiter);
app.use(['/api/auth/login', '/api/v1/auth/login', '/api/auth/register', '/api/v1/auth/register'], authLimiter);
app.use(['/api/posts/upload', '/api/v1/posts/upload'], uploadLimiter);
app.use(['/api/posts/feed', '/api/v1/posts/feed'], feedLimiter);

const allowedOrigins = Array.isArray(config.ALLOWED_ORIGINS) ? config.ALLOWED_ORIGINS : [config.ALLOWED_ORIGINS];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.endsWith('.onrender.com')) return true;
  if (config.NODE_ENV !== 'production' || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return true;
  }
  return false;
};

app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(hpp());
app.use(xss());

app.use(requestLogger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get(['/health', '/api/health', '/api/v1/health'], (req, res) => res.status(200).json({ status: 'OK', uptime: process.uptime() }));

// --- DATABASE ---
const connectDatabase = require('./config/db');
connectDatabase().catch((err) => {
  logger.error(`Database initialization failure: `);
});

// --- HARDENED SOCKET.IO & REDIS ---
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
  path: '/socket.io',
  pingTimeout: 20000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
});

if (config.REDIS_URL) {
  (async () => {
    try {
      const redisOptions = {
        url: config.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.warn('Redis reconnection attempts exhausted; continuing with in-memory adapter');
              return false;
            }
            return Math.min(retries * 500, 2000);
          },
        },
      };
      const pubClient = createClient(redisOptions);
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => logger.warn(`Redis Pub Error: ${err.message}`));
      subClient.on('error', (err) => logger.warn(`Redis Sub Error: ${err.message}`));

      await Promise.all([pubClient.connect(), subClient.connect()]);

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Redis Adapter Connected');
    } catch(err) {
      logger.warn(`Redis adapter disabled: ${err.message}`);
    }
  })();
}

global.io = io;
socketService(io);

// Mediasoup WebRTC Router initialization (graceful fallback if native binary unavailable)
const { initializeMediasoup } = require('./services/mediasoup');
initializeMediasoup().catch((err) => logger.warn(`Mediasoup initialization notice: ${err.message}`));

// --- ROUTES MANAGEMENT ---
const apiRouter = express.Router();

// Individual Decoupled Sub-route Module Registration
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const appsRoutes = require('./routes/apps');
const callsRoutes = require('./routes/calls');
const chatRoutes = require('./routes/chat');
const commentsRoutes = require('./routes/comments');
const conversationsRoutes = require('./routes/conversations');
const extraRoutes = require('./routes/extra');
const followSuggestRoutes = require('./routes/followSuggest');
const integrationsRoutes = require('./routes/integrations');
const liveRoutes = require('./routes/live');
const marketplaceRoutes = require('./routes/marketplace');
const moderationRoutes = require('./routes/moderation');
const notificationsRoutes = require('./routes/notifications');
const payoutsRoutes = require('./routes/payouts');
const pollsRoutes = require('./routes/polls');
const postsRoutes = require('./routes/posts');
const proxyRoutes = require('./routes/proxy');
const reelsRoutes = require('./routes/reels');
const reportsRoutes = require('./routes/reports');
const searchRoutes = require('./routes/search'); 
const shopRoutes = require('./routes/shop');
const socialRoutes = require('./routes/social');
const storiesRoutes = require('./routes/stories'); 
const tagsRoutes = require('./routes/tags');
const translateRoutes = require('./routes/translate');
const usersRoutes = require('./routes/users'); 
const walletRoutes = require('./routes/wallet');
const spacesRoutes = require('./routes/spaces');

// Mount Sub-routers on top of the API root router topology
apiRouter.use('/spaces', spacesRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/apps', appsRoutes);
apiRouter.use('/calls', callsRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/comments', commentsRoutes);
apiRouter.use('/conversations', conversationsRoutes);
apiRouter.use('/extra', extraRoutes);
apiRouter.use('/follow-suggest', followSuggestRoutes);
apiRouter.use('/integrations', integrationsRoutes);
apiRouter.use('/live', liveRoutes);
apiRouter.use('/marketplace', marketplaceRoutes);
apiRouter.use('/moderation', moderationRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/payouts', payoutsRoutes);
apiRouter.use('/polls', pollsRoutes);
apiRouter.use('/posts', postsRoutes);
apiRouter.use('/proxy', proxyRoutes);
apiRouter.use('/reels', reelsRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/shop', shopRoutes);
apiRouter.use('/social', socialRoutes);
apiRouter.use('/stories', storiesRoutes);
apiRouter.use('/tags', tagsRoutes);
apiRouter.use('/translate', translateRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/wallet', walletRoutes);

// Mount the integrated route cluster onto both /api/v1 and /api for seamless backwards compatibility
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// --- FRONTEND STATIC ASSETS & SPA ROUTING ---
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const altFrontendDistPath = path.resolve(__dirname, 'frontend/dist');
const effectiveDistPath = fs.existsSync(frontendDistPath)
  ? frontendDistPath
  : (fs.existsSync(altFrontendDistPath) ? altFrontendDistPath : null);

if (effectiveDistPath) {
  app.use(express.static(effectiveDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io') || req.originalUrl.startsWith('/uploads')) {
      return next(new AppError(`Can't find ${req.originalUrl} on this backend topography!`, 404));
    }
    res.sendFile(path.join(effectiveDistPath, 'index.html'));
  });
} else {
  // Fallback for unhandled endpoints / Global 404 handler within route pathing
  app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this backend topography!`, 404));
  });
}

// --- GLOBAL RUNTIME ERROR HANDLING TRAP ---
app.use(errorHandler);

// --- START SERVER ---
const PORT = config.PORT;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please terminate the conflicting process or change PORT in .env.`);
  } else {
    logger.error(`Server error: ${err.message}`);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  logger.info(`SERVER RUNNING ON PORT ${PORT} | MODE: ${config.NODE_ENV}`);
});

// --- GRACEFUL SHUTDOWN SIGNAL HANDLERS ---
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM RECEIVED');
  await gracefulShutdown(0);
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT RECEIVED');
  await gracefulShutdown(0);
});