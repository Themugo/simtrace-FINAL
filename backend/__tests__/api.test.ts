import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('Backend API Tests', () => {
  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(API_URL).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('services');
    });

    it('should include database status in services', async () => {
      const response = await request(API_URL).get('/api/health');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('redis');
    });
  });

  describe('Billing API', () => {
    it('should return billing plans', async () => {
      const response = await request(API_URL).get('/api/billing/plans');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
      expect(response.body.plans.length).toBeGreaterThan(0);
    });

    it('should include required plan properties', async () => {
      const response = await request(API_URL).get('/api/billing/plans');
      const firstPlan = response.body.plans[0];
      expect(firstPlan).toHaveProperty('id');
      expect(firstPlan).toHaveProperty('name');
      expect(firstPlan).toHaveProperty('priceKES');
      expect(firstPlan).toHaveProperty('priceUSD');
      expect(firstPlan).toHaveProperty('deviceLimit');
      expect(firstPlan).toHaveProperty('features');
    });

    it('should have Free, Pro, Business, and Enterprise plans', async () => {
      const response = await request(API_URL).get('/api/billing/plans');
      const planIds = response.body.plans.map((plan: any) => plan.id);
      expect(planIds).toContain('free');
      expect(planIds).toContain('pro');
      expect(planIds).toContain('business');
      expect(planIds).toContain('enterprise');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(API_URL).get('/api/non-existent');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should include request ID in error responses', async () => {
      const response = await request(API_URL).get('/api/non-existent');
      expect(response.body).toHaveProperty('requestId');
      expect(response.body.requestId).toBeDefined();
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(API_URL).get('/api/health');
      expect(response.headers).toHaveProperty('access-control-allow-credentials');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(API_URL).get('/api/health');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(API_URL).get('/api/health');
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });
});
