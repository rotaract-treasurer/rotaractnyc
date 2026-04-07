import { test, expect } from '@playwright/test';

// Intercept all Firebase/backend calls so pages render without a real backend
test.beforeEach(async ({ page }) => {
  // Mock Firebase queries that public pages rely on
  await page.route('**/firestore.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/identitytoolkit.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
});

test.describe('Homepage', () => {
  test('loads with correct title containing "Rotaract"', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Rotaract/i);
  });

  test('has a hero section with CTA buttons', async ({ page }) => {
    await page.goto('/');
    // The homepage should have a prominent hero area with call-to-action links
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    // Expect at least one CTA link (e.g. "Join Us", "Upcoming Events", etc.)
    const ctaLinks = page.locator('a').filter({ hasText: /join|get started|events|donate|learn more/i });
    await expect(ctaLinks.first()).toBeVisible();
  });
});

test.describe('Public page navigation', () => {
  test('navigate to About page and verify content loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/About/i);
    // About page should contain mission-related content
    await expect(page.getByText(/mission/i).first()).toBeVisible();
  });

  test('navigate to Events page and verify events section renders', async ({ page }) => {
    await page.goto('/events');
    await expect(page).toHaveTitle(/Events/i);
    // Events page has a hero and content section
    await expect(page.getByRole('heading', { name: /events/i }).first()).toBeVisible();
  });

  test('navigate to Contact page and verify form is present', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveTitle(/Contact/i);
    // The contact page should have a form
    await expect(page.locator('form')).toBeVisible();
  });

  test('navigate to Leadership page and verify board section', async ({ page }) => {
    await page.goto('/leadership');
    await expect(page).toHaveTitle(/Leadership/i);
    await expect(page.getByRole('heading', { name: /leadership/i }).first()).toBeVisible();
  });

  test('navigate to Donate page and verify donation form renders', async ({ page }) => {
    await page.goto('/donate');
    await expect(page).toHaveTitle(/Donate/i);
    // Should see the donation amount presets
    await expect(page.getByRole('radio', { name: /\$25/i }).or(page.getByText('$25'))).toBeVisible();
  });

  test('navigate to Membership page and verify content loads', async ({ page }) => {
    await page.goto('/membership');
    await expect(page).toHaveTitle(/Membership/i);
    await expect(page.getByRole('heading', { name: /join/i }).first()).toBeVisible();
  });

  test('navigate to Partners page and verify content loads', async ({ page }) => {
    await page.goto('/partners');
    await expect(page).toHaveTitle(/Partners/i);
    await expect(page.getByRole('heading', { name: /partner/i }).first()).toBeVisible();
  });
});

test.describe('404 page', () => {
  test('shows 404 for invalid routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(page.getByText(/not found/i).first()).toBeVisible();
  });
});

test.describe('Footer', () => {
  test('is present on public pages with expected links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Footer should contain key quick links
    await expect(footer.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /events/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /contact/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /donate/i })).toBeVisible();
  });
});

test.describe('Navbar', () => {
  test('is present and contains navigation links', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Should have key navigation items
    await expect(nav.getByRole('link', { name: /about/i }).first()).toBeVisible();
    await expect(nav.getByRole('link', { name: /events/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /contact/i })).toBeVisible();
  });

  test('is responsive — shows mobile menu button on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile menu toggle button should be visible on small screens
    const menuButton = page.getByRole('button', { name: /menu|toggle|open/i });
    await expect(menuButton).toBeVisible();
  });
});
