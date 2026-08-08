// API Integration E2E Tests
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe('API Integration Tests', () => {
  test('should get health check', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('should check IMEI validity', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/imei/check`, {
      data: {
        imei: '356938035643809',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('valid');
  });

  test('should require authentication for protected routes', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/devices`);
    
    expect(response.status()).toBe(401);
  });

  test('should authenticate with valid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'TestPassword123!',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('token');
  });
});
