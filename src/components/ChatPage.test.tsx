import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatPage } from './ChatPage';
import type { SleepProfile } from '../domain/types';
import { saveScopedChatHistory } from '../storage/localStore';
import { sendChatMessage } from '../api/chatClient';

vi.mock('../api/chatClient', () => ({
  sendChatMessage: vi.fn(async () => ({
    riskLevel: 'normal',
    summary: '建议先固定起床时间。',
    possibleFactors: ['作息不稳定'],
    suggestions: [{ title: '固定起床', detail: '连续一周固定起床。' }],
    nextQuestions: [],
    seekCareNotice: null,
    disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
  })),
}));

const profile: SleepProfile = {
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
};

describe('ChatPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('opens scene chat with empty input while sending hidden scenario context', async () => {
    const user = userEvent.setup();
    render(
      <ChatPage
        profile={profile}
        chatScope="hard_to_fall_asleep"
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('咨询入睡困难相关问题...');
    expect(input).toHaveValue('');
    expect(input).not.toHaveValue(expect.stringContaining('你是一位睡眠健康专家'));

    await user.type(input, '我最近很难入睡');
    await user.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith(expect.objectContaining({
        scenario: 'hard_to_fall_asleep',
        message: '我最近很难入睡',
      }));
    });
  });

  it('renders only the current scene history', () => {
    saveScopedChatHistory('hard_to_fall_asleep', [
      { id: 'h1', role: 'user', content: '入睡困难历史', createdAt: '2026-05-08T00:00:00.000Z' },
    ]);
    saveScopedChatHistory('stress_anxiety', [
      { id: 's1', role: 'user', content: '压力焦虑历史', createdAt: '2026-05-08T00:00:00.000Z' },
    ]);

    render(
      <ChatPage
        profile={profile}
        chatScope="hard_to_fall_asleep"
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText('入睡困难历史')).toBeInTheDocument();
    expect(screen.queryByText('压力焦虑历史')).not.toBeInTheDocument();
  });
});
