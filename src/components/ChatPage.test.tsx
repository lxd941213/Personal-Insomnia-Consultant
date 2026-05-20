import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatPage } from './ChatPage';
import type { AiResponse, AssessmentResult, SleepProfile } from '../domain/types';
import { buildDiaryEntry, upsertWakeCheckin } from '../domain/sleepDiary';
import { clearAllLocalData, getScopedChatHistory, saveDiaryEntries, saveScopedChatHistory } from '../storage/localStore';
import { sendChatMessage } from '../api/chatClient';

const normalResponse: AiResponse = {
  riskLevel: 'normal',
  summary: '建议先固定起床时间。',
  possibleFactors: ['作息不稳定'],
  suggestions: [{ title: '固定起床', detail: '连续一周固定起床。' }],
  nextQuestions: [],
  seekCareNotice: null,
  disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
};

vi.mock('../api/chatClient', () => ({
  sendChatMessage: vi.fn(async () => normalResponse),
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

const severeAssessment: AssessmentResult = {
  completedAt: '2026-05-10T00:00:00.000Z',
  isi: { answers: [], score: 23, level: 'severe', summary: '重度失眠' },
  psqiLite: { answers: [], score: 12, level: 'poor', summary: '睡眠质量差' },
  riskFlags: [],
};

describe('ChatPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearAllLocalData();
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
        onOpenResetDrawer={vi.fn()}
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
        onOpenResetDrawer={vi.fn()}
      />,
    );

    expect(screen.getByText('入睡困难历史')).toBeInTheDocument();
    expect(screen.queryByText('压力焦虑历史')).not.toBeInTheDocument();
  });

  it('places chat controls directly above the input with clear after regenerate', () => {
    const { container } = render(
      <ChatPage
        profile={profile}
        chatScope="hard_to_fall_asleep"
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
        onOpenResetDrawer={vi.fn()}
      />,
    );

    const controls = screen.getByLabelText('咨询操作');
    const messageList = container.querySelector('.message-list');
    const inputForm = container.querySelector('form.chat-input');
    const labels = Array.from(controls.querySelectorAll('button')).map((button) => button.textContent);

    expect(messageList).not.toBeNull();
    expect(inputForm).not.toBeNull();
    expect(labels).toEqual(['停止回复', '重新回复', '清空记录']);
    expect(messageList!.compareDocumentPosition(controls) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(controls.compareDocumentPosition(inputForm as Element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('passes resolved safety-gated program context to chat API', async () => {
    const user = userEvent.setup();
    render(
      <ChatPage
        profile={profile}
        assessmentResult={severeAssessment}
        onBack={vi.fn()}
        onOpenResetDrawer={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText('咨询您的睡眠问题...'), '为什么今天让我做这个任务？');
    await user.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith(expect.objectContaining({
        programContext: expect.objectContaining({
          currentDay: 1,
          safetyStatus: 'needs_care',
        }),
      }));
    });
  });

  it('passes unified sleep-context safety triage to chat API', async () => {
    const user = userEvent.setup();
    render(
      <ChatPage
        profile={{ ...profile, safetySignals: ['疑似睡眠呼吸暂停'] }}
        onBack={vi.fn()}
        onOpenResetDrawer={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText('咨询您的睡眠问题...'), '我睡觉打鼾很严重');
    await user.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith(expect.objectContaining({
        programContext: expect.objectContaining({
          safetyTriage: expect.objectContaining({
            level: 'needs_care',
            categories: expect.arrayContaining(['sleep_apnea']),
          }),
        }),
      }));
    });
  });

  it('passes the last 7 days diary summary to chat API', async () => {
    const user = userEvent.setup();
    const today = new Date();
    const recent = new Date(today);
    recent.setUTCDate(today.getUTCDate() - 1);
    const old = new Date(today);
    old.setUTCDate(today.getUTCDate() - 9);
    const recentDate = recent.toISOString().slice(0, 10);
    const oldDate = old.toISOString().slice(0, 10);
    saveDiaryEntries([
      upsertWakeCheckin(buildDiaryEntry(recentDate), {
        sleepStart: '01:00',
        wakeTime: '06:00',
        sleepLatencyMinutes: 60,
        awakenings: 3,
        sleepQuality: 2,
        dreamNote: '',
        daytimeFeeling: '疲惫',
        notes: '凌晨醒了几次',
      }),
      upsertWakeCheckin(buildDiaryEntry(oldDate), {
        sleepStart: '23:00',
        wakeTime: '07:00',
        sleepLatencyMinutes: 10,
        awakenings: 0,
        sleepQuality: 5,
        dreamNote: '',
        daytimeFeeling: '精神好',
        notes: '旧记录不应进入摘要',
      }),
    ]);

    render(
      <ChatPage
        profile={profile}
        chatScope="hard_to_fall_asleep"
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
        onOpenResetDrawer={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText('咨询入睡困难相关问题...'), '结合最近情况给我建议');
    await user.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith(expect.objectContaining({
        diarySummary: expect.objectContaining({
          entryCount: 1,
          daysWindow: 7,
          averageSleepDurationMinutes: 300,
          averageSleepLatencyMinutes: 60,
          averageAwakenings: 3,
          averageSleepQuality: 2,
          recentNotes: ['凌晨醒了几次'],
        }),
      }));
    });
  });

  it('clears the current chat scope from the UI and stored context', async () => {
    const user = userEvent.setup();
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
        onOpenResetDrawer={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '清空记录' }));

    expect(screen.queryByText('入睡困难历史')).not.toBeInTheDocument();
    expect(getScopedChatHistory('hard_to_fall_asleep')).toEqual([]);
    expect(getScopedChatHistory('stress_anxiety')).toHaveLength(1);

    await user.type(screen.getByPlaceholderText('咨询入睡困难相关问题...'), '重新开始咨询');
    await user.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        history: [],
        message: '重新开始咨询',
      }));
    });
  });

  it('regenerates from the latest user message without old assistant context', async () => {
    const user = userEvent.setup();
    saveScopedChatHistory('hard_to_fall_asleep', [
      { id: 'u1', role: 'user', content: '第一问', createdAt: '2026-05-08T00:00:00.000Z' },
      { id: 'a1', role: 'assistant', content: '第一答', response: normalResponse, createdAt: '2026-05-08T00:01:00.000Z' },
      { id: 'u2', role: 'user', content: '第二问', createdAt: '2026-05-08T00:02:00.000Z' },
      { id: 'a2', role: 'assistant', content: '第二答旧版本', response: { ...normalResponse, summary: '第二答旧版本' }, createdAt: '2026-05-08T00:03:00.000Z' },
    ]);

    render(
      <ChatPage
        profile={profile}
        chatScope="hard_to_fall_asleep"
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
        onOpenResetDrawer={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '重新回复' }));

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith(expect.objectContaining({
        message: '第二问',
        history: [
          expect.objectContaining({ content: '第一问' }),
          expect.objectContaining({ content: '第一答' }),
        ],
      }));
    });
    expect(sendChatMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      history: expect.arrayContaining([expect.objectContaining({ content: '第二答旧版本' })]),
    }));
  });

  it('stops an in-flight reply and keeps only the user message', async () => {
    const user = userEvent.setup();
    vi.mocked(sendChatMessage).mockImplementationOnce(({ signal }) => new Promise((_, reject) => {
      signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }));

    render(
      <ChatPage
        profile={profile}
        chatScope="hard_to_fall_asleep"
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
        onOpenResetDrawer={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText('咨询入睡困难相关问题...'), '这次先停止');
    await user.click(screen.getByRole('button', { name: '发送' }));
    await user.click(screen.getByRole('button', { name: '停止回复' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '发送' })).toBeEnabled();
    });
    expect(screen.getByText('这次先停止')).toBeInTheDocument();
    expect(screen.queryByText('建议先固定起床时间。')).not.toBeInTheDocument();
    expect(getScopedChatHistory('hard_to_fall_asleep')).toEqual([
      expect.objectContaining({ role: 'user', content: '这次先停止' }),
    ]);
  });
});
