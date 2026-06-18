// Shared ioredis client + small helpers.
//
// The cache is treated as a best-effort optimisation: if Redis is unavailable
// the API must keep serving requests (reads fall through to Postgres). We log
// connection errors but never let them crash the process.
import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.redisUrl, {
  // Don't queue commands forever when Redis is down; fail fast and fall back to DB.
  maxRetriesPerRequest: 2,
  lazyConnect: false,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  },
});

let warnedOnce = false;
redis.on('error', (err) => {
  if (!warnedOnce) {
    // eslint-disable-next-line no-console
    console.warn(`[redis] connection error (caching disabled until recovered): ${err.message}`);
    warnedOnce = true;
  }
});
redis.on('ready', () => {
  warnedOnce = false;
});

export async function disconnectRedis() {
  try {
    await redis.quit();
  } catch {
    redis.disconnect();
  }
}
