import Redis from 'ioredis';
import { env } from './env.js';

// Best-effort cache: errors are logged not thrown, so the API still serves from Postgres.
export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

let warned = false;
redis.on('error', (err) => {
  if (!warned) {
    console.warn(`[redis] connection error (caching disabled until recovered): ${err.message}`);
    warned = true;
  }
});
redis.on('ready', () => {
  warned = false;
});

export async function disconnectRedis() {
  try {
    await redis.quit();
  } catch {
    redis.disconnect();
  }
}
