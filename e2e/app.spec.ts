import { expect, test } from '@playwright/test';

test('renders the scaffold app shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Sleep Wellness H5 MVP' }),
  ).toBeVisible();
});
