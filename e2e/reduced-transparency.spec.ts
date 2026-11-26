import { test, expect } from '@playwright/test';

/**
 * Regression guard: the demo switcher bar is a deliberate dark material
 * (bg-ink/95). The reduced-transparency media query must drop the blur
 * WITHOUT replacing the background with a light surface, otherwise the
 * bar renders white with unreadable text on Windows machines that
 * disable transparency effects.
 */
test.describe('Reduced transparency', () => {
  test('demo switcher bar keeps its dark background when transparency is reduced', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bar = page.locator('div.fixed.inset-x-0.bottom-4 > div > div').first();
    await expect(bar).toBeVisible();

    const bg = await bar.evaluate((el) => getComputedStyle(el).backgroundColor);
    const [r, g, b] = bg.match(/\d+/g)!.map(Number);

    // bg-ink/95 over the page => a very dark colour. A white bar would be 255,255,255.
    expect(b, `demo bar background should stay dark, got ${bg}`).toBeLessThan(80);
    expect(r, `demo bar background should stay dark, got ${bg}`).toBeLessThan(80);
    expect(g, `demo bar background should stay dark, got ${bg}`).toBeLessThan(80);
  });

  test('header stays legible (near-white) when transparency is reduced', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    const bg = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    const [r, g, b] = bg.match(/\d+/g)!.map(Number);

    expect(r, `header should stay light, got ${bg}`).toBeGreaterThan(200);
    expect(g, `header should stay light, got ${bg}`).toBeGreaterThan(200);
    expect(b, `header should stay light, got ${bg}`).toBeGreaterThan(200);
  });
});
