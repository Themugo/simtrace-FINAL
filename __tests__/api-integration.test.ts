import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

const DEPLOYED_API_URL = 'https://simtrace-backend.onrender.com';

describe('Deployed Backend API Integration Tests', () => {
  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await request(DEPLOYED_API_URL).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('message', 'OK');
    });

    it('should show production environment', async () => {
      const response = await request(DEPLOYED_API_URL).get('/api/health');
      expect(response.body.environment).toBe('production');
    });
  });

  describe('Billing Plans', () => {
    it('should return all billing plans', async () => {
      const response = await request(DEPLOYED_API_URL).get('/api/billing/plans');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
    });

    it('should return plan with correct structure', async () => {
      const response = await request(DEPLOYED_API_URL).get('/api/billing/plans');
      const freePlan = response.body.plans.find((p: any) => p.id === 'free');
      expect(freePlan).toBeDefined();
      expect(freePlan.priceKES).toBe(0);
      expect(freePlan.deviceLimit).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await request(DEPLOYED_API_URL).get('/api/non-existent');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should include request ID for debugging', async () => {
      const response = await request(DEPLOYED_API_URL).get('/api/non-existent');
      expect(response.body).toHaveProperty('requestId');
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const start = Date.now();
      await request(DEPLOYED_API_URL).get('/api/health');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe('Security', () => {
    it('should have security headers', async () => {
      const response = await request(DEPLOYED_API_URL).get('/api/health');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('should have rate limiting headers', async () => {
      const response = await request(DEPLOYED_API_URL).get('/api/health');
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });
  });
});
