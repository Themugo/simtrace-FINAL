import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

const API_URL = process.env.API_TEST_URL || 'http://localhost:5000';
const runIntegration = !!process.env.API_TEST_URL;

describe.runIf(runIntegration)('Deployed Backend API Integration Tests', () => {
  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await request(API_URL).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('message', 'OK');
    });

    it('should show production environment', async () => {
      const response = await request(API_URL).get('/api/health');
      expect(response.body.environment).toBe('production');
    });
  });

  describe('Billing Plans', () => {
    it('should return all billing plans', async () => {
      const response = await request(API_URL).get('/api/billing/plans');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await request(API_URL).get('/api/non-existent');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
