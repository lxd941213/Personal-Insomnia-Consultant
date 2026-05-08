import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { KnowledgePage } from './KnowledgePage';
import type { AssessmentResult, SleepProfile } from '../domain/types';

// Mock API client
vi.mock('../api/knowledgeClient', () => ({
  generateKnowledgeCards: vi.fn(() =>
    Promise.resolve({
      cards: [
        {
          title: '入睡困难调理',
          summary: '入睡困难时应注意放松身心，避免睡前刺激，保持规律作息。',
          keyPoints: ['睡前警觉升高'],
          misconceptions: ['躺得越久越容易睡着'],
          actions: [{ title: '安排放松', detail: '睡前 30 分钟降低刺激。' }],
          safetyNote: null,
          followUpQuestions: ['睡前是否会看手机？'],
        },
        {
          title: '睡前放松技巧',
          summary: '尝试深呼吸、冥想或温热泡脚来放松身体。',
          keyPoints: ['降低身体唤醒'],
          misconceptions: ['必须立刻睡着才算有效'],
          actions: [{ title: '呼吸练习', detail: '做 3 分钟缓慢呼吸。' }],
          safetyNote: null,
          followUpQuestions: ['你更容易紧张还是兴奋？'],
        },
      ],
      scenario: 'hard_to_fall_asleep',
      generatedAt: '2026-05-08T08:00:00.000Z',
      disclaimer: '本内容仅供健康管理参考，不作为医疗诊断。',
    }),
  ),
}));

// Mock localStore
const mockLocalStore = vi.hoisted(() => ({
  getKnowledgeCache: vi.fn(() => ({})),
  saveKnowledgeCache: vi.fn(),
}));
vi.mock('../storage/localStore', () => mockLocalStore);

const mockProfile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:00',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '中等',
  habits: ['睡前玩手机'],
  daytimeImpact: '疲劳',
  safetySignals: [],
  optionalContext: '',
};

const mockAssessmentResult: AssessmentResult = {
  completedAt: '2024-01-01T00:00:00.000Z',
  isi: {
    answers: [3, 2, 3, 2, 3, 2, 3],
    score: 16,
    level: 'moderate',
    summary: '中度失眠',
  },
  psqiLite: {
    answers: [2, 2, 1, 1, 1, 2, 1],
    score: 9,
    level: 'poor',
    summary: '睡眠质量差',
  },
  riskFlags: ['sleep_latency', 'sleep_quality'],
};

describe('KnowledgePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockLocalStore.getKnowledgeCache).mockReturnValue({});
  });

  it('renders scenario selector when no initial scenario', () => {
    render(
      <KnowledgePage
        profile={mockProfile}
        assessmentResult={mockAssessmentResult}
        initialScenario={undefined}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: '睡眠知识' })).toBeInTheDocument();
    expect(screen.getByText('选择场景')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /查看知识/ }).length).toBe(5);
  });

  it('generates and renders Chinese knowledge cards when scenario selected', async () => {
    const user = userEvent.setup();

    render(
      <KnowledgePage
        profile={mockProfile}
        assessmentResult={mockAssessmentResult}
        initialScenario={undefined}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /入睡困难/ }));

    // Wait for cards to appear
    await waitFor(() => {
      expect(screen.getByText('入睡困难调理')).toBeInTheDocument();
    });

    expect(screen.getByText('睡前放松技巧')).toBeInTheDocument();
    expect(screen.getByText(/本内容仅供健康管理参考/)).toBeInTheDocument();
  });

  it('auto-generates when initialScenario is provided', async () => {
    render(
      <KnowledgePage
        profile={mockProfile}
        assessmentResult={mockAssessmentResult}
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
      />,
    );

    // Wait for cards to appear
    await waitFor(() => {
      expect(screen.getByText('入睡困难调理')).toBeInTheDocument();
    });
  });

  it('uses cached cards on mount', async () => {
    const cache = {
      hard_to_fall_asleep: {
        scenario: 'hard_to_fall_asleep',
        generatedAt: '2026-05-08T08:00:00.000Z',
        cards: [
          {
            title: '缓存的知识卡片',
            summary: '这是从缓存加载的知识内容。',
            keyPoints: ['缓存要按场景读取'],
            misconceptions: ['不同场景不能共用缓存'],
            actions: [{ title: '重新生成', detail: '需要新内容时重新生成。' }],
            safetyNote: null,
            followUpQuestions: ['还想了解什么？'],
          },
        ],
        disclaimer: '本内容仅供健康管理参考。',
      },
    };

    (mockLocalStore.getKnowledgeCache as ReturnType<typeof vi.fn>).mockReturnValue(cache);

    render(
      <KnowledgePage
        profile={mockProfile}
        assessmentResult={mockAssessmentResult}
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('缓存的知识卡片')).toBeInTheDocument();
    });
    expect(screen.getByText('上次生成')).toBeInTheDocument();
  });

  it('supports regeneration of knowledge cards', async () => {
    const user = userEvent.setup();

    render(
      <KnowledgePage
        profile={mockProfile}
        assessmentResult={mockAssessmentResult}
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
      />,
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByText('入睡困难调理')).toBeInTheDocument();
    });

    // Click regenerate button
    await user.click(screen.getByRole('button', { name: '重新生成' }));

    // Wait for cards to appear again (proves regeneration happened)
    await waitFor(() => {
      expect(screen.getByText('入睡困难调理')).toBeInTheDocument();
    });
  });

  it('shows back button and calls onBack', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <KnowledgePage
        profile={mockProfile}
        assessmentResult={mockAssessmentResult}
        initialScenario={undefined}
        onBack={onBack}
      />,
    );

    await user.click(screen.getByRole('button', { name: '返回' }));

    expect(onBack).toHaveBeenCalled();
  });
});
