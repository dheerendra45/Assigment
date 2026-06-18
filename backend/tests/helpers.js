// Test helpers: each run registers a fresh org with unique emails.
import request from 'supertest';
import { app } from '../src/app.js';

let counter = 0;
export function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}.${process.pid}.${counter}.${Math.floor(Math.random() * 1e6)}@test.local`;
}

// Register a fresh org; the registering user is its ADMIN.
export async function registerOrg() {
  const email = uniqueEmail('admin');
  const res = await request(app).post('/api/auth/register').send({
    organizationName: `Org ${email}`,
    name: 'Admin User',
    email,
    password: 'Password123',
  });
  return res.body; // { user, accessToken, refreshToken }
}

// ADMIN creates an org member with the given role and logs them in.
export async function createMember(adminToken, role = 'MEMBER') {
  const email = uniqueEmail('member');
  const created = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Member User', email, password: 'Password123', role });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Password123' });

  return { user: created.body.data, token: login.body.accessToken };
}

export { app, request };
