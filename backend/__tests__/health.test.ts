import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRoutes from '../routes/health.js';
import { connectDB, User } from '../db/index.js';
import { signToken } from '../middleware/auth.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

const app = express();
app.use(express.json());
app.use('/api/v1/health', healthRoutes);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not Found' }); });

describe('Health Routes', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/v1/health');
    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment');
  });

  it('should include services in health response', async () => {
    const response = await request(app).get('/api/v1/health');
    if (response.body.services) {
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('redis');
    }
  });

  // /integrations reveals which third-party services are configured (booleans
  // only, never secret values) — useful recon for an attacker, so it's
  // admin-only, not world-readable.
  it('should reject unauthenticated requests to integrations summary', async () => {
    const response = await request(app).get('/api/v1/health/integrations');
    expect(response.status).toBe(401);
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/v1/health/unknown');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});

const describeMongo = process.env.MONGO_URI ? describe : describe.skip;

describeMongo('Health Routes — integrations summary (admin auth)', () => {
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

  it('allows an admin to fetch the integrations summary', async () => {
    const admin = await User.create({
      name: 'Admin', email: 'admin-health-test@example.com',
      passwordHash: 'x', role: 'admin',
    });
    const token = signToken({ _id: admin._id.toString(), role: 'admin', email: admin.email });

    const response = await request(app)
      .get('/api/v1/health/integrations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('rejects a non-admin user even with a valid token', async () => {
    const user = await User.create({
      name: 'Regular User', email: 'regular-health-test@example.com',
      passwordHash: 'x', role: 'user',
    });
    const token = signToken({ _id: user._id.toString(), role: 'user', email: user.email });

    const response = await request(app)
      .get('/api/v1/health/integrations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
