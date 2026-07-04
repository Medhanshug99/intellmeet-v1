
const { AppError } = require('../middlewares/error.middleware');

let client = null;
let enabled = false;

const initRedis = () => {
  if (!process.env.REDIS_URL) {
    console.log('[redis] REDIS_URL not set — running without Redis (token blacklist disabled).');
    return;
  }
  try {

    const { createClient } = require('redis');
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('[redis] error:', err.message));
    client.connect().then(() => {
      enabled = true;
      console.log('[redis] connected');
    });
  } catch (err) {
    console.error('[redis] failed to initialize:', err.message);
  }
};


const blacklistToken = async (jti, ttlSeconds) => {
  if (!enabled || !client) return;
  try {
    await client.set(`bl:${jti}`, '1', { EX: ttlSeconds });
  } catch (err) {
    console.error('[redis] blacklistToken failed:', err.message);
  }
};


const isBlacklisted = async (jti) => {
  if (!enabled || !client) return false;
  try {
    const v = await client.get(`bl:${jti}`);
    return v === '1';
  } catch (err) {
    console.error('[redis] isBlacklisted failed:', err.message);
    return false;
  }
};

module.exports = {
  initRedis,
  blacklistToken,
  isBlacklisted
};
