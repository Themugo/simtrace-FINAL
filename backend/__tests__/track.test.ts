import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import trackRoutes from '../routes/track.js';

const app = express();
app.use(express.json());
app.use('/api/v1/track', trackRoutes);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not Found' }); });

describe('Track Routes', () => {
  it('should return 400 for missing required fields', async () => {
    const response = await request(app).post('/api/v1/track').send({});
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid imei format', async () => {
    const response = await request(app).post('/api/v1/track').send({
      imei: 'abc',
      lat: 0,
      lng: 0,
    });
    expect(response.status).toBe(400);
  });

  it('should return 400 for missing lat', async () => {
    const response = await request(app).post('/api/v1/track').send({
      imei: '356938035643809',
      lng: 0,
    });
    expect(response.status).toBe(400);
  });
});
