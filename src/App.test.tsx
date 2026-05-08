import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { clearAllLocalData } from './storage/localStore';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearAllLocalData();
  });

  it('renders entry page with start button', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: '几分钟内获得个性化睡眠指导' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建睡眠档案' })).toBeInTheDocument();
  });

  it('navigates to profile wizard when start button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '创建睡眠档案' }));

    expect(screen.getByRole('heading', { name: '建立您的睡眠档案' })).toBeInTheDocument();
  });

  it('shows dashboard after completing profile', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '创建睡眠档案' }));
    await user.selectOptions(screen.getByLabelText('年龄段'), '25-34岁');
    await user.type(screen.getByLabelText('通常就寝时间'), '23:00');
    await user.type(screen.getByLabelText('通常起床时间'), '07:00');
    await user.selectOptions(screen.getByLabelText('问题持续时间'), '1-3个月');
    await user.selectOptions(screen.getByLabelText('压力水平'), '中等');
    await user.type(screen.getByLabelText('白天影响'), '疲劳');
    await user.click(screen.getByRole('button', { name: '开始咨询' }));

    expect(screen.getByRole('heading', { name: '睡眠健康助手' })).toBeInTheDocument();
  });

  it('opens scene chat without exposing the default scene prompt', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '创建睡眠档案' }));
    await user.selectOptions(screen.getByLabelText('年龄段'), '25-34岁');
    await user.type(screen.getByLabelText('通常就寝时间'), '23:00');
    await user.type(screen.getByLabelText('通常起床时间'), '07:00');
    await user.selectOptions(screen.getByLabelText('问题持续时间'), '1-3个月');
    await user.selectOptions(screen.getByLabelText('压力水平'), '中等');
    await user.type(screen.getByLabelText('白天影响'), '疲劳');
    await user.click(screen.getByRole('button', { name: '开始咨询' }));

    await user.click(screen.getByRole('button', { name: /入睡困难/ }));

    const input = screen.getByPlaceholderText('咨询入睡困难相关问题...');
    expect(input).toHaveValue('');
    expect(input).not.toHaveValue(expect.stringContaining('你是一位睡眠健康专家'));
  });

  it('clears all local sleep data when resetting from dashboard', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      'sleepProfile',
      JSON.stringify({
        ageRange: '25-34岁',
        bedtime: '23:00',
        wakeTime: '07:00',
        mainConcern: 'hard_to_fall_asleep',
        concernDuration: '1-3个月',
        stressLevel: '中等',
        habits: [],
        daytimeImpact: '疲劳',
        safetySignals: [],
        optionalContext: '',
      }),
    );
    window.localStorage.setItem('chatHistory', JSON.stringify([{ id: 'm1', role: 'user', content: 'test', createdAt: '2026-05-08T00:00:00.000Z' }]));
    window.localStorage.setItem('feedbackEvents', JSON.stringify([{ messageId: 'm1', value: 'useful', createdAt: '2026-05-08T00:00:00.000Z' }]));
    window.localStorage.setItem('assessmentResult', JSON.stringify({
      completedAt: '2026-05-08T00:00:00.000Z',
      isi: { answers: [], score: 0, level: 'none', summary: '无明显失眠。' },
      psqiLite: { answers: [], score: 0, level: 'good', summary: '睡眠质量较好。' },
      riskFlags: [],
    }));
    window.localStorage.setItem('knowledgeCache', JSON.stringify({
      hard_to_fall_asleep: {
        scenario: 'hard_to_fall_asleep',
        generatedAt: '2026-05-08T00:00:00.000Z',
        cards: [],
        disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
      },
    }));

    render(<App />);
    await user.click(screen.getByRole('button', { name: '重置档案' }));

    expect(window.localStorage.getItem('sleepProfile')).toBeNull();
    expect(window.localStorage.getItem('chatHistory')).toBeNull();
    expect(window.localStorage.getItem('feedbackEvents')).toBeNull();
    expect(window.localStorage.getItem('assessmentResult')).toBeNull();
    expect(window.localStorage.getItem('knowledgeCache')).toBeNull();
    expect(screen.getByRole('heading', { name: '建立您的睡眠档案' })).toBeInTheDocument();
  });
});
