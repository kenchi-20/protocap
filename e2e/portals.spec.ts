import { test, expect } from '@playwright/test';

test.describe('End-to-End Portal Verification', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('response', res => {
      if (res.status() >= 400) console.log('RES ' + res.status() + ':', res.url());
    });
  });

  test('Step 6: Old routes are removed and return 404', async ({ page }) => {
    const adminRes = await page.goto('/admin');
    expect(adminRes?.status()).toBe(404);

    const parentRes = await page.goto('/parent');
    expect(parentRes?.status()).toBe(404);
  });

  test('Step 2: Parent login flow and child scoping', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('maria@parent.test');
    await expect(emailInput).toHaveValue('maria@parent.test');

    await passwordInput.fill('parent123');
    await expect(passwordInput).toHaveValue('parent123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*parent-portal/);
    await expect(page.locator('main')).toContainText('Juan Dela Cruz');
    await expect(page.locator('main')).not.toContainText('Andrea Mae Villanueva');

    // Test sign out
    await page.click('text=Sign out');
    await expect(page).toHaveURL(/.*login/);
  });

  test('Step 3: Teacher login flow and section scoping', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('osalla@teacher.test');
    await expect(emailInput).toHaveValue('osalla@teacher.test');

    await passwordInput.fill('teacher123');
    await expect(passwordInput).toHaveValue('teacher123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*teacher-portal/);
    await expect(page.locator('main')).toContainText('Grade 9 - St. Augustine');
    await expect(page.locator('main')).toContainText('Grade 9 - St. Nicholas');
    // Ensure sections not advised are not shown
    await expect(page.locator('main')).not.toContainText('Grade 8 - St. Monica');

    // Test search filter
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Rafael');
    await expect(page.locator('table')).toContainText('Rafael Aquino');
    await expect(page.locator('table')).not.toContainText('Juan Dela Cruz');

    // Test sign out
    await page.click('text=Sign out');
    await expect(page).toHaveURL(/.*login/);
  });

  test('Step 4 & 5: Admin / Security portal, Log absence gating, and Gate Scanner', async ({ page }) => {
    // 1. Principal (admin) login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('principal@admin.test');
    await passwordInput.fill('admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*security-portal/);
    // Verify "Log absence" button is visible for admin
    await expect(page.locator('text=+ Log absence').first()).toBeVisible();

    // Verify Gate Scanner link works
    await page.click('text=Gate Scanner');
    await expect(page).toHaveURL(/.*security-portal\/scanner/);

    // Return to security portal
    await page.goto('/security-portal');
    await page.waitForLoadState('networkidle');

    // Sign out
    await page.click('text=Sign out');
    await expect(page).toHaveURL(/.*login/);

    // 2. Login as security
    await emailInput.fill('security@admin.test');
    await passwordInput.fill('admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*security-portal/);
    // Verify "Log absence" button is hidden for security role
    await expect(page.locator('text=+ Log absence')).not.toBeVisible();
  });
});
