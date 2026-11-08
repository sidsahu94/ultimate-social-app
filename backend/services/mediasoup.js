// backend/services/mediasoup.js
let mediasoup = null;
try {
  mediasoup = require('mediasoup');
} catch (e) {
  // mediasoup is optional or native build not compiled
}

let worker = null;
let router = null;
let isInitializing = false;

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

const initializeMediasoup = async () => {
  if (!mediasoup) {
    return null;
  }

  if (isInitializing) return router;
  isInitializing = true;

  try {
    const rtcMinPort = parseInt(process.env.MEDIASOUP_MIN_PORT, 10) || 10000;
    const rtcMaxPort = parseInt(process.env.MEDIASOUP_MAX_PORT, 10) || 10100;

    worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort,
      rtcMaxPort,
    });

    worker.on('died', () => {
      console.error(`[Mediasoup] Worker died [pid:${worker?.pid}]. Triggering auto-recovery...`);
      worker = null;
      router = null;
      isInitializing = false;
      setTimeout(() => {
        initializeMediasoup().catch((err) => console.error('[Mediasoup] Recovery failed:', err.message));
      }, 2000);
    });

    router = await worker.createRouter({ mediaCodecs });
    console.log('🚀 Mediasoup Worker & Router Initialized');
    return router;
  } catch (err) {
    console.warn('[Mediasoup] Initialization notice:', err.message);
    return null;
  } finally {
    isInitializing = false;
  }
};

const getRouter = () => router;

module.exports = {
  initializeMediasoup,
  getRouter,
};
