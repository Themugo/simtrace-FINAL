// e2e/theft-reporting.spec.ts - E2E tests for theft reporting flow
import { test, expect } from '@playwright/test';

test.describe('Theft Reporting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('https://www.simtrace.site/login');
    await page.fill('input[name="email"]', 'test@simtrace.site');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should navigate to theft report page', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();

    const reportButton = firstDevice.locator('button:has-text("Report Stolen")');
    await reportButton.click();

    await page.waitForURL('**/report', { timeout: 10000 });
    await expect(page).toHaveURL(/.*report/);
  });

  test('should display theft report form', async ({ page }) => {
    await page.goto('https://www.simtrace.site/report');

    await expect(page.locator('h1')).toContainText('Report Theft');
    await expect(page.locator('select[name="deviceId"]')).toBeVisible();
    await expect(page.locator('input[name="incidentDate"]')).toBeVisible();
    await expect(page.locator('input[name="incidentLocation"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should submit theft report successfully', async ({ page }) => {
    await page.goto('https://www.simtrace.site/report');

    // Select device
    await page.selectOption('select[name="deviceId"]', { index: 0 });

    // Fill incident details
    await page.fill('input[name="incidentDate"]', '2026-06-07');
    await page.fill('input[name="incidentLocation"]', 'Nairobi CBD, Kenya');
    await page.fill('textarea[name="description"]', 'Device was stolen from my car while parked at Westgate Mall');

    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Theft reported successfully')).toBeVisible();

    // Should redirect to device details or dashboard
    await page.waitForURL('**/devices/**', { timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('https://www.simtrace.site/report');

    await page.click('button[type="submit"]');

    // Should show validation errors
    const deviceError = await page.locator('text=Please select a device').isVisible();
    expect(deviceError).toBe(true);

    const dateError = await page.locator('text=Please enter incident date').isVisible();
    expect(dateError).toBe(true);

    const locationError = await page.locator('text=Please enter incident location').isVisible();
    expect(locationError).toBe(true);
  });

  test('should auto-fill device when reporting from device page', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    const deviceName = await firstDevice.locator('[data-testid="device-name"]').textContent();

    const reportButton = firstDevice.locator('button:has-text("Report Stolen")');
    await reportButton.click();

    await page.waitForURL('**/report', { timeout: 10000 });

    // Device should be pre-selected
    const selectedDevice = await page.locator('select[name="deviceId"]').inputValue();
    expect(selectedDevice).toBeTruthy();
  });

  test('should allow uploading evidence photos', async ({ page }) => {
    await page.goto('https://www.simtrace.site/report');

    await page.selectOption('select[name="deviceId"]', { index: 0 });
    await page.fill('input[name="incidentDate"]', '2026-06-07');
    await page.fill('input[name="incidentLocation"]', 'Test Location');

    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/evidence.jpg');

    await page.fill('textarea[name="description"]', 'Test report with evidence');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Theft reported successfully')).toBeVisible();
  });

  test('should display incident location on map', async ({ page }) => {
    await page.goto('https://www.simtrace.site/report');

    await page.selectOption('select[name="deviceId"]', { index: 0 });
    await page.fill('input[name="incidentLocation"]', 'Nairobi CBD, Kenya');

    // Map should appear
    await page.waitForSelector('[data-testid="incident-map"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="incident-map"]')).toBeVisible();
  });

  test('should show confirmation before submitting', async ({ page }) => {
    await page.goto('https://www.simtrace.site/report');

    await page.selectOption('select[name="deviceId"]', { index: 0 });
    await page.fill('input[name="incidentDate"]', '2026-06-07');
    await page.fill('input[name="incidentLocation"]', 'Test Location');
    await page.fill('textarea[name="description"]', 'Test report');

    await page.click('button[type="submit"]');

    // Should show confirmation modal
    await expect(page.locator('[data-testid="confirmation-modal"]')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to report this device as stolen?')).toBeVisible();

    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Theft reported successfully')).toBeVisible();
  });

  test('should cancel report submission', async ({ page }) => {
    await page.goto('https://www.simtrace.site/report');

    await page.selectOption('select[name="deviceId"]', { index: 0 });
    await page.fill('input[name="incidentDate"]', '2026-06-07');
    await page.fill('input[name="incidentLocation"]', 'Test Location');

    await page.click('button[type="submit"]');

    // Cancel in confirmation modal
    await page.click('button:has-text("Cancel")');

    // Should remain on report page
    await expect(page).toHaveURL(/.*report/);
  });

  test('should update device status to stolen after report', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    const deviceName = await firstDevice.locator('[data-testid="device-name"]').textContent();

    const reportButton = firstDevice.locator('button:has-text("Report Stolen")');
    await reportButton.click();

    await page.waitForURL('**/report', { timeout: 10000 });

    await page.selectOption('select[name="deviceId"]', { index: 0 });
    await page.fill('input[name="incidentDate"]', '2026-06-07');
    await page.fill('input[name="incidentLocation"]', 'Test Location');
    await page.fill('textarea[name="description"]', 'Test report');

    await page.click('button[type="submit"]');
    await page.click('button:has-text("Confirm")');

    await page.waitForURL('**/devices/**', { timeout: 10000 });

    // Device status should be stolen
    const statusBadge = page.locator('[data-testid="device-status"]');
    await expect(statusBadge).toHaveText('Stolen');
  });

  test('should notify police automatically', async ({ page }) => {
    await page.goto('https://www.simtrace.site/report');

    await page.selectOption('select[name="deviceId"]', { index: 0 });
    await page.fill('input[name="incidentDate"]', '2026-06-07');
    await page.fill('input[name="incidentLocation"]', 'Test Location');
    await page.fill('textarea[name="description"]', 'Test report');

    // Check police notification checkbox
    const notifyPolice = page.locator('input[name="notifyPolice"]');
    if (await notifyPolice.isVisible()) {
      await notifyPolice.check();
    }

    await page.click('button[type="submit"]');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Police notified')).toBeVisible();
  });

  test('should display report history', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    await firstDevice.click();

    const historyTab = page.locator('button:has-text("History")');
    await historyTab.click();

    // Should show theft report in history
    await expect(page.locator('text=Theft Reported')).toBeVisible();
  });

  test('should allow editing report', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    await firstDevice.click();

    const historyTab = page.locator('button:has-text("History")');
    await historyTab.click();

    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      await page.fill('textarea[name="description"]', 'Updated description');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Report updated successfully')).toBeVisible();
    }
  });

  test('should mark device as recovered', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();

    // Check if device is stolen
    const statusBadge = firstDevice.locator('[data-testid="device-status"]');
    const status = await statusBadge.textContent();

    if (status === 'Stolen') {
      const menuButton = firstDevice.locator('button[aria-label="Device menu"]');
      await menuButton.click();

      const recoverButton = page.locator('button:has-text("Mark as Recovered")');
      await recoverButton.click();

      await page.fill('textarea[name="recoveryNotes"]', 'Device recovered by police');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Device marked as recovered')).toBeVisible();

      // Status should change to recovered
      await expect(statusBadge).toHaveText('Recovered');
    }
  });

  test('should show recovery statistics', async ({ page }) => {
    await page.goto('https://www.simtrace.site/dashboard');

    await expect(page.locator('[data-testid="recovery-statistics"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-recovered"]')).toBeVisible();
    await expect(page.locator('[data-testid="recovery-rate"]')).toBeVisible();
  });
});

test.describe('Theft Report from Mobile App', () => {
  test('should report theft from mobile app', async ({ page, context }) => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('https://www.simtrace.site/login');
    await page.fill('input[name="email"]', 'test@simtrace.site');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();

    const reportButton = firstDevice.locator('button:has-text("Report Stolen")');
    await reportButton.click();

    await page.waitForURL('**/report', { timeout: 10000 });

    await page.selectOption('select[name="deviceId"]', { index: 0 });
    await page.fill('input[name="incidentDate"]', '2026-06-07');
    await page.fill('input[name="incidentLocation"]', 'Test Location');
    await page.fill('textarea[name="description"]', 'Mobile test report');

    await page.click('button[type="submit"]');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Theft reported successfully')).toBeVisible();
  });
});
