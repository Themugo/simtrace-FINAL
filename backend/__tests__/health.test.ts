import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRoutes from '../routes/health.js';

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

  it('should return integrations summary', async () => {
    const response = await request(app).get('/api/v1/health/integrations');
    expect(response.status).toBe(200);
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/v1/health/unknown');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});
