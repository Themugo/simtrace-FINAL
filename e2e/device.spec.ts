// Device Management E2E Tests
import { test, expect } from '@playwright/test';

test.describe('Device Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display device list', async ({ page }) => {
    await page.goto('/devices');
    
    // Should show devices table
    await expect(page.locator('table')).toBeVisible();
  });

  test('should allow adding a new device', async ({ page }) => {
    await page.goto('/devices');
    
    await page.click('button:has-text("Add Device")');
    
    await page.fill('input[name="imei"]', '356938035643809');
    await page.fill('input[name="make"]', 'Samsung');
    await page.fill('input[name="model"]', 'Galaxy S21');
    
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=/device added/i')).toBeVisible();
  });

  test('should allow viewing device details', async ({ page }) => {
    await page.goto('/devices');
    
    // Click on first device
    await page.click('table tbody tr:first-child');
    
    // Should show device details
    await expect(page.locator('text=/device details/i')).toBeVisible();
  });

  test('should allow reporting stolen device', async ({ page }) => {
    await page.goto('/devices');
    
    // Click on first device
    await page.click('table tbody tr:first-child');
    
    await page.click('button:has-text("Report Stolen")');
    
    await page.fill('textarea[name="description"]', 'Device stolen at airport');
    
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=/report submitted/i')).toBeVisible();
  });
});
