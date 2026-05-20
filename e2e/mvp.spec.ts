import { expect, test } from '@playwright/test';

test('user can create profile, complete assessment, generate knowledge cards, and chat', async ({ page }) => {
  await page.route('/api/chat', async (route) => {
    const body = route.request().postDataJSON() as { message?: string } | null;
    if (body?.message?.includes('不想活')) {
      await route.fulfill({
        json: {
          riskLevel: 'high_risk',
          summary: '你的描述包含需要优先关注的安全信号。',
          possibleFactors: ['存在需要专业评估的风险信号'],
          suggestions: [{ title: '优先寻求专业支持', detail: '请立即联系当地急救电话，前往就近急诊或精神心理急诊。' }],
          nextQuestions: [],
          seekCareNotice: '若存在伤害自己或其他急性危险，请立即联系当地急救电话，前往就近急诊或精神心理急诊，并请身边可信任的人陪伴。',
          disclaimer: '本内容仅供健康管理参考，不作为医疗诊断。',
        },
      });
      return;
    }

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
  await page.getByLabel('就寝时间').fill('23:00');
  await page.getByLabel('起床时间').fill('07:00');
  await page.getByLabel('主要睡眠问题').selectOption('hard_to_fall_asleep');
  await page.getByLabel('问题持续时间').selectOption('1-3个月');
  await page.getByLabel('压力水平').selectOption('中等');
  await page.getByLabel('白天影响（选填）').fill('疲劳');
  const startButton = page.getByRole('button', { name: '开始咨询' });
  await startButton.evaluate((button) => {
    button.scrollIntoView({ block: 'center' });
  });
  const startButtonBox = await startButton.boundingBox();
  expect(startButtonBox).not.toBeNull();
  if (!startButtonBox) throw new Error('Start button box is unavailable');
  await page.mouse.click(
    startButtonBox.x + startButtonBox.width / 2,
    startButtonBox.y + startButtonBox.height / 2,
  );

  // Today tab is shown
  await expect(page.getByRole('heading', { name: '首页' })).toBeVisible();

  // Complete assessment and see report before returning.
  await page.getByRole('button', { name: '睡眠自测' }).click();
  for (const group of await page.locator('[data-testid^="rating-row-"]').all()) {
    await group.locator('label').first().click();
  }
  await page.getByRole('button', { name: '生成自测报告' }).click();
  await expect(page.getByRole('heading', { name: '睡眠自测报告' })).toBeVisible();
  await page.getByRole('button', { name: '返回首页' }).click();
  await expect(page.getByRole('heading', { name: '首页' })).toBeVisible();

  // Generate knowledge cards
  await page.getByRole('button', { name: '睡眠知识' }).click();
  await expect(page.getByRole('heading', { name: '睡眠知识' })).toBeVisible();
  await page.getByRole('button', { name: /入睡困难/ }).click();
  await expect(page.getByText('固定起床时间是优先动作')).toBeVisible();
  await expect(page.getByRole('button', { name: '生成 AI 补充参考' })).toBeVisible();

  // Go back to dashboard
  await page.getByRole('button', { name: '返回' }).click();
  await expect(page.getByRole('heading', { name: '首页' })).toBeVisible();

  // Chat with AI
  await page.getByRole('button', { name: /入睡困难/ }).first().click();
  await expect(page.getByRole('heading', { name: '入睡困难' })).toBeVisible();

  await page.getByPlaceholder('咨询入睡困难相关问题...').fill('如何改善入睡困难？');
  await page.getByRole('button', { name: '发送' }).click();

  await expect(page.getByText(/根据您的情况/)).toBeVisible();
  await expect(page.getByRole('button', { name: '有用' })).toBeVisible();
  await page.getByPlaceholder('咨询入睡困难相关问题...').fill('我不想活了，连续很多天睡不着');
  await page.getByRole('button', { name: '发送' }).click();
  await expect(page.getByText('请立即联系当地急救电话，前往就近急诊或精神心理急诊。')).toBeVisible();
  await page.getByRole('button', { name: '返回' }).click();

  // Sleep enhancement: diary, trend, and plan
  await page.getByRole('button', { name: '日记' }).click();
  await expect(page.getByRole('heading', { name: '睡眠日记' })).toBeVisible();
  await page.getByRole('button', { name: '平静' }).click();
  await page.getByRole('button', { name: '保存睡前记录' }).click();
  await page.getByRole('button', { name: /起床记录/ }).click();
  await page.getByLabel('入睡时间').fill('23:40');
  await page.getByLabel('起床时间').fill('07:10');
  await page.getByRole('button', { name: '31-60分钟' }).click();
  await page.getByRole('button', { name: '保存起床记录' }).click();
  await page.getByRole('button', { name: '趋势' }).click();
  await expect(page.getByRole('heading', { name: '睡眠趋势' })).toBeVisible();
  await page.getByRole('button', { name: '方案' }).click();
  await expect(page.getByRole('heading', { name: '助眠方案' })).toBeVisible();
  await page.getByRole('button', { name: '完成今日任务' }).click();
  await page.getByRole('button', { name: '一般' }).first().click();
  await page.getByRole('button', { name: '较好' }).click();
  await page.getByRole('button', { name: '16-30分钟' }).click();
  await page.getByRole('button', { name: '1次' }).click();
  await page.getByLabel('白天精力').fill('还可以');
  await page.getByRole('button', { name: '保存任务反馈' }).click();
  await expect(page.getByText(/已完成 1 个任务/)).toBeVisible();
});

test('urgent Chinese risk message shows deterministic care guidance', async ({ page }) => {
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

  // Open chat via scenario card
  await page.getByRole('button', { name: /入睡困难/ }).first().click();
  await expect(page.getByRole('heading', { name: '入睡困难' })).toBeVisible();

  // Send urgent Chinese risk message
  await page.getByPlaceholder('咨询入睡困难相关问题...').fill('我不想活了，睡不着已经很久了');
  await page.getByRole('button', { name: '发送' }).click();

  // Verify deterministic safety guidance
  await expect(page.getByText('当地急救').first()).toBeVisible();
  await expect(page.getByRole('alert').getByText('本内容仅提供健康管理参考，不作为医疗诊断。')).toBeVisible();
});
