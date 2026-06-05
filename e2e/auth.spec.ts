// Authentication E2E Tests
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to register', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or login
    await expect(page).toHaveURL(/\/(dashboard|login)/);
  });

  test('should allow user to login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible();
  });

  test('should allow password reset', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.fill('input[name="email"]', 'test@example.com');
    
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=/reset link sent/i')).toBeVisible();
  });
});
