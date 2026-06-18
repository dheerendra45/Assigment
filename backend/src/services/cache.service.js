import { redis } from '../config/redis.js';

const TTL_SECONDS = 60;

export function assigneeListKey(userId, page, limit) {
  return `tasks:assignee:${userId}:page:${page}:limit:${limit}`;
}

export async function getCachedList(key) {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export async function setCachedList(key, value) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', TTL_SECONDS);
  } catch {
    /* ignore cache write failures */
  }
}

// Delete every cached page for the given assignee(s) via SCAN + DEL.
export async function invalidateAssignee(...userIds) {
  const targets = [...new Set(userIds.filter(Boolean))];
  await Promise.all(
    targets.map(async (userId) => {
      const pattern = `tasks:assignee:${userId}:*`;
      try {
        const keys = [];
        let cursor = '0';
        do {
          const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
          cursor = next;
          keys.push(...batch);
        } while (cursor !== '0');
        if (keys.length) await redis.del(...keys);
      } catch {
        /* ignore invalidation failures */
      }
    }),
  );
}
