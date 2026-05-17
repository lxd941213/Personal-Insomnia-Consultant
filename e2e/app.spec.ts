import { expect, test } from '@playwright/test';

test('renders the scaffold app shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /几分钟内\s*获得个性化睡眠指导/ }),
  ).toBeVisible();
});

test('shows all quick consultation modules without horizontal clipping', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem('sleepProfile', JSON.stringify({
      ageRange: '25-34岁',
      bedtime: '23:00',
      wakeTime: '07:00',
      mainConcern: 'hard_to_fall_asleep',
      concernDuration: '1-3个月',
      stressLevel: '中等',
      habits: [],
      daytimeImpact: '白天疲惫',
      safetySignals: [],
      optionalContext: '',
    }));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: '首页' })).toBeVisible();

  const layout = await page.locator('.today-page .h-scroll').evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    cardCount: node.querySelectorAll('.scenario-card-compact').length,
  }));

  expect(layout.cardCount).toBe(9);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
});

test('shows all knowledge scenario modules without horizontal clipping', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem('sleepProfile', JSON.stringify({
      ageRange: '25-34岁',
      bedtime: '23:00',
      wakeTime: '07:00',
      mainConcern: 'hard_to_fall_asleep',
      concernDuration: '1-3个月',
      stressLevel: '中等',
      habits: [],
      daytimeImpact: '白天疲惫',
      safetySignals: [],
      optionalContext: '',
    }));
  });
  await page.reload();
  await page.getByRole('button', { name: '睡眠知识' }).click();
  await expect(page.getByRole('heading', { name: '睡眠知识' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '选择场景' })).toBeVisible();

  const layout = await page.locator('.knowledge-page .h-scroll').evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    cardCount: node.querySelectorAll('.scenario-card-compact').length,
  }));

  expect(layout.cardCount).toBe(9);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
});
