import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import verificationRoutes from '../routes/verification.js';

const app = express();
app.use(express.json());
app.use('/api/v1/verify', verificationRoutes);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not Found' }); });

describe('Verification Routes', () => {
  it('should return 400 for missing send fields', async () => {
    const response = await request(app).post('/api/v1/verify/send').send({});
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid channel', async () => {
    const response = await request(app).post('/api/v1/verify/send').send({
      channel: 'invalid',
      destination: 'test@example.com',
    });
    expect(response.status).toBe(400);
  });

  it('should return 400 for missing destination in send', async () => {
    const response = await request(app).post('/api/v1/verify/send').send({
      channel: 'email',
    });
    expect(response.status).toBe(400);
  });

  it('should return 400 for missing check fields', async () => {
    const response = await request(app).post('/api/v1/verify/check').send({});
    expect(response.status).toBe(400);
  });

  it('should return 400 for missing code in check', async () => {
    const response = await request(app).post('/api/v1/verify/check').send({
      destination: 'test@example.com',
    });
    expect(response.status).toBe(400);
  });
});
