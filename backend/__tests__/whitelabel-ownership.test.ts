import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { connectDB, User } from '../db/index.js';
import { signToken } from '../middleware/auth.js';
import { createWhiteLabelInstance } from '../services/whiteLabel.js';
import whiteLabelRoutes from '../routes/whiteLabel.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

const describeMongo = process.env.MONGO_URI ? describe : describe.skip;

const app = express();
app.use(express.json());
app.use('/api/white-label', whiteLabelRoutes);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not Found' }); });

describeMongo('White Label Routes — ownership isolation', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test-secret-key';
    await connectDB();
  });

  afterAll(async () => {
    await mongoServer?.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  async function makeUser(role: 'user' | 'admin' = 'user') {
    const u = await User.create({ name: 'T', email: `wl-${role}-${Date.now()}-${Math.random()}@example.com`, passwordHash: 'x', role });
    return { user: u, token: signToken({ _id: u._id.toString(), role: u.role, email: u.email }) };
  }

  it('lets the owner read their own instance', async () => {
    const { user, token } = await makeUser();
    const instance = await createWhiteLabelInstance({ name: 'A', owner: user._id.toString() });

    const res = await request(app)
      .get(`/api/white-label/instances/${instance.instanceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('blocks a different user from reading someone else\'s instance', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const instance = await createWhiteLabelInstance({ name: 'A', owner: owner.user._id.toString() });

    const res = await request(app)
      .get(`/api/white-label/instances/${instance.instanceId}`)
      .set('Authorization', `Bearer ${attacker.token}`);

    expect(res.status).toBe(403);
  });

  it('blocks a different user from regenerating someone else\'s API key', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const instance = await createWhiteLabelInstance({ name: 'A', owner: owner.user._id.toString() });

    const res = await request(app)
      .post(`/api/white-label/instances/${instance.instanceId}/regenerate-key`)
      .set('Authorization', `Bearer ${attacker.token}`);

    expect(res.status).toBe(403);
  });

  it('blocks a different user from reading someone else\'s revenue', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const instance = await createWhiteLabelInstance({ name: 'A', owner: owner.user._id.toString() });

    const res = await request(app)
      .get(`/api/white-label/instances/${instance.instanceId}/revenue`)
      .set('Authorization', `Bearer ${attacker.token}`);

    expect(res.status).toBe(403);
  });

  it('blocks a different user from changing someone else\'s webhook URL', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const instance = await createWhiteLabelInstance({ name: 'A', owner: owner.user._id.toString() });

    const res = await request(app)
      .patch(`/api/white-label/instances/${instance.instanceId}/webhook`)
      .set('Authorization', `Bearer ${attacker.token}`)
      .send({ webhookUrl: 'https://attacker.example.com/hook' });

    expect(res.status).toBe(403);
  });

  it('allows an admin to access any instance regardless of ownership', async () => {
    const owner = await makeUser();
    const admin = await makeUser('admin');
    const instance = await createWhiteLabelInstance({ name: 'A', owner: owner.user._id.toString() });

    const res = await request(app)
      .get(`/api/white-label/instances/${instance.instanceId}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
  });

  it('blocks a non-admin from listing another user\'s instances by ownerId', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    await createWhiteLabelInstance({ name: 'A', owner: owner.user._id.toString() });

    const res = await request(app)
      .get(`/api/white-label/instances?ownerId=${owner.user._id.toString()}`)
      .set('Authorization', `Bearer ${attacker.token}`);

    expect(res.status).toBe(403);
  });

  it('blocks a non-admin from listing system-wide active instances', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .get('/api/white-label/instances?status=active')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('ignores a non-admin\'s attempt to set a different owner on instance creation', async () => {
    const caller = await makeUser();
    const otherUser = await makeUser();

    const res = await request(app)
      .post('/api/white-label/instances')
      .set('Authorization', `Bearer ${caller.token}`)
      .send({ name: 'Sneaky', owner: otherUser.user._id.toString() });

    expect(res.status).toBe(403);
  });

  it('blocks a non-admin from updating metrics, even on their own instance', async () => {
    const { user, token } = await makeUser();
    const instance = await createWhiteLabelInstance({ name: 'A', owner: user._id.toString() });

    const res = await request(app)
      .patch(`/api/white-label/instances/${instance.instanceId}/metrics`)
      .set('Authorization', `Bearer ${token}`)
      .send({ revenue: 999999 });

    expect(res.status).toBe(403);
  });
});
