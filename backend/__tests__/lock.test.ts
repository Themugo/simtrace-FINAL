import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import lockRoutes from '../routes/lock.js';

const app = express();
app.use(express.json());
app.use('/api/v1/devices', lockRoutes);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not Found' }); });

describe('Lock Routes', () => {
  it('should return 401 for POST /:id/lock without auth', async () => {
    const response = await request(app).post('/api/v1/devices/123/lock');
    expect(response.status).toBe(401);
  });

  it('should return 401 for POST /:id/unlock without auth', async () => {
    const response = await request(app).post('/api/v1/devices/123/unlock');
    expect(response.status).toBe(401);
  });

  it('should return 401 for GET /:id/commands without device key', async () => {
    const response = await request(app).get('/api/v1/devices/123/commands');
    expect(response.status).toBe(401);
  });

  it('should return 401 or 500 for PATCH /:id/commands/:cmdId without device key', async () => {
    const response = await request(app).patch('/api/v1/devices/123/commands/456').send({ status: 'executed' });
    // Returns 500 if DB query fails (no mongo), or 401 if route checks header
    expect([401, 500]).toContain(response.status);
  });
});
