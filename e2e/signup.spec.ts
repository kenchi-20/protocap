import { test, expect } from '@playwright/test';

test.describe('Parent Sign Up Flow', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('response', res => {
      if (res.status() >= 400) console.log('RES ' + res.status() + ':', res.url());
    });
  });

  test('Parent can sign up with valid student ID and see child portal', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page.locator('h1')).toContainText('Create Parent Account');

    // Fill the signup form
    await page.fill('input[name="parentName"]', 'Mrs. Ana Cruz');
    await page.fill('input[name="email"]', 'ana@parent.test');
    await page.fill('input[name="phone"]', '+63 920 555 0118');
    await page.fill('input[name="studentId"]', 'USA-JHS-2026-0091'); // Isabella Cruz
    await page.fill('input[name="password"]', 'parent123');
    await page.fill('input[name="confirmPassword"]', 'parent123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to login with success message
    await expect(page).toHaveURL(/.*login/);

    // Sign in with new credentials
    await page.fill('input[name="identifier"]', 'ana@parent.test');
    await page.fill('input[type="password"]', 'parent123');
    await page.click('button[type="submit"]');

    // Should land on parent portal and see linked child
    await expect(page).toHaveURL(/.*parent-portal/);
    await expect(page.locator('main')).toContainText('Isabella Cruz');
    await expect(page.locator('main')).toContainText('USA-JHS-2026-0091');
  });

  test('Parent signup rejects invalid student ID', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="parentName"]', 'Test Parent');
    await page.fill('input[name="email"]', 'test@parent.test');
    await page.fill('input[name="phone"]', '+63 900 000 0000');
    await page.fill('input[name="studentId"]', 'INVALID-ID');
    await page.fill('input[name="password"]', 'parent123');
    await page.fill('input[name="confirmPassword"]', 'parent123');

    await page.click('button[type="submit"]');

    // Should show inline error for student ID
    await expect(page.locator('text=Student ID not found')).toBeVisible();
    // Should stay on signup page
    await expect(page).toHaveURL(/.*signup/);
  });

  test('Parent signup rejects mismatched passwords', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="parentName"]', 'Test Parent');
    await page.fill('input[name="email"]', 'test2@parent.test');
    await page.fill('input[name="phone"]', '+63 900 000 0001');
    await page.fill('input[name="studentId"]', 'USA-JHS-2026-0091');
    await page.fill('input[name="password"]', 'parent123');
    await page.fill('input[name="confirmPassword"]', 'different');

    await page.click('button[type="submit"]');

    // Should show inline error for password mismatch
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('Back to login link navigates correctly', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Click back link at top
    await page.click('text=Back to Sign in');

    await expect(page).toHaveURL(/.*login/);
  });
});