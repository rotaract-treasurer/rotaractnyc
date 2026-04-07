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

test.describe('Contact form fields', () => {
  test('form has name, email, subject, and message fields', async ({ page }) => {
    await page.goto('/contact');

    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Verify all four fields are present
    await expect(form.getByLabel(/name/i)).toBeVisible();
    await expect(form.getByLabel(/email/i)).toBeVisible();
    await expect(form.getByLabel(/subject/i)).toBeVisible();
    await expect(form.getByLabel(/message/i)).toBeVisible();
  });
});

test.describe('Contact form validation', () => {
  test('form validates required fields on empty submit', async ({ page }) => {
    await page.goto('/contact');

    const form = page.locator('form');
    const submitButton = form.getByRole('button', { name: /send message/i });
    await expect(submitButton).toBeVisible();

    // Click submit without filling any fields
    await submitButton.click();

    // The HTML5 required attribute should trigger browser validation.
    // However the form uses noValidate, so the API call fires and returns an error.
    // We intercept the API to return a validation error.
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'All fields are required.' }),
      }),
    );

    // Re-submit to trigger the mocked response
    await submitButton.click();

    // Expect an error message to appear
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('form shows error for invalid email format', async ({ page }) => {
    await page.goto('/contact');

    // Intercept API to return validation error for invalid email
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Please provide a valid email address.' }),
      }),
    );

    const form = page.locator('form');
    await form.getByLabel(/name/i).fill('Test User');
    await form.getByLabel(/email/i).fill('invalid-email');
    await form.getByLabel(/subject/i).fill('Test Subject');
    await form.getByLabel(/message/i).fill('Test message body');

    await form.getByRole('button', { name: /send message/i }).click();

    // Should show the validation error from the API
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});

test.describe('Contact form submission', () => {
  test('successful submission shows confirmation message', async ({ page }) => {
    await page.goto('/contact');

    // Mock a successful API response
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      }),
    );

    const form = page.locator('form');
    await form.getByLabel(/name/i).fill('Jane Doe');
    await form.getByLabel(/email/i).fill('jane@example.com');
    await form.getByLabel(/subject/i).fill('Inquiry');
    await form.getByLabel(/message/i).fill('Hello, I would like to learn more about Rotaract NYC.');

    await form.getByRole('button', { name: /send message/i }).click();

    // After successful submission, the "Message Sent!" confirmation should appear
    await expect(page.getByText(/message sent/i)).toBeVisible();
    await expect(page.getByText(/thank you/i)).toBeVisible();
  });
});
