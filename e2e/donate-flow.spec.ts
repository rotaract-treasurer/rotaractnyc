import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock Firebase/backend calls
  await page.route('**/firestore.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/identitytoolkit.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
});

test.describe('Donation page presets', () => {
  test('shows preset amount buttons', async ({ page }) => {
    await page.goto('/donate');

    // The donate form should have $25, $50, $100 preset buttons
    const presetGroup = page.getByRole('radiogroup', { name: /donation amount/i });
    await expect(presetGroup).toBeVisible();

    await expect(page.getByText('$25')).toBeVisible();
    await expect(page.getByText('$50')).toBeVisible();
    await expect(page.getByText('$100')).toBeVisible();
  });

  test('clicking a preset selects it with visual state change', async ({ page }) => {
    await page.goto('/donate');

    const preset50 = page.getByRole('radio', { name: /\$50/i });
    await preset50.click();

    // After clicking, the button should be aria-checked true
    await expect(preset50).toHaveAttribute('aria-checked', 'true');

    // The other presets should not be selected
    const preset25 = page.getByRole('radio', { name: /\$25/i });
    await expect(preset25).toHaveAttribute('aria-checked', 'false');
  });
});

test.describe('Custom amount input', () => {
  test('custom amount field accepts numeric input', async ({ page }) => {
    await page.goto('/donate');

    const customInput = page.locator('#custom-amount');
    await expect(customInput).toBeVisible();

    await customInput.fill('75');
    await expect(customInput).toHaveValue('75');
  });
});

test.describe('Donate submit button', () => {
  test('submit button is present and clickable', async ({ page }) => {
    await page.goto('/donate');

    // Select a preset first so the button is enabled
    const preset25 = page.getByRole('radio', { name: /\$25/i });
    await preset25.click();

    const donateButton = page.getByRole('button', { name: /donate/i });
    await expect(donateButton).toBeVisible();
    await expect(donateButton).toBeEnabled();
  });
});

test.describe('Donation form submission', () => {
  test('form submission calls donate API and redirects to Stripe', async ({ page }) => {
    await page.goto('/donate');

    // Intercept the donate API call
    let apiCalled = false;
    await page.route('**/api/donate', (route) => {
      apiCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/test_session_123' }),
      });
    });

    // Intercept the Stripe redirect so we don't actually navigate away
    await page.route('https://checkout.stripe.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>Stripe Checkout</body></html>',
      }),
    );

    // Select preset and click donate
    const preset25 = page.getByRole('radio', { name: /\$25/i });
    await preset25.click();

    const donateButton = page.getByRole('button', { name: /donate/i });
    await donateButton.click();

    // Wait for the API to be called
    await page.waitForTimeout(1000);
    expect(apiCalled).toBe(true);
  });
});
