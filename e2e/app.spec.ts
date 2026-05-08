import { expect, test } from '@playwright/test';

test('renders the scaffold app shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /几分钟内\s*获得个性化睡眠指导/ }),
  ).toBeVisible();
});
