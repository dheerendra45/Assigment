// Critical flow (a): an invalid status transition is rejected with 400.
import { afterAll, describe, expect, test } from '@jest/globals';
import { app, request, registerOrg } from './helpers.js';
import { disconnectPrisma } from '../src/config/prisma.js';
import { disconnectRedis } from '../src/config/redis.js';

afterAll(async () => {
  await Promise.allSettled([disconnectPrisma(), disconnectRedis()]);
});

describe('Task status state machine', () => {
  test('rejects an invalid transition (TODO -> DONE) with 400 VALIDATION_ERROR', async () => {
    const { accessToken } = await registerOrg();

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'A task', status: 'TODO' });
    expect(created.status).toBe(201);
    const taskId = created.body.data.id;

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'DONE' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toMatch(/Invalid status transition/i);
  });

  test('allows a valid transition (TODO -> IN_PROGRESS)', async () => {
    const { accessToken } = await registerOrg();

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Another task' });
    const taskId = created.body.data.id;

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });
});
