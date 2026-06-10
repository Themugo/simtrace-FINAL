import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import adminRoutes from '../routes/admin.js';

const app = express();
app.use(express.json());
app.use('/api/v1/admin', adminRoutes);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not Found' }); });

describe('Admin Routes', () => {
  it('should return 401 for GET /users without auth', async () => {
    const response = await request(app).get('/api/v1/admin/users');
    expect(response.status).toBe(401);
  });

  it('should return 401 for PATCH /users/:id/role without auth', async () => {
    const response = await request(app).patch('/api/v1/admin/users/123/role').send({ role: 'admin' });
    expect(response.status).toBe(401);
  });
});
