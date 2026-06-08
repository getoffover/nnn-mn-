import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForSelector('[data-testid="dashboard-root"]');
  });

  test('should render dashboard root with all sections', async ({ page }) => {
    const root = page.locator('[data-testid="dashboard-root"]');
    await expect(root).toBeVisible();

    const logViewer = page.locator('[data-testid="log-viewer"]');
    await expect(logViewer).toBeVisible();

    const thresholdConfig = page.locator('[data-testid="threshold-config"]');
    await expect(thresholdConfig).toBeVisible();

    const gtoManager = page.locator('[data-testid="gto-manager"]');
    await expect(gtoManager).toBeVisible();

    const themeConfig = page.locator('[data-testid="theme-config"]');
    await expect(themeConfig).toBeVisible();
  });

  test('should display log entries in log viewer', async ({ page }) => {
    const logEntries = page.locator('[data-testid="log-entry"]');
    const initialCount = await logEntries.count();

    // Simulate new log entry via IPC (mocked in preload)
    await page.evaluate(() => {
      (window as any).ipcRenderer?.emit('log-message', {
        level: 'info',
        message: 'Test log entry',
        timestamp: Date.now(),
      });
    });

    await page.waitForSelector('[data-testid="log-entry"]:nth-child(2)', { timeout: 2000 });
    const updatedCount = await logEntries.count();
    expect(updatedCount).toBeGreaterThan(initialCount);
  });

  test('should allow threshold configuration updates', async ({ page }) => {
    const equityThresholdInput = page.locator('[data-testid="equity-threshold-input"]');
    await equityThresholdInput.fill('0.65');
    await equityThresholdInput.blur();

    const savedValue = await page.evaluate(() => {
      return localStorage.getItem('equityThreshold');
    });
    expect(savedValue).toBe('0.65');
  });

  test('should update GTO strategy version selector', async ({ page }) => {
    const versionSelect = page.locator('[data-testid="gto-version-select"]');
    await versionSelect.selectOption({ label: 'v2.1.0' });

    const selectedValue = await versionSelect.inputValue();
    expect(selectedValue).toBe('v2.1.0');
  });

  test('should persist theme settings to localStorage', async ({ page }) => {
    const darkModeToggle = page.locator('[data-testid="theme-toggle"]');
    await darkModeToggle.click();

    const theme = await page.evaluate(() => {
      return localStorage.getItem('theme');
    });
    expect(theme).toBe('dark');

    await page.reload();
    const persistedTheme = await page.evaluate(() => {
      return localStorage.getItem('theme');
    });
    expect(persistedTheme).toBe('dark');
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Simulate error state
    await page.evaluate(() => {
      const error = new Error('Simulated dashboard error');
      (window as any).dispatchEvent(new CustomEvent('dashboard-error', { detail: error }));
    });

    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    await expect(errorBoundary).toBeVisible();

    const fallbackUI = page.locator('[data-testid="fallback-ui"]');
    await expect(fallbackUI).toBeVisible();
  });

  test('should not leak memory after multiple reloads', async ({ page }) => {
    const initialHeapSize = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });

    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForSelector('[data-testid="dashboard-root"]');
    }

    const finalHeapSize = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });

    // Allow up to 20% increase in heap size
    expect(finalHeapSize).toBeLessThan(initialHeapSize * 1.2);
  });
});