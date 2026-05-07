import { expect, test } from '@playwright/test';

test('user can create profile and reach chat', async ({ page }) => {
  await page.route('/api/chat', async (route) => {
    await route.fulfill({
      json: {
        riskLevel: 'normal',
        summary: 'Your late bedtime and high stress likely make it harder to fall asleep.',
        possibleFactors: ['Late bedtime', 'High stress'],
        suggestions: [{ title: 'Set a wind-down start time', detail: 'Start a 30-minute phone-free wind-down at 00:30 tonight.' }],
        nextQuestions: ['Do you drink caffeine after lunch?'],
        seekCareNotice: null,
        disclaimer: 'This is for health management reference only and is not medical diagnosis.',
      },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Create sleep profile' }).click();
  await page.getByLabel('Age range').selectOption('25-34');
  await page.getByLabel('Usual bedtime').fill('01:00');
  await page.getByLabel('Usual wake time').fill('08:00');
  await page.getByLabel('Main sleep concern').selectOption('hard_to_fall_asleep');
  await page.getByLabel('Concern duration').selectOption('1-3 months');
  await page.getByLabel('Stress level').selectOption('High');
  await page.getByLabel('Daytime impact').fill('Tired at work');
  await page.getByLabel('Optional context').fill('I use my phone in bed.');
  await page.getByRole('button', { name: 'Start consultation' }).click();

  await page.getByPlaceholder('Ask about your sleep...').fill('How can I fall asleep earlier?');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText('Your late bedtime and high stress')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Useful' })).toBeVisible();
});
