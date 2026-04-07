import { test, expect } from '@playwright/test';

test.describe('Portal authentication redirects', () => {
  test('/portal redirects to /portal/login when not authenticated', async ({ page }) => {
    await page.goto('/portal');

    // Middleware should redirect unauthenticated users to /portal/login
    await page.waitForURL('**/portal/login**');
    expect(page.url()).toContain('/portal/login');
  });

  test('/portal/directory redirects to login without auth', async ({ page }) => {
    await page.goto('/portal/directory');

    await page.waitForURL('**/portal/login**');
    expect(page.url()).toContain('/portal/login');
    // The redirect param should preserve the original destination
    expect(page.url()).toContain('redirect=%2Fportal%2Fdirectory');
  });

  test('/portal/events redirects to login without auth', async ({ page }) => {
    await page.goto('/portal/events');

    await page.waitForURL('**/portal/login**');
    expect(page.url()).toContain('/portal/login');
    expect(page.url()).toContain('redirect=%2Fportal%2Fevents');
  });

  test('/portal/dues redirects to login without auth', async ({ page }) => {
    await page.goto('/portal/dues');

    await page.waitForURL('**/portal/login**');
    expect(page.url()).toContain('/portal/login');
    expect(page.url()).toContain('redirect=%2Fportal%2Fdues');
  });
});

test.describe('Portal login page', () => {
  test('login page renders with Google sign-in button', async ({ page }) => {
    await page.goto('/portal/login');

    // Should show the Member Portal heading
    await expect(page.getByRole('heading', { name: /member portal/i })).toBeVisible();

    // Should have a Google sign-in button
    const signInButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(signInButton).toBeVisible();
  });
});
