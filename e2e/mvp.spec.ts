import { expect, test } from '@playwright/test';

test('user can create profile, complete assessment, generate knowledge cards, and chat', async ({ page }) => {
  await page.route('/api/chat', async (route) => {
    await route.fulfill({
      json: {
        riskLevel: 'normal',
        summary: '根据您的情况，建议保持规律作息并放松身心。',
        possibleFactors: ['晚睡习惯', '压力过大'],
        suggestions: [{ title: '设置固定作息时间', detail: '每天在同一时间入睡和起床，即使周末也要坚持。' }],
        nextQuestions: ['您白天是否有疲劳感？'],
        seekCareNotice: null,
        disclaimer: '本内容仅供健康管理参考，不作为医疗诊断。',
      },
    });
  });

  await page.route('/api/knowledge', async (route) => {
    await route.fulfill({
      json: {
        scenario: 'hard_to_fall_asleep',
        generatedAt: '2026-05-08T08:00:00.000Z',
        cards: [
          {
            title: '入睡困难调理',
            summary: '入睡困难时应注意放松身心，避免睡前刺激，保持规律作息。',
            keyPoints: ['睡前警觉升高'],
            misconceptions: ['躺得越久越容易睡着'],
            actions: [{ title: '睡前降刺激', detail: '睡前 30 分钟减少屏幕使用。' }],
            safetyNote: null,
            followUpQuestions: ['睡前是否会看手机？'],
          },
        ],
        disclaimer: '本内容仅供健康管理参考。',
      },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '创建睡眠档案' }).click();
  await page.getByLabel('年龄段').selectOption('25-34岁');
  await page.getByLabel('通常就寝时间').fill('23:00');
  await page.getByLabel('通常起床时间').fill('07:00');
  await page.getByLabel('主要睡眠问题').selectOption('hard_to_fall_asleep');
  await page.getByLabel('问题持续时间').selectOption('1-3个月');
  await page.getByLabel('压力水平').selectOption('中等');
  await page.getByLabel('白天影响').fill('疲劳');
  await page.getByRole('button', { name: '开始咨询' }).click();

  // Today tab is shown
  await expect(page.getByRole('heading', { name: '今日睡眠' })).toBeVisible();

  // Complete assessment and see report before returning.
  await page.getByRole('button', { name: '睡眠自测' }).click();
  for (const group of await page.locator('[data-testid^="rating-row-"]').all()) {
    await group.locator('label').first().click();
  }
  await page.getByRole('button', { name: '生成自测报告' }).click();
  await expect(page.getByRole('heading', { name: '睡眠自测报告' })).toBeVisible();
  await page.getByRole('button', { name: '返回首页' }).click();
  await expect(page.getByRole('heading', { name: '今日睡眠' })).toBeVisible();

  // Generate knowledge cards
  await page.getByRole('button', { name: '睡眠知识' }).click();
  await expect(page.getByRole('heading', { name: '睡眠知识' })).toBeVisible();
  await page.getByRole('button', { name: /入睡困难/ }).click();
  await expect(page.getByText('入睡困难调理')).toBeVisible();

  // Go back to dashboard
  await page.getByRole('button', { name: '返回' }).click();
  await expect(page.getByRole('heading', { name: '今日睡眠' })).toBeVisible();

  // Chat with AI
  await page.getByRole('button', { name: /入睡困难/ }).first().click();
  await expect(page.getByRole('heading', { name: '入睡困难' })).toBeVisible();

  await page.getByPlaceholder('咨询入睡困难相关问题...').fill('如何改善入睡困难？');
  await page.getByRole('button', { name: '发送' }).click();

  await expect(page.getByText(/根据您的情况/)).toBeVisible();
  await expect(page.getByRole('button', { name: '有用' })).toBeVisible();
  await page.getByRole('button', { name: '返回' }).click();

  // Sleep enhancement: diary, trend, and plan
  await page.getByRole('button', { name: '日记' }).click();
  await expect(page.getByRole('heading', { name: '睡眠日记' })).toBeVisible();
  await page.getByLabel('睡前情绪').fill('平静');
  await page.getByRole('button', { name: '保存睡前记录' }).click();
  await page.getByLabel('入睡时间').fill('23:40');
  await page.getByLabel('起床时间').fill('07:10');
  await page.getByLabel('入睡耗时').fill('35');
  await page.getByRole('button', { name: '保存起床记录' }).click();
  await page.getByRole('button', { name: '趋势' }).click();
  await expect(page.getByRole('heading', { name: '近 7 天' })).toBeVisible();
  await page.getByRole('button', { name: '方案' }).click();
  await expect(page.getByText('推荐方案')).toBeVisible();
});
