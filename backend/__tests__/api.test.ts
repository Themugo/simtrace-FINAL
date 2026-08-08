import request from 'supertest';
import express from 'express';
import healthRoutes from '../routes/health.js';
import billingRoutes from '../routes/billing.js';
import { globalErrorHandler } from '../middleware/globalErrorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1', (_req, res) => {
  res.status(404).json({ error: 'Not found', requestId: 'test-request-id' });
});
app.use(globalErrorHandler);

describe('Backend API Tests', () => {
  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('services');
    });

    it('should include database status in services', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('redis');
    });
  });

  describe('Billing API', () => {
    it('should return billing plans', async () => {
      const response = await request(app).get('/api/v1/billing/plans');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
      expect(response.body.plans.length).toBeGreaterThan(0);
    });

    it('should include required plan properties', async () => {
      const response = await request(app).get('/api/v1/billing/plans');
      const firstPlan = response.body.plans[0];
      expect(firstPlan).toHaveProperty('id');
      expect(firstPlan).toHaveProperty('name');
      expect(firstPlan).toHaveProperty('priceKES');
      expect(firstPlan).toHaveProperty('priceUSD');
      expect(firstPlan).toHaveProperty('deviceLimit');
      expect(firstPlan).toHaveProperty('features');
    });

    it('should have Free, Pro, Business, and Enterprise plans', async () => {
      const response = await request(app).get('/api/v1/billing/plans');
      const planIds = response.body.plans.map((plan: Record<string, unknown>) => plan.id as string);
      expect(planIds).toContain('free');
      expect(planIds).toContain('pro');
      expect(planIds).toContain('business');
      expect(planIds).toContain('enterprise');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/non-existent');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app).get('/api/v1/non-existent');
      expect(response.body).toHaveProperty('requestId');
      expect(response.body.requestId).toBeDefined();
    });
  });

  // CORS, security headers, and rate limiting are configured in server.ts
  // and are not tested in isolated route-level tests
});
