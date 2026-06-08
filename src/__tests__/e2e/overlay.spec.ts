```typescript
import { test, expect } from '@playwright/test';

test.describe('Overlay E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('http://localhost:5173');
    // Wait for the app to be fully loaded
    await page.waitForSelector('.app-root', { timeout: 10000 });
  });

  test('should display card overlay when cards are detected', async ({ page }) => {
    // Simulate card detection via IPC
    await page.evaluate(() => {
      (window as any).ipcRenderer?.send('card-detection-result', {
        success: true,
        data: {
          playerHand: ['As', 'Kd'],
          board: ['Qs', 'Jh', 'Th'],
          potSize: '1250',
          playersActive: 3
        }
      });
    });

    // Wait for overlay elements to appear
    await page.waitForSelector('.card-overlay', { timeout: 5000 });
    
    // Verify player hand is rendered
    const playerHandElement = await page.$('.player-hand');
    expect(playerHandElement).not.toBeNull();
    
    // Verify board cards are rendered
    const boardElement = await page.$('.board-cards');
    expect(boardElement).not.toBeNull();
    
    // Verify pot size is rendered
    const potElement = await page.$('.chip-counter');
    expect(potElement).not.toBeNull();
  });

  test('should update strategy recommendation when equity changes', async ({ page }) => {
    // Simulate equity calculation result
    await page.evaluate(() => {
      (window as any).ipcRenderer?.send('equity-calculation-result', {
        success: true,
        data: {
          equity: 0.62,
          recommendedAction: 'RAISE',
          confidence: 0.85
        }
      });
    });

    // Wait for strategy recommendation to update
    await page.waitForSelector('.strategy-recommendation', { timeout: 5000 });

    // Verify recommendation is displayed
    const recommendationElement = await page.$('.strategy-recommendation');
    expect(recommendationElement).not.toBeNull();
    
    // Verify action text
    const actionText = await recommendationElement?.textContent();
    expect(actionText).toContain('RAISE');
  });

  test('should handle DPI scaling correctly', async ({ page }) => {
    // Simulate DPI change
    await page.evaluate(() => {
      (window as any).ipcRenderer?.send('dpi-change', { scale: 1.5 });
    });

    // Wait for overlay position update
    await page.waitForFunction(() => {
      const overlay = document.querySelector('.card-overlay');
      return overlay && overlay.style.transform.includes('scale(1.5)');
    }, { timeout: 5000 });

    // Verify overlay scaling
    const overlay = await page.$('.card-overlay');
    const transform = await overlay?.getAttribute('style');
    expect(transform).toContain('scale(1.5)');
  });

  test('should maintain performance under high-frequency updates', async ({ page }) => {
    const frameCount = 60;
    const startTime = await page.evaluate(() => performance.now());

    // Simulate rapid updates
    for (let i = 0; i < frameCount; i++) {
      await page.evaluate((i) => {
        (window as any).ipcRenderer?.send('card-detection-result', {
          success: true,
          data: {
            playerHand: ['As', 'Kd'],
            board: ['Qs', 'Jh', 'Th'],
            potSize: '1250',
            playersActive: 3
          }
        });
      }, i);
      
      // Small delay between updates to simulate real-time
      await new Promise(resolve => setTimeout(resolve, 16));
    }

    const endTime = await page.evaluate(() => performance.now());
    const duration = endTime - startTime;
    
    // Ensure total duration is under 1000ms (1 second) for 60 frames
    expect(duration).toBeLessThan(1000);
  });

  test('should handle overlay visibility toggling', async ({ page }) => {
    // Initially verify overlay is visible
    const overlay = await page.$('.card-overlay');
    expect(overlay).not.toBeNull();
    
    // Toggle visibility
    await page.evaluate(() => {
      (window as any).ipcRenderer?.send('toggle-overlay', { visible: false });
    });

    // Wait for overlay to hide
    await page.waitForSelector('.card-overlay:not(:visible)', { timeout: 5000 });

    // Verify overlay is hidden
    const hiddenOverlay = await page.$('.card-overlay');
    expect(hiddenOverlay).toBeNull();

    // Toggle visibility back on
    await page.evaluate(() => {
      (window as any).ipcRenderer?.send('toggle-overlay', { visible: true });
    });

    // Wait for overlay to show
    await page.waitForSelector('.card-overlay', { timeout: 5000 });

    // Verify overlay is visible again
    const visibleOverlay = await page.$('.card-overlay');
    expect(visibleOverlay).not.toBeNull();
  });

  test('should display error state when detection fails', async ({ page }) => {
    // Simulate detection failure
    await page.evaluate(() => {
      (window as any).ipcRenderer?.send('card-detection-result', {
        success: false,
        error: 'No cards detected'
      });
    });

    // Wait for error state
    await page.waitForSelector('.error-state', { timeout: 5000 });

    // Verify error message
    const errorElement = await page.$('.error-state');
    expect(errorElement).not.toBeNull();
    
    const errorMessage = await errorElement?.textContent();
    expect(errorMessage).toContain('No cards detected');
  });

  test('should handle window focus/blur events correctly', async ({ page }) => {
    // Simulate window blur
    await page.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
    });

    // Wait for overlay to hide on blur
    await page.waitForSelector('.card-overlay:not(:visible)', { timeout: 5000 });

    // Simulate window focus
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
    });

    // Wait for overlay to show on focus
    await page.waitForSelector('.card-overlay', { timeout: 5000 });

    // Verify overlay is visible again
    const overlay = await page.$('.card-overlay');
    expect(overlay).not.toBeNull();
  });

  test('should maintain correct overlay position during window movement', async ({ page }) => {
    // Simulate window position change
    await page.evaluate(() => {
      (window as any).ipcRenderer?.send('window-position-change', { x: 100, y: 200 });
    });

    // Wait for overlay position update
    await page.waitForFunction(() => {
      const overlay = document.querySelector('.card-overlay');
      return overlay && overlay.style.left === '100px' && overlay.style.top === '200px';
    }, { timeout: 5000 });

    // Verify overlay position
    const overlay = await page.$('.card-overlay');
    const style = await overlay?.getAttribute('style');
    expect(style).toContain('left: 100px');
    expect(style).toContain('top: 200px');
  });

  test('should handle concurrent detection and equity updates', async ({ page }) => {
    // Simulate concurrent updates
    await Promise.all([
      page.evaluate(() => {
        (window as any).ipcRenderer?.send('card-detection-result', {
          success: true,
          data: {
            playerHand: ['As', 'Kd'],
            board: ['Qs', 'Jh', 'Th'],
            potSize: '1250',
            playersActive: 3
          }
        });
      }),
      page.evaluate(() => {
        (window as any).ipcRenderer?.send('equity-calculation-result', {
          success: true,
          data: {
            equity: 0.62,
            recommendedAction: 'RAISE',
            confidence: 0.85
          }
        });
      })
    ]);

    // Wait for both overlays to update
    await page.waitForSelector('.card-overlay', { timeout: 5000 });
    await page.waitForSelector('.strategy-recommendation', { timeout: 5000 });

    // Verify both overlays are present
    const cardOverlay = await page.$('.card-overlay');
    const strategyOverlay = await page.$('.strategy-recommendation');
    
    expect(cardOverlay).not.toBeNull();
    expect(strategyOverlay).not.toBeNull();
  });

  test('should gracefully handle network disconnection during updates', async ({ page }) => {
    // Simulate network disconnection
    await page.evaluate(() => {
      (window as any).ipcRenderer?.send('network-status', { connected: false });
    });

    // Attempt to send updates while disconnected
    await page.evaluate(() => {
      (window as any).ipcRenderer?.send('card-detection-result', {
        success: true,
        data: {
          playerHand: ['As', 'Kd'],
          board: ['Qs', 'Jh', 'Th'],
          potSize: '1250',
          playersActive: 3
        }
      });
    });

    // Wait for offline indicator
    await page.waitForSelector('.offline-indicator', { timeout: 5000 });

    // Verify offline indicator is displayed
    const offlineIndicator = await page.$('.offline-indicator');
    expect(offlineIndicator).not.toBeNull();
  });
});
```