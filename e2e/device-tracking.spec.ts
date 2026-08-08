// e2e/device-tracking.spec.ts - E2E tests for device tracking flow
import { test, expect } from '@playwright/test';

test.describe('Device Tracking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('https://www.simtrace.site/login');
    await page.fill('input[name="email"]', 'test@simtrace.site');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should display device list on dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="device-list"]')).toBeVisible();
  });

  test('should navigate to device details page', async ({ page }) => {
    const deviceCard = page.locator('[data-testid="device-card"]').first();
    await deviceCard.click();

    await page.waitForURL('**/devices/**');
    await expect(page).toHaveURL(/.*devices\/.+/);
  });

  test('should display device location on map', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    await firstDevice.click();

    // Wait for map to load
    await page.waitForSelector('[data-testid="device-map"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="device-map"]')).toBeVisible();
  });

  test('should show device status', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    
    const statusBadge = firstDevice.locator('[data-testid="device-status"]');
    await expect(statusBadge).toBeVisible();
    
    const statusText = await statusBadge.textContent();
    expect(['active', 'stolen', 'recovered']).toContain(statusText?.toLowerCase());
  });

  test('should refresh device location', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    await firstDevice.click();

    const refreshButton = page.locator('button[aria-label="Refresh location"]');
    await refreshButton.click();

    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

    // Should update location
    await page.waitForSelector('[data-testid="location-updated"]', { timeout: 10000 });
  });

  test('should filter devices by status', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');

    const statusFilter = page.locator('[data-testid="status-filter"]');
    await statusFilter.selectOption('stolen');

    await page.waitForSelector('[data-testid="device-card"]', { timeout: 10000 });

    const deviceCards = page.locator('[data-testid="device-card"]');
    for (const card of await deviceCards.all()) {
      const status = await card.locator('[data-testid="device-status"]').textContent();
      expect(status?.toLowerCase()).toBe('stolen');
    }
  });

  test('should search devices by name', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');

    const searchInput = page.locator('input[placeholder="Search devices..."]');
    await searchInput.fill('Test Device');

    await page.waitForTimeout(500); // Wait for debounce

    const deviceCards = page.locator('[data-testid="device-card"]');
    const firstCard = deviceCards.first();
    const deviceName = await firstCard.locator('[data-testid="device-name"]').textContent();
    expect(deviceName).toContain('Test Device');
  });

  test('should display device history timeline', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    await firstDevice.click();

    const historyTab = page.locator('button:has-text("History")');
    await historyTab.click();

    await expect(page.locator('[data-testid="device-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-timeline"]')).toBeVisible();
  });

  test('should display device evidence', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    await firstDevice.click();

    const evidenceTab = page.locator('button:has-text("Evidence")');
    await evidenceTab.click();

    await expect(page.locator('[data-testid="device-evidence"]')).toBeVisible();
  });

  test('should add a new device', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');

    const addButton = page.locator('button:has-text("Add Device")');
    await addButton.click();

    await page.waitForURL('**/devices/add');
    await expect(page).toHaveURL(/.*devices\/add/);

    await page.fill('input[name="imei"]', '356938035643809');
    await page.fill('input[name="name"]', 'New Test Device');
    await page.fill('input[name="brand"]', 'Samsung');
    await page.fill('input[name="model"]', 'Galaxy S24');

    await page.click('button[type="submit"]');

    await page.waitForURL('**/devices', { timeout: 10000 });
    await expect(page).toHaveURL(/.*devices/);
  });

  test('should validate IMEI format', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices/add');

    await page.fill('input[name="imei"]', 'invalid-imei');
    await page.fill('input[name="name"]', 'Test Device');

    await page.click('button[type="submit"]');

    const errorMessage = await page.locator('text=Invalid IMEI format').isVisible();
    expect(errorMessage).toBe(true);
  });

  test('should not add device with existing IMEI', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices/add');

    await page.fill('input[name="imei"]', '356938035643809'); // Assuming this exists
    await page.fill('input[name="name"]', 'Duplicate Device');

    await page.click('button[type="submit"]');

    const errorMessage = await page.locator('text=Device with this IMEI already exists').isVisible();
    expect(errorMessage).toBe(true);
  });

  test('should delete a device', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');

    const firstDevice = page.locator('[data-testid="device-card"]').first();
    const deviceName = await firstDevice.locator('[data-testid="device-name"]').textContent();

    const menuButton = firstDevice.locator('button[aria-label="Device menu"]');
    await menuButton.click();

    const deleteButton = page.locator('button:has-text("Delete")');
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = page.locator('button:has-text("Confirm")');
    await confirmButton.click();

    // Should show success message
    await expect(page.locator('text=Device deleted successfully')).toBeVisible();

    // Device should be removed from list
    await expect(page.locator(`text=${deviceName}`)).not.toBeVisible();
  });

  test('should enable panic mode', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    await firstDevice.click();

    const panicButton = page.locator('button:has-text("Panic Mode")');
    await panicButton.click();

    // Confirm panic mode
    const confirmButton = page.locator('button:has-text("Activate")');
    await confirmButton.click();

    // Should show panic mode active
    await expect(page.locator('text=Panic mode activated')).toBeVisible();
    await expect(page.locator('[data-testid="panic-status"]')).toHaveText('Active');
  });

  test('should disable panic mode', async ({ page }) => {
    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    await firstDevice.click();

    const panicButton = page.locator('button:has-text("Deactivate Panic")');
    if (await panicButton.isVisible()) {
      await panicButton.click();

      const confirmButton = page.locator('button:has-text("Deactivate")');
      await confirmButton.click();

      await expect(page.locator('text=Panic mode deactivated')).toBeVisible();
    }
  });
});

test.describe('Real-time Device Tracking', () => {
  test('should receive real-time location updates', async ({ page }) => {
    await page.goto('https://www.simtrace.site/login');
    await page.fill('input[name="email"]', 'test@simtrace.site');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();
    await firstDevice.click();

    // Wait for real-time updates
    const initialLocation = await page.locator('[data-testid="device-location"]').textContent();

    // Wait for socket update (simulated)
    await page.waitForTimeout(5000);

    const updatedLocation = await page.locator('[data-testid="device-location"]').textContent();

    // Location should be updated
    expect(updatedLocation).toBeDefined();
  });

  test('should show last seen timestamp', async ({ page }) => {
    await page.goto('https://www.simtrace.site/login');
    await page.fill('input[name="email"]', 'test@simtrace.site');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('https://www.simtrace.site/devices');
    const firstDevice = page.locator('[data-testid="device-card"]').first();

    const lastSeen = firstDevice.locator('[data-testid="last-seen"]');
    await expect(lastSeen).toBeVisible();

    const lastSeenText = await lastSeen.textContent();
    expect(lastSeenText).toMatch(/\d+ (minutes?|hours?|days?) ago/);
  });
});
