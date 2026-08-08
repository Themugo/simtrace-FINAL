import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import recoveryRoutes from '../routes/recovery.js';

const app = express();
app.use(express.json());
app.use('/api/v1/recovery', recoveryRoutes);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not Found' }); });

describe('Recovery Routes', () => {
  it('should return 401 for POST /agents without auth', async () => {
    const response = await request(app).post('/api/v1/recovery/agents').send({ name: 'test' });
    expect(response.status).toBe(401);
  });

  it('should return 401 for GET /agents without auth', async () => {
    const response = await request(app).get('/api/v1/recovery/agents');
    expect(response.status).toBe(401);
  });

  it('should return 401 for PATCH /agents/:id/metrics without auth', async () => {
    const response = await request(app).patch('/api/v1/recovery/agents/123/metrics');
    expect(response.status).toBe(401);
  });

  it('should return 401 for POST /cases without auth', async () => {
    const response = await request(app).post('/api/v1/recovery/cases').send({ imei: '123456789012345' });
    expect(response.status).toBe(401);
  });

  it('should return 401 for GET /cases/:id without auth', async () => {
    const response = await request(app).get('/api/v1/recovery/cases/123');
    expect(response.status).toBe(401);
  });

  it('should return 401 for GET /cases/my without auth', async () => {
    const response = await request(app).get('/api/v1/recovery/cases/my');
    expect(response.status).toBe(401);
  });

  it('should return 401 for PATCH /cases/:id/status without auth', async () => {
    const response = await request(app).patch('/api/v1/recovery/cases/123/status').send({ status: 'open' });
    expect(response.status).toBe(401);
  });

  it('should return 401 for POST /cases/:id/communications without auth', async () => {
    const response = await request(app).post('/api/v1/recovery/cases/123/communications').send({});
    expect(response.status).toBe(401);
  });

  it('should return 401 for GET /cases/active without auth', async () => {
    const response = await request(app).get('/api/v1/recovery/cases/active');
    expect(response.status).toBe(401);
  });

  it('should return 401 for GET /stats without auth', async () => {
    const response = await request(app).get('/api/v1/recovery/stats');
    expect(response.status).toBe(401);
  });
});
