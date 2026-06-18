// Critical flow (b): a MEMBER cannot advance a task that is not assigned to them.
import { afterAll, describe, expect, test } from '@jest/globals';
import { app, request, registerOrg, createMember } from './helpers.js';
import { disconnectPrisma } from '../src/config/prisma.js';
import { disconnectRedis } from '../src/config/redis.js';

afterAll(async () => {
  await Promise.allSettled([disconnectPrisma(), disconnectRedis()]);
});

describe('RBAC: task status authorization', () => {
  test("a MEMBER cannot advance another member's task (403)", async () => {
    const { accessToken: adminToken } = await registerOrg();

    const memberA = await createMember(adminToken, 'MEMBER');
    const memberB = await createMember(adminToken, 'MEMBER');

    // Admin creates a task assigned to member A.
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: "Member A's task", assigneeId: memberA.user.id });
    expect(created.status).toBe(201);
    const taskId = created.body.data.id;

    // Member B attempts to advance it -> 403 FORBIDDEN.
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberB.token}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('a MEMBER cannot create tasks (403)', async () => {
    const { accessToken: adminToken } = await registerOrg();
    const member = await createMember(adminToken, 'MEMBER');

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ title: 'should be blocked' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('the assignee CAN advance their own task (200)', async () => {
    const { accessToken: adminToken } = await registerOrg();
    const member = await createMember(adminToken, 'MEMBER');

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Self task', assigneeId: member.user.id });

    const res = await request(app)
      .patch(`/api/tasks/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
  });
});
