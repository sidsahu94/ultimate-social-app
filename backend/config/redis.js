const { createClient } = require('redis');

let redisClient = null;

async function connectRedis() {
  if (!process.env.REDIS_URL) {
    return;
  }
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('Redis reconnection retries exhausted; continuing without token blacklist.');
            return false;
          }
          return Math.min(retries * 500, 2000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.warn('Redis Client Warning:', err.message);
    });

    await redisClient.connect();

    console.log('✅ Redis Connected');

  } catch (err) {
    console.warn(
      '⚠ Redis unavailable. Continuing without blacklist.'
    );

    redisClient = null;
  }
}

connectRedis();

module.exports = {
  get: async (key) => {
    if (!redisClient) return null;

    try {
      return await redisClient.get(key);
    } catch {
      return null;
    }
  },

  set: async (key, value) => {
    if (!redisClient) return;

    try {
      await redisClient.set(key, value);
    } catch {}
  }
};