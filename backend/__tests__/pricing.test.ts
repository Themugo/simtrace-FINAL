import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import pricingRoutes from '../routes/pricing.js';

const app = express();
app.use(express.json());
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not Found' }); });

describe('Pricing Routes', () => {
  it('should return 401 for GET /plans without auth', async () => {
    const response = await request(app).get('/api/v1/pricing/plans');
    expect(response.status).toBe(401);
  });

  it('should return 401 for GET /admin/plans without auth', async () => {
    const response = await request(app).get('/api/v1/pricing/admin/plans');
    expect(response.status).toBe(401);
  });

  it('should return 401 for POST /admin/custom without auth', async () => {
    const response = await request(app).post('/api/v1/pricing/admin/custom').send({});
    expect(response.status).toBe(401);
  });

  it('should return 401 for PATCH /admin/custom/:id without auth', async () => {
    const response = await request(app).patch('/api/v1/pricing/admin/custom/123').send({});
    expect(response.status).toBe(401);
  });

  it('should return 401 for DELETE /admin/custom/:id without auth', async () => {
    const response = await request(app).delete('/api/v1/pricing/admin/custom/123');
    expect(response.status).toBe(401);
  });

  it('should return 401 for POST /admin/waiver without auth', async () => {
    const response = await request(app).post('/api/v1/pricing/admin/waiver').send({});
    expect(response.status).toBe(401);
  });

  it('should return 401 for POST /admin/discount without auth', async () => {
    const response = await request(app).post('/api/v1/pricing/admin/discount').send({});
    expect(response.status).toBe(401);
  });

  it('should return 401 for GET /admin/stats without auth', async () => {
    const response = await request(app).get('/api/v1/pricing/admin/stats');
    expect(response.status).toBe(401);
  });
});
