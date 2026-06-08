import { test, expect } from '@playwright/test';
import { join } from 'path';

/**
 * E2E latency test for PPPoker overlay
 * Measures end-to-end latency: screen capture → OCR/detection → equity calculation → overlay update
 */

type LatencyMetric = {
  captureToOCR: number;
  ocrToDetection: number;
  detectionToEquity: number;
  equityToOverlay: number;
  totalLatency: number;
};

const METRICS_PATH = join(__dirname, 'latency-metrics.json');

const measureLatency = async (page: any): Promise<LatencyMetric> => {
  const startTime = Date.now();

  // Simulate screen capture start
  const captureStart = Date.now();
  await page.evaluate(() => window.dispatchEvent(new Event('screen-capture-start')));

  // Wait for OCR to complete
  const ocrComplete = await page.waitForFunction(
    () => (window as any).ocrComplete,
    { timeout: 5000 }
  );
  const ocrTime = Date.now();

  // Wait for card detection
  const detectionComplete = await page.waitForFunction(
    () => (window as any).detectionComplete,
    { timeout: 5000 }
  );
  const detectionTime = Date.now();

  // Wait for equity calculation
  const equityComplete = await page.waitForFunction(
    () => (window as any).equityComplete,
    { timeout: 5000 }
  );
  const equityTime = Date.now();

  // Wait for overlay update
  const overlayComplete = await page.waitForFunction(
    () => (window as any).overlayComplete,
    { timeout: 5000 }
  );
  const endTime = Date.now();

  return {
    captureToOCR: ocrTime - captureStart,
    ocrToDetection: detectionTime - ocrTime,
    detectionToEquity: equityTime - detectionTime,
    equityToOverlay: endTime - equityTime,
    totalLatency: endTime - startTime,
  };
};

test.describe('PPPoker Overlay Latency', () => {
  test('end-to-end latency under 200ms', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');

    // Wait for app to initialize
    await page.waitForSelector('.app-initialized');

    // Trigger a sample hand state
    await page.evaluate(() => {
      (window as any).testHandState = {
        heroCards: ['Ah', 'Ks'],
        board: ['Qd', 'Jd', 'Tc'],
        potSize: 150,
        players: 3,
      };
      (window as any).triggerHandUpdate();
    });

    const metrics = await measureLatency(page);

    // Save metrics for analysis
    const fs = require('fs');
    fs.writeFileSync(METRICS_PATH, JSON.stringify(metrics, null, 2));

    // Assert latency thresholds
    expect(metrics.totalLatency).toBeLessThan(200);
    expect(metrics.captureToOCR).toBeLessThan(50);
    expect(metrics.ocrToDetection).toBeLessThan(40);
    expect(metrics.detectionToEquity).toBeLessThan(60);
    expect(metrics.equityToOverlay).toBeLessThan(50);
  });

  test('latency remains stable under repeated updates', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.app-initialized');

    const iterations = 10;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      await page.evaluate(() => {
        (window as any).triggerHandUpdate();
      });
      const startTime = Date.now();
      await page.waitForFunction(() => (window as any).overlayComplete, { timeout: 5000 });
      latencies.push(Date.now() - startTime);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    expect(avgLatency).toBeLessThan(150);
    expect(maxLatency).toBeLessThan(200);
  });

  test('handles resolution change without latency spike', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.app-initialized');

    // Simulate DPI/resolution change
    await page.evaluate(() => {
      (window as any).mockResolutionChange({
        width: 1920,
        height: 1080,
        devicePixelRatio: 1.5,
      });
    });

    const metrics = await measureLatency(page);
    expect(metrics.totalLatency).toBeLessThan(250);
  });
});

// Cleanup after tests
test.afterAll(() => {
  try {
    require('fs').unlinkSync(METRICS_PATH);
  } catch (e) {
    // Ignore if file doesn't exist
  }
});
