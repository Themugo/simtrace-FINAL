// e2e/registration.spec.ts - E2E tests for user registration flow
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.simtrace.site/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Register');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@simtrace.site`;

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test@123');
    await page.fill('input[name="phone"]', '+254700000011');

    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show success message
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Should show validation errors
    const nameError = page.locator('input[name="name"]').evaluate(el => el.validationMessage);
    expect(await nameError).toBeTruthy();

    const emailError = page.locator('input[name="email"]').evaluate(el => el.validationMessage);
    expect(await emailError).toBeTruthy();

    const passwordError = page.locator('input[name="password"]').evaluate(el => el.validationMessage);
    expect(await passwordError).toBeTruthy();
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Test@123');

    await page.click('button[type="submit"]');

    const emailError = page.locator('input[name="email"]').evaluate(el => el.validationMessage);
    expect(await emailError).toBeTruthy();
  });

  test('should validate password strength', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');

    await page.click('button[type="submit"]');

    // Should show password strength error
    const passwordError = await page.locator('text=Password must be at least 8 characters').isVisible();
    expect(passwordError).toBe(true);
  });

  test('should not register with existing email', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'admin@simtrace.site'); // Assuming this exists
    await page.fill('input[name="password"]', 'Test@123');

    await page.click('button[type="submit"]');

    // Should show email already registered error
    const errorMessage = await page.locator('text=Email already registered').isVisible();
    expect(errorMessage).toBe(true);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('a[href="/login"]');

    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to terms and conditions', async ({ page }) => {
    await page.click('a[href="/terms"]');

    await page.waitForURL('**/terms');
    await expect(page).toHaveURL(/.*terms/);
  });

  test('should navigate to privacy policy', async ({ page }) => {
    await page.click('a[href="/privacy"]');

    await page.waitForURL('**/privacy');
    await expect(page).toHaveURL(/.*privacy/);
  });

  test('should show password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[aria-label="Toggle password visibility"]');

    await page.fill('input[name="password"]', 'Test@123');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Simulate network error by intercepting request
    await page.route('**/api/auth/register', route => route.abort());

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@123');

    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = await page.locator('text=Something went wrong').isVisible();
    expect(errorMessage).toBe(true);
  });
});

test.describe('Registration with Device Onboarding', () => {
  test('should offer device scanning after registration', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-device-${timestamp}@simtrace.site`;

    await page.goto('https://www.simtrace.site/register');
    await page.fill('input[name="name"]', 'Test User with Device');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test@123');
    await page.fill('input[name="phone"]', '+254700000012');

    await page.click('button[type="submit"]');

    // Should redirect to device scanning or onboarding
    await page.waitForURL('**/onboarding', { timeout: 10000 });
    await expect(page).toHaveURL(/.*onboarding/);
  });

  test('should allow skipping device registration', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-skip-${timestamp}@simtrace.site`;

    await page.goto('https://www.simtrace.site/register');
    await page.fill('input[name="name"]', 'Test User Skip');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test@123');

    await page.click('button[type="submit"]');

    // Wait for onboarding page
    await page.waitForURL('**/onboarding', { timeout: 10000 });

    // Click skip button
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForURL('**/dashboard');
    }
  });
});
