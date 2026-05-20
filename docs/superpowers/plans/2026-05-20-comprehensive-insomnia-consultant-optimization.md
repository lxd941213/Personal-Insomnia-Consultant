# Comprehensive Insomnia Consultant Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the local-first insomnia consultant loop by strengthening China-mainland safety triage, adding 14-day task feedback, fixing diary reliability, connecting home/trends/chat context, and restoring full verification.

**Architecture:** Keep the current React/Vite/TypeScript app split into domain logic, local storage, UI components, and Serverless-compatible API logic. Put deterministic safety, program, diary, and trend behavior in `src/domain/*`; keep components thin; keep the API as the final safety gate before provider calls.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest, React Testing Library, Playwright, browser `localStorage`, Vercel-style serverless API modules.

---

## File Structure

- Modify `src/domain/types.ts`: add structured safety triage types.
- Modify `src/domain/safety.ts`: replace boolean-only high-risk detection with shared structured triage while preserving `detectHighRiskSignal` compatibility.
- Modify `src/domain/safety.test.ts`: cover Chinese mainland high-risk and needs-care examples.
- Modify `src/domain/personalization.ts`: consume safety triage categories instead of duplicating all high-risk text matching where practical.
- Modify `src/domain/program.ts`: add `buildDailyTaskLog`, `upsertDailyTaskLog`, and use safety triage for care-first program states.
- Modify `src/domain/program.test.ts`: cover task log upsert and safety-aware program status.
- Modify `src/domain/sleepDiary.ts`: add wake-check validation and selected-entry helper behavior.
- Modify `src/domain/sleepDiary.test.ts`: cover valid/invalid wake records and date-specific updates.
- Modify `src/domain/trends.ts`: include record-quality and program fallback insight helpers.
- Modify `src/domain/trends.test.ts`: cover sparse, sufficient, and invalid diary data.
- Modify `src/storage/localStore.ts`: keep existing `dailyTaskLogs` storage; add no new storage keys unless a task proves one is needed.
- Modify `api/chatLogic.ts`: run structured triage before provider calls and pass safety context into prompts.
- Modify `api/prompt.ts`: include safety status in prompt context without allowing it to override deterministic triage.
- Modify `api/chat.test.ts` and `api/prompt.test.ts`: verify Chinese high-risk short-circuit and prompt boundaries.
- Modify `src/components/PlansPage.tsx`: add current-task feedback UI and local log saving.
- Modify `src/components/PlansPage.test.tsx`: test completed/skipped flows.
- Modify `src/components/DiaryPage.tsx`: reload form state on date changes and validate wake records.
- Modify `src/components/DiaryPage.test.tsx`: test date switching and validation.
- Modify `src/components/TodayPage.tsx`: show a lightweight current task entry.
- Modify `src/components/TodayPage.test.tsx`: test current task entry.
- Modify `src/components/TrendsPage.tsx`: render record-quality and task-feedback insights.
- Modify `src/components/TrendsPage.test.tsx`: test sparse, sufficient, and fallback-needed states.
- Modify `src/components/ChatPage.tsx`: ensure latest diary/program/safety context is sent.
- Modify `src/components/ChatPage.test.tsx`: test API payload context.
- Modify `src/styles.css`: add scoped styles for task feedback, safety/care states, and icon fallbacks.
- Modify `index.html`: make font and icon loading non-blocking or removable without layout breakage.
- Modify `e2e/app.spec.ts` and `e2e/mvp.spec.ts`: update selectors and add full-loop coverage.
- Modify `README.md` and `docs_cn/使用文档.md`: document optimized scope and safety behavior.

## Task 1: Structured China-Mainland Safety Triage

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/safety.ts`
- Test: `src/domain/safety.test.ts`

- [ ] **Step 1: Write failing tests for structured safety triage**

Replace `src/domain/safety.test.ts` with tests shaped like this, preserving the existing ordinary-risk case:

```ts
import { describe, expect, it } from 'vitest';
import { detectHighRiskSignal, triageSafety } from './safety';
import type { SleepProfile } from './types';

const baseProfile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:30',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '中等',
  habits: [],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

describe('triageSafety', () => {
  it('marks Chinese self-harm language as urgent and blocks AI', () => {
    const result = triageSafety({ message: '我睡不着，真的不想活了', profile: baseProfile });

    expect(result.level).toBe('urgent');
    expect(result.shouldBlockAi).toBe(true);
    expect(result.categories).toContain('self_harm');
    expect(result.careNotice).toContain('当地急救');
    expect(result.careNotice).not.toContain('988');
  });

  it('marks chest pain and breathing difficulty as urgent', () => {
    const result = triageSafety({ message: '半夜胸口痛，呼吸困难，睡不着', profile: baseProfile });

    expect(result.level).toBe('urgent');
    expect(result.shouldBlockAi).toBe(true);
    expect(result.categories).toContain('chest_pain_or_breathing');
  });

  it('marks suspected sleep apnea with daytime impairment as urgent', () => {
    const result = triageSafety({
      message: '我睡觉总是憋醒，打鼾很严重，白天困到无法工作',
      profile: baseProfile,
    });

    expect(result.level).toBe('urgent');
    expect(result.shouldBlockAi).toBe(true);
    expect(result.categories).toContain('sleep_apnea');
  });

  it('marks suspected sleep apnea profile signal as needs care', () => {
    const result = triageSafety({
      profile: { ...baseProfile, safetySignals: ['疑似睡眠呼吸暂停'] },
    });

    expect(result.level).toBe('needs_care');
    expect(result.shouldBlockAi).toBe(false);
    expect(result.categories).toContain('sleep_apnea');
  });

  it('keeps ordinary sleep trouble normal', () => {
    const result = triageSafety({
      message: '我刷手机到凌晨一点，想早点睡',
      profile: baseProfile,
    });

    expect(result.level).toBe('normal');
    expect(result.shouldBlockAi).toBe(false);
    expect(result.categories).toEqual([]);
    expect(detectHighRiskSignal('我刷手机到凌晨一点，想早点睡')).toBe(false);
  });

  it('keeps detectHighRiskSignal compatible for old callers', () => {
    expect(detectHighRiskSignal('我想轻生')).toBe(true);
    expect(detectHighRiskSignal('I want to hurt myself')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/safety.test.ts`

Expected: FAIL because `triageSafety` and safety triage types do not exist yet.

- [ ] **Step 3: Add safety triage types**

In `src/domain/types.ts`, add these exports near the existing risk-related types:

```ts
export type SafetyTriageLevel = 'normal' | 'needs_care' | 'urgent';

export type SafetyTriageCategory =
  | 'self_harm'
  | 'sleep_apnea'
  | 'chest_pain_or_breathing'
  | 'medication_or_alcohol_dependence'
  | 'pregnancy_or_postpartum'
  | 'severe_insomnia_impairment'
  | 'major_medical_condition';

export interface SafetyTriageResult {
  level: SafetyTriageLevel;
  reasons: string[];
  categories: SafetyTriageCategory[];
  shouldBlockAi: boolean;
  careNotice: string | null;
}

export interface SafetyTriageInput {
  profile?: SleepProfile | null;
  message?: string;
  assessmentResult?: AssessmentResult | null;
  diaryNotes?: string[];
}
```

- [ ] **Step 4: Implement minimal structured triage**

Replace `src/domain/safety.ts` with a structured implementation that keeps the old exports:

```ts
import type { SafetyTriageCategory, SafetyTriageInput, SafetyTriageResult } from './types';

type Rule = {
  category: SafetyTriageCategory;
  reason: string;
  urgent: RegExp[];
  needsCare: RegExp[];
};

const urgentCareNotice =
  '你的描述包含可能需要立即专业支持的信号。若存在伤害自己、胸痛、呼吸困难或其他急性危险，请立即联系当地急救电话，前往就近急诊或精神心理急诊，并请身边可信任的人陪伴。';

const needsCareNotice =
  '你的情况可能需要专业评估。建议联系当地心理援助或危机干预热线、睡眠门诊、呼吸科、心内科、精神心理科、产科或其他相关科室，根据症状选择合适帮助。';

export const defaultCareNotice = needsCareNotice;

export const defaultDisclaimer =
  '本内容仅提供健康管理参考，不作为医疗诊断。';

const rules: Rule[] = [
  {
    category: 'self_harm',
    reason: '存在自伤或轻生相关表达',
    urgent: [/轻生|不想活|想死|自杀|伤害自己|结束生命|hurt myself|kill myself|suicide|self[- ]?harm/i],
    needsCare: [],
  },
  {
    category: 'chest_pain_or_breathing',
    reason: '存在胸痛、胸闷或呼吸困难信号',
    urgent: [/胸痛|胸口痛|胸闷|呼吸困难|喘不上气|chest pain|shortness of breath/i],
    needsCare: [],
  },
  {
    category: 'sleep_apnea',
    reason: '存在疑似睡眠呼吸暂停或憋醒信号',
    urgent: [/憋醒.*(无法|白天|困|头痛|工作|学习)|呼吸暂停.*(白天|困|无法|头痛)|stop breathing|gasping/i],
    needsCare: [/憋醒|呼吸暂停|睡觉喘不上气|打鼾很严重|鼾声很大|疑似睡眠呼吸暂停|apnea/i],
  },
  {
    category: 'medication_or_alcohol_dependence',
    reason: '存在助眠药物、镇静药或酒精依赖信号',
    urgent: [/每天.*(安眠药|助眠药|镇静药)|每晚.*(靠药|吃药|喝酒)|长期.*(安眠药|助眠药)|靠酒才能睡|sleeping pills every night/i],
    needsCare: [/长期使用助眠药|药物依赖|正在服用其他药物|夜间饮酒/i],
  },
  {
    category: 'pregnancy_or_postpartum',
    reason: '孕期或产后睡眠问题需要专业评估',
    urgent: [/孕期.*严重.*睡不着|产后.*严重.*失眠|pregnant|postpartum/i],
    needsCare: [/孕期|产后|孕期或产后/i],
  },
  {
    category: 'severe_insomnia_impairment',
    reason: '严重失眠伴明显日间功能损害',
    urgent: [/无法工作|无法学习|无法生活|撑不住|cannot function/i],
    needsCare: [/白天.*(严重|明显).*(影响|疲惫|困)|慢性失眠|3个月以上/i],
  },
  {
    category: 'major_medical_condition',
    reason: '存在重大基础疾病或慢性病相关信号',
    urgent: [],
    needsCare: [/重大基础疾病|慢性病|疼痛/i],
  },
];

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function collectText(input: SafetyTriageInput): string {
  const profile = input.profile;
  return [
    input.message ?? '',
    profile?.daytimeImpact ?? '',
    profile?.optionalContext ?? '',
    ...(profile?.safetySignals ?? []),
    ...(profile?.medicalConditions ?? []),
    ...(profile?.medicationStatus ?? []),
    ...(input.diaryNotes ?? []),
  ].join(' ');
}

export function triageSafety(input: SafetyTriageInput): SafetyTriageResult {
  const text = collectText(input);
  const categories: SafetyTriageCategory[] = [];
  const reasons: string[] = [];
  let urgent = false;

  for (const rule of rules) {
    const urgentMatch = rule.urgent.some((pattern) => pattern.test(text));
    const needsCareMatch = rule.needsCare.some((pattern) => pattern.test(text));
    if (urgentMatch || needsCareMatch) {
      categories.push(rule.category);
      reasons.push(rule.reason);
    }
    if (urgentMatch) urgent = true;
  }

  if (input.assessmentResult?.isi.level === 'severe' && /无法|工作|学习|生活|白天|疲惫|困/.test(text)) {
    categories.push('severe_insomnia_impairment');
    reasons.push('重度失眠伴明显日间影响');
    urgent = true;
  }

  const finalCategories = unique(categories);
  const finalReasons = unique(reasons);
  const level = urgent ? 'urgent' : finalCategories.length > 0 ? 'needs_care' : 'normal';

  return {
    level,
    reasons: finalReasons,
    categories: finalCategories,
    shouldBlockAi: level === 'urgent',
    careNotice: level === 'urgent' ? urgentCareNotice : level === 'needs_care' ? needsCareNotice : null,
  };
}

export function detectHighRiskSignal(text: string): boolean {
  return triageSafety({ message: text }).shouldBlockAi;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/domain/safety.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/safety.ts src/domain/safety.test.ts
git commit -m "feat: add structured safety triage"
```

## Task 2: Program Task Log Helpers and Safety-Aware Program State

**Files:**
- Modify: `src/domain/program.ts`
- Test: `src/domain/program.test.ts`
- Modify: `src/domain/personalization.ts` only if tests show duplicated safety logic conflicts with structured triage.

- [ ] **Step 1: Add failing program log tests**

Append these cases to `src/domain/program.test.ts`:

```ts
import { buildDailyTaskLog, upsertDailyTaskLog } from './program';

it('builds a daily task log from task feedback', () => {
  const log = buildDailyTaskLog({
    programId: 'program-2026-05-20',
    day: 2,
    date: '2026-05-21',
    status: 'completed',
    difficulty: 'easy',
    sleepQuality: 4,
    sleepLatencyMinutes: 25,
    awakenings: 1,
    daytimeEnergy: '精神不错',
    note: '手机放远了',
    now: new Date('2026-05-21T08:00:00.000Z'),
  });

  expect(log).toMatchObject({
    id: 'task-log-program-2026-05-20-2',
    programId: 'program-2026-05-20',
    day: 2,
    date: '2026-05-21',
    status: 'completed',
    difficulty: 'easy',
    sleepQuality: 4,
    sleepLatencyMinutes: 25,
    awakenings: 1,
    daytimeEnergy: '精神不错',
    note: '手机放远了',
    version: 1,
  });
});

it('upserts daily task logs by program and day without double counting', () => {
  const first = buildDailyTaskLog({
    programId: 'program-1',
    day: 1,
    date: '2026-05-20',
    status: 'completed',
    difficulty: 'ok',
    sleepQuality: 3,
    sleepLatencyMinutes: 45,
    awakenings: 2,
    daytimeEnergy: '一般',
    note: '',
    now: new Date('2026-05-20T08:00:00.000Z'),
  });
  const second = buildDailyTaskLog({
    programId: 'program-1',
    day: 1,
    date: '2026-05-20',
    status: 'skipped',
    difficulty: 'hard',
    sleepQuality: null,
    sleepLatencyMinutes: null,
    awakenings: null,
    daytimeEnergy: '疲惫',
    note: '太晚了',
    now: new Date('2026-05-20T21:00:00.000Z'),
  });

  const logs = upsertDailyTaskLog([first], second);

  expect(logs).toHaveLength(1);
  expect(logs[0]).toMatchObject({
    status: 'skipped',
    difficulty: 'hard',
    note: '太晚了',
    version: 2,
  });
  expect(buildProgramStats(logs)).toMatchObject({
    completedCount: 0,
    skippedCount: 1,
    completionRate: 0,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/program.test.ts`

Expected: FAIL because `buildDailyTaskLog` and `upsertDailyTaskLog` do not exist.

- [ ] **Step 3: Implement log helpers**

Add this input interface and exports to `src/domain/program.ts`:

```ts
interface BuildDailyTaskLogInput {
  programId: string;
  day: number;
  date: string;
  status: DailyTaskLog['status'];
  difficulty: DailyTaskLog['difficulty'];
  sleepQuality: number | null;
  sleepLatencyMinutes: number | null;
  awakenings: number | null;
  daytimeEnergy: string;
  note: string;
  now?: Date;
}

export function buildDailyTaskLog(input: BuildDailyTaskLogInput): DailyTaskLog {
  const iso = nowIso(input.now);
  return {
    id: `task-log-${input.programId}-${input.day}`,
    programId: input.programId,
    day: input.day,
    date: input.date,
    status: input.status,
    difficulty: input.difficulty,
    sleepQuality: input.sleepQuality,
    sleepLatencyMinutes: input.sleepLatencyMinutes,
    awakenings: input.awakenings,
    daytimeEnergy: input.daytimeEnergy,
    note: input.note,
    createdAt: iso,
    updatedAt: iso,
    version: 1,
  };
}

export function upsertDailyTaskLog(logs: DailyTaskLog[], next: DailyTaskLog): DailyTaskLog[] {
  const previous = logs.find((entry) => entry.programId === next.programId && entry.day === next.day);
  const merged = previous
    ? { ...next, id: previous.id, createdAt: previous.createdAt, version: previous.version + 1 }
    : next;
  return [
    ...logs.filter((entry) => !(entry.programId === next.programId && entry.day === next.day)),
    merged,
  ].sort((a, b) => a.day - b.day || a.updatedAt.localeCompare(b.updatedAt));
}
```

- [ ] **Step 4: Route program status through safety triage**

In `src/domain/program.ts`, import `triageSafety` and update `safetyReasons` / `statusFromSafety` so care-first states use shared rules:

```ts
import { triageSafety } from './safety';
```

Inside `safetyReasons`, combine the triage reasons with the existing severe-ISI fallback:

```ts
function safetyReasons(input: ProgramInput): string[] {
  const triage = triageSafety({
    profile: input.profile,
    assessmentResult: input.assessmentResult,
  });
  const reasons = [...triage.reasons];
  if (input.assessmentResult?.isi.level === 'severe') {
    reasons.push('失眠严重程度为重度');
  }
  return unique(reasons);
}
```

- [ ] **Step 5: Run program tests**

Run: `npm test -- src/domain/program.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/program.ts src/domain/program.test.ts src/domain/personalization.ts
git commit -m "feat: add daily task log helpers"
```

If `src/domain/personalization.ts` was not changed, omit it from `git add`.

## Task 3: Plans Page Task Feedback Flow

**Files:**
- Modify: `src/components/PlansPage.tsx`
- Modify: `src/components/PlansPage.test.tsx`
- Modify: `src/storage/localStore.ts` only if existing `saveDailyTaskLogs` cannot be used directly.
- Modify: `src/styles.css`

- [ ] **Step 1: Extend storage mock and write failing feedback tests**

Update the mock in `src/components/PlansPage.test.tsx` so it exports `saveDailyTaskLogs`:

```ts
const saveDailyTaskLogsMock = vi.hoisted(() => vi.fn((logs: DailyTaskLog[]) => {
  storageMock.dailyTaskLogs = logs;
}));

vi.mock('../storage/localStore', () => ({
  getDiaryEntries: (): SleepDiaryEntry[] => storageMock.diaryEntries,
  getSleepProgram: vi.fn(() => null),
  getDailyTaskLogs: vi.fn(() => storageMock.dailyTaskLogs),
  saveSleepProgram: vi.fn(),
  saveDailyTaskLogs: saveDailyTaskLogsMock,
}));
```

Add this test:

```ts
it('saves completed feedback for today task and updates progress', async () => {
  const user = userEvent.setup();
  render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

  await user.click(screen.getByRole('button', { name: '完成今日任务' }));
  await user.click(screen.getByRole('button', { name: '较容易' }));
  await user.click(screen.getByRole('button', { name: '较好' }));
  await user.click(screen.getByRole('button', { name: '16-30分钟' }));
  await user.click(screen.getByRole('button', { name: '1次' }));
  await user.type(screen.getByLabelText('白天精力'), '精神不错');
  await user.type(screen.getByLabelText('任务备注'), '完成了替代动作');
  await user.click(screen.getByRole('button', { name: '保存任务反馈' }));

  expect(saveDailyTaskLogsMock).toHaveBeenCalled();
  expect(storageMock.dailyTaskLogs[0]).toMatchObject({
    day: 1,
    status: 'completed',
    difficulty: 'easy',
    sleepQuality: 4,
    sleepLatencyMinutes: 25,
    awakenings: 1,
    daytimeEnergy: '精神不错',
    note: '完成了替代动作',
  });
  expect(screen.getByText(/已完成 1 个任务/)).toBeInTheDocument();
});

it('saves skipped feedback for today task', async () => {
  const user = userEvent.setup();
  render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

  await user.click(screen.getByRole('button', { name: '跳过今日任务' }));
  await user.click(screen.getByRole('button', { name: '较难' }));
  await user.type(screen.getByLabelText('任务备注'), '今天加班太晚');
  await user.click(screen.getByRole('button', { name: '保存任务反馈' }));

  expect(storageMock.dailyTaskLogs[0]).toMatchObject({
    day: 1,
    status: 'skipped',
    difficulty: 'hard',
    note: '今天加班太晚',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/PlansPage.test.tsx`

Expected: FAIL because feedback actions and form controls do not exist.

- [ ] **Step 3: Implement local feedback form state**

In `src/components/PlansPage.tsx`, import task log helpers and storage save:

```ts
import { buildDailyTaskLog, createSleepProgram, resolveProgramState, upsertDailyTaskLog } from '../domain/program';
import { getDailyTaskLogs, getDiaryEntries, getSleepProgram, saveDailyTaskLogs, saveSleepProgram } from '../storage/localStore';
```

Add local state in `PlansPage`:

```ts
const [taskLogs, setTaskLogs] = useState(() => getDailyTaskLogs());
const [feedbackStatus, setFeedbackStatus] = useState<'completed' | 'skipped' | null>(null);
const [feedbackDifficulty, setFeedbackDifficulty] = useState<DailyTaskLog['difficulty']>(null);
const [feedbackSleepQuality, setFeedbackSleepQuality] = useState<number | null>(null);
const [feedbackLatency, setFeedbackLatency] = useState<number | null>(null);
const [feedbackAwakenings, setFeedbackAwakenings] = useState<number | null>(null);
const [feedbackEnergy, setFeedbackEnergy] = useState('');
const [feedbackNote, setFeedbackNote] = useState('');
const [feedbackError, setFeedbackError] = useState('');
```

Use `taskLogs` instead of `getDailyTaskLogs()` when resolving program state.

- [ ] **Step 4: Add feedback controls to current task section**

Extend `ProgramOverview` props to accept:

```ts
onStartFeedback: (status: 'completed' | 'skipped') => void;
```

Render the buttons under today's task when status is `active`:

```tsx
<div className="task-feedback-actions">
  <button type="button" className="primary-button" onClick={() => onStartFeedback('completed')}>
    完成今日任务
  </button>
  <button type="button" className="action-btn" onClick={() => onStartFeedback('skipped')}>
    跳过今日任务
  </button>
</div>
```

- [ ] **Step 5: Add feedback form component locally**

Add a local `TaskFeedbackForm` in `PlansPage.tsx` with buttons named exactly as the tests expect:

```tsx
function TaskFeedbackForm({
  status,
  difficulty,
  sleepQuality,
  latency,
  awakenings,
  energy,
  note,
  error,
  onDifficulty,
  onSleepQuality,
  onLatency,
  onAwakenings,
  onEnergy,
  onNote,
  onCancel,
  onSave,
}: {
  status: 'completed' | 'skipped';
  difficulty: DailyTaskLog['difficulty'];
  sleepQuality: number | null;
  latency: number | null;
  awakenings: number | null;
  energy: string;
  note: string;
  error: string;
  onDifficulty: (value: DailyTaskLog['difficulty']) => void;
  onSleepQuality: (value: number | null) => void;
  onLatency: (value: number | null) => void;
  onAwakenings: (value: number | null) => void;
  onEnergy: (value: string) => void;
  onNote: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <section className="task-feedback-panel" aria-label="今日任务反馈">
      <h2>{status === 'completed' ? '完成反馈' : '跳过反馈'}</h2>
      <div className="feedback-choice-row">
        <button type="button" className={difficulty === 'easy' ? 'selected' : ''} onClick={() => onDifficulty('easy')}>较容易</button>
        <button type="button" className={difficulty === 'ok' ? 'selected' : ''} onClick={() => onDifficulty('ok')}>一般</button>
        <button type="button" className={difficulty === 'hard' ? 'selected' : ''} onClick={() => onDifficulty('hard')}>较难</button>
      </div>
      <div className="feedback-choice-row">
        <button type="button" className={sleepQuality === 4 ? 'selected' : ''} onClick={() => onSleepQuality(4)}>较好</button>
        <button type="button" className={sleepQuality === 3 ? 'selected' : ''} onClick={() => onSleepQuality(3)}>一般</button>
        <button type="button" className={sleepQuality === 2 ? 'selected' : ''} onClick={() => onSleepQuality(2)}>较差</button>
      </div>
      <div className="feedback-choice-row">
        <button type="button" className={latency === 25 ? 'selected' : ''} onClick={() => onLatency(25)}>16-30分钟</button>
        <button type="button" className={latency === 45 ? 'selected' : ''} onClick={() => onLatency(45)}>31-60分钟</button>
        <button type="button" className={latency === 75 ? 'selected' : ''} onClick={() => onLatency(75)}>60分钟以上</button>
      </div>
      <div className="feedback-choice-row">
        <button type="button" className={awakenings === 0 ? 'selected' : ''} onClick={() => onAwakenings(0)}>0次</button>
        <button type="button" className={awakenings === 1 ? 'selected' : ''} onClick={() => onAwakenings(1)}>1次</button>
        <button type="button" className={awakenings === 2 ? 'selected' : ''} onClick={() => onAwakenings(2)}>2次</button>
      </div>
      <label className="diary-text-field">
        白天精力
        <input value={energy} onChange={(event) => onEnergy(event.target.value)} />
      </label>
      <label className="diary-text-field">
        任务备注
        <textarea value={note} onChange={(event) => onNote(event.target.value)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="task-feedback-actions">
        <button type="button" className="primary-button" onClick={onSave}>保存任务反馈</button>
        <button type="button" className="action-btn" onClick={onCancel}>取消</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Save feedback**

Add `saveTaskFeedback` inside `PlansPage`:

```ts
function saveTaskFeedback() {
  if (!feedbackStatus) return;
  if (!feedbackDifficulty) {
    setFeedbackError('请选择任务难度');
    return;
  }
  const todayTask = programState.tasks.find((task) => task.day === programState.program.currentDay) ?? programState.tasks[0];
  const nextLog = buildDailyTaskLog({
    programId: programState.program.id,
    day: todayTask.day,
    date: new Date().toISOString().slice(0, 10),
    status: feedbackStatus,
    difficulty: feedbackDifficulty,
    sleepQuality: feedbackSleepQuality,
    sleepLatencyMinutes: feedbackLatency,
    awakenings: feedbackAwakenings,
    daytimeEnergy: feedbackEnergy,
    note: feedbackNote,
  });
  const nextLogs = upsertDailyTaskLog(taskLogs, nextLog);
  setTaskLogs(nextLogs);
  saveDailyTaskLogs(nextLogs);
  setFeedbackStatus(null);
  setFeedbackError('');
}
```

- [ ] **Step 7: Add scoped CSS**

In `src/styles.css`, add:

```css
.task-feedback-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.task-feedback-panel {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid rgba(201, 184, 122, 0.24);
  border-radius: 8px;
  background: rgba(13, 15, 28, 0.78);
}

.feedback-choice-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}

.feedback-choice-row button.selected {
  border-color: var(--moonbeam);
  color: var(--moonbeam);
  background: rgba(201, 184, 122, 0.12);
}
```

- [ ] **Step 8: Run tests**

Run: `npm test -- src/components/PlansPage.test.tsx src/domain/program.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/PlansPage.tsx src/components/PlansPage.test.tsx src/styles.css src/storage/localStore.ts
git commit -m "feat: add plan task feedback flow"
```

Omit `src/storage/localStore.ts` if unchanged.

## Task 4: Diary Date Reload and Wake Validation

**Files:**
- Modify: `src/domain/sleepDiary.ts`
- Modify: `src/domain/sleepDiary.test.ts`
- Modify: `src/components/DiaryPage.tsx`
- Modify: `src/components/DiaryPage.test.tsx`

- [ ] **Step 1: Add failing domain validation tests**

Append to `src/domain/sleepDiary.test.ts`:

```ts
import { validateWakeCheckin } from './sleepDiary';

it('validates complete wake checkin values', () => {
  expect(validateWakeCheckin({
    sleepStart: '23:30',
    wakeTime: '07:00',
    sleepLatencyMinutes: 25,
    awakenings: 1,
    sleepQuality: 4,
    dreamNote: '',
    daytimeFeeling: '还可以',
    notes: '',
  })).toEqual([]);
});

it('rejects missing or out-of-range wake checkin values', () => {
  expect(validateWakeCheckin({
    sleepStart: '',
    wakeTime: '07:00',
    sleepLatencyMinutes: -1,
    awakenings: -1,
    sleepQuality: 8,
    dreamNote: '',
    daytimeFeeling: '',
    notes: '',
  })).toEqual([
    '请填写入睡时间',
    '入睡耗时需在 0-300 分钟之间',
    '夜醒次数需在 0-20 次之间',
    '睡眠质量需在 1-5 之间',
  ]);
});
```

- [ ] **Step 2: Add failing component date-switch test**

Append to `src/components/DiaryPage.test.tsx`:

```ts
it('reloads form values when switching between dates', async () => {
  const user = userEvent.setup();
  render(<DiaryPage selectedDate="2026-05-20" />);

  await user.click(screen.getByRole('button', { name: '紧张' }));
  await user.type(screen.getByLabelText('睡前备注'), '第一天');
  await user.click(screen.getByRole('button', { name: '保存睡前记录' }));

  await user.click(screen.getByRole('button', { name: /19/ }));
  expect(screen.getByLabelText('睡前备注')).toHaveValue('');

  await user.type(screen.getByLabelText('睡前备注'), '第二天');
  await user.click(screen.getByRole('button', { name: '保存睡前记录' }));

  const entries = getDiaryEntries();
  expect(entries.find((entry) => entry.date === '2026-05-20')?.bedtimeCheckin?.notes).toBe('第一天');
  expect(entries.find((entry) => entry.date === '2026-05-19')?.bedtimeCheckin?.notes).toBe('第二天');
});

it('shows validation error and does not save invalid wake checkin', async () => {
  const user = userEvent.setup();
  render(<DiaryPage selectedDate="2026-05-20" />);

  await user.click(screen.getByRole('button', { name: /起床记录/ }));
  await user.click(screen.getByRole('button', { name: '保存起床记录' }));

  expect(screen.getByRole('alert')).toHaveTextContent('请填写入睡时间');
  expect(getDiaryEntries()).toHaveLength(0);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/domain/sleepDiary.test.ts src/components/DiaryPage.test.tsx`

Expected: FAIL because validation and date reload behavior are missing.

- [ ] **Step 4: Implement wake validation**

Add to `src/domain/sleepDiary.ts`:

```ts
export function validateWakeCheckin(wakeCheckin: WakeCheckin): string[] {
  const errors: string[] = [];
  if (!wakeCheckin.sleepStart) errors.push('请填写入睡时间');
  if (!wakeCheckin.wakeTime) errors.push('请填写起床时间');
  if (wakeCheckin.sleepLatencyMinutes < 0 || wakeCheckin.sleepLatencyMinutes > 300) {
    errors.push('入睡耗时需在 0-300 分钟之间');
  }
  if (wakeCheckin.awakenings < 0 || wakeCheckin.awakenings > 20) {
    errors.push('夜醒次数需在 0-20 次之间');
  }
  if (wakeCheckin.sleepQuality < 1 || wakeCheckin.sleepQuality > 5) {
    errors.push('睡眠质量需在 1-5 之间');
  }
  return errors;
}
```

- [ ] **Step 5: Reload form state on date change**

In `DiaryPage.tsx`, import `useEffect` and `validateWakeCheckin`. Add:

```ts
useEffect(() => {
  const next = entries.find((entry) => entry.date === activeDate) ?? buildDiaryEntry(activeDate);
  setMood(next.bedtimeCheckin?.mood ?? '');
  setStressLevel(String(next.bedtimeCheckin?.stressLevel ?? 3));
  setFactors(next.bedtimeCheckin?.factors ?? []);
  setPlannedActions(next.bedtimeCheckin?.plannedActions ?? []);
  setBedtimeNotes(next.bedtimeCheckin?.notes ?? '');
  setSleepStart(next.wakeCheckin?.sleepStart ?? '');
  setWakeTime(next.wakeCheckin?.wakeTime ?? '');
  setSleepLatencyMinutes(String(next.wakeCheckin?.sleepLatencyMinutes ?? ''));
  setAwakenings(String(next.wakeCheckin?.awakenings ?? 0));
  setSleepQuality(String(next.wakeCheckin?.sleepQuality ?? 3));
  setDreamNote(next.wakeCheckin?.dreamNote ?? '');
  setDaytimeFeeling(next.wakeCheckin?.daytimeFeeling ?? '');
  setWakeNotes(next.wakeCheckin?.notes ?? '');
  setError('');
}, [activeDate, entries]);
```

Add `const [error, setError] = useState('');` and render `{error && <p className="error" role="alert">{error}</p>}` before the toast.

- [ ] **Step 6: Validate before saving wake checkin**

Update `saveWake`:

```ts
function saveWake() {
  const wakeCheckin = {
    sleepStart,
    wakeTime,
    sleepLatencyMinutes: Number(sleepLatencyMinutes || 0),
    awakenings: Number(awakenings || 0),
    sleepQuality: Number(sleepQuality || 0),
    dreamNote,
    daytimeFeeling,
    notes: wakeNotes,
  };
  const errors = validateWakeCheckin(wakeCheckin);
  if (errors.length > 0) {
    setError(errors.join('；'));
    return;
  }
  setError('');
  saveEntry(upsertWakeCheckin(current, wakeCheckin));
}
```

- [ ] **Step 7: Run tests**

Run: `npm test -- src/domain/sleepDiary.test.ts src/components/DiaryPage.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/domain/sleepDiary.ts src/domain/sleepDiary.test.ts src/components/DiaryPage.tsx src/components/DiaryPage.test.tsx
git commit -m "fix: keep diary entries date scoped"
```

## Task 5: Home and Trends Feedback Loop

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TodayPage.tsx`
- Modify: `src/components/TodayPage.test.tsx`
- Modify: `src/components/TrendsPage.tsx`
- Modify: `src/components/TrendsPage.test.tsx`
- Modify: `src/domain/trends.ts`
- Modify: `src/domain/trends.test.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Add trend domain tests**

Append to `src/domain/trends.test.ts`:

```ts
it('marks trends as sparse when fewer than three wake records exist', () => {
  const summary = buildTrendSummary([], '2026-05-20');

  expect(summary.recordQuality).toBe('sparse');
  expect(summary.insights[0]).toContain('还没有足够');
});

it('adds fallback insight when recent task logs are hard or skipped', () => {
  const summary = buildTaskExecutionInsight([
    { day: 1, status: 'skipped', difficulty: 'hard' },
    { day: 2, status: 'completed', difficulty: 'hard' },
    { day: 3, status: 'skipped', difficulty: 'hard' },
  ]);

  expect(summary).toContain('替代动作');
});
```

- [ ] **Step 2: Add TodayPage current task test**

In `src/components/TodayPage.test.tsx`, add a test that passes a `todayTask` prop:

```tsx
it('shows a lightweight current task entry', () => {
  render(
    <TodayPage
      profile={profile}
      assessmentResult={null}
      onOpenChat={vi.fn()}
      onOpenAssessment={vi.fn()}
      onOpenKnowledge={vi.fn()}
      onOpenRelaxation={vi.fn()}
      onOpenPlans={vi.fn()}
      todayTask={{ day: 1, title: '固定起床时间', status: 'today' }}
    />,
  );

  expect(screen.getByText('今日助眠任务')).toBeInTheDocument();
  expect(screen.getByText('固定起床时间')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '去方案页执行' })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/domain/trends.test.ts src/components/TodayPage.test.tsx src/components/TrendsPage.test.tsx`

Expected: FAIL because record-quality, task execution insight, and TodayPage task props do not exist.

- [ ] **Step 4: Implement trend helpers**

In `src/domain/trends.ts`, extend `TrendSummary`:

```ts
export type TrendRecordQuality = 'empty' | 'sparse' | 'usable';

export interface TrendSummary {
  last7Days: DiarySummary;
  last30Days: DiarySummary;
  insights: string[];
  recordQuality: TrendRecordQuality;
}
```

Add:

```ts
function recordQuality(entryCount: number): TrendRecordQuality {
  if (entryCount === 0) return 'empty';
  if (entryCount < 3) return 'sparse';
  return 'usable';
}

export function buildTaskExecutionInsight(
  logs: Array<{ status: 'completed' | 'skipped'; difficulty: 'easy' | 'ok' | 'hard' | null; day: number }>,
): string {
  const recent = logs.slice(-3);
  const hardOrSkipped = recent.filter((entry) => entry.status === 'skipped' || entry.difficulty === 'hard').length;
  if (logs.length === 0) return '任务和睡眠记录较少，先完成一次今日任务，暂不判断改善趋势。';
  if (hardOrSkipped >= 2) return '最近任务多次跳过或偏难，建议优先使用替代动作，降低任务强度。';
  return '任务执行已有记录，继续结合入睡耗时、夜醒和白天精力观察变化。';
}
```

Update `buildTrendSummary` to include `recordQuality: recordQuality(last7Days.entryCount)`.

- [ ] **Step 5: Add TodayPage task props and UI**

In `TodayPage.tsx`, extend props:

```ts
todayTask?: { day: number; title: string; status: string } | null;
onOpenPlans?: () => void;
```

Render after header:

```tsx
{todayTask && onOpenPlans && (
  <section className="today-task-entry" aria-label="今日助眠任务">
    <div>
      <span>今日助眠任务</span>
      <h2>{todayTask.title}</h2>
      <p>第 {todayTask.day} 天 · {todayTask.status}</p>
    </div>
    <button type="button" className="action-btn" onClick={onOpenPlans}>去方案页执行</button>
  </section>
)}
```

In `App.tsx`, compute the current task from `createSleepProgram`, `resolveProgramState`, and `resolveTodayProgramTask`, then pass `onOpenPlans={() => setActiveTab('plans')}` to `TodayPage`.

- [ ] **Step 6: Update TrendsPage to use task insight**

In `TrendsPage.tsx`, import `buildTaskExecutionInsight` and change `programInsight`:

```ts
const programInsight = buildTaskExecutionInsight(programLogs);
```

Render record-quality copy:

```tsx
<p>{trends.recordQuality === 'usable' ? '记录已足够形成初步观察。' : '记录还不够，先避免过度解读。'}</p>
```

- [ ] **Step 7: Add CSS**

In `src/styles.css`:

```css
.today-task-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  margin: 12px 0 18px;
  border: 1px solid rgba(201, 184, 122, 0.22);
  border-radius: 8px;
  background: rgba(18, 21, 38, 0.82);
}

.today-task-entry h2 {
  margin: 4px 0;
  font-size: 18px;
}
```

- [ ] **Step 8: Run tests**

Run: `npm test -- src/domain/trends.test.ts src/components/TodayPage.test.tsx src/components/TrendsPage.test.tsx src/App.test.tsx`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/domain/trends.ts src/domain/trends.test.ts src/components/TodayPage.tsx src/components/TodayPage.test.tsx src/components/TrendsPage.tsx src/components/TrendsPage.test.tsx src/App.tsx src/App.test.tsx src/styles.css
git commit -m "feat: connect today task and trend feedback"
```

## Task 6: Chat API Safety Gate and Context Alignment

**Files:**
- Modify: `api/chatLogic.ts`
- Modify: `api/chat.test.ts`
- Modify: `api/prompt.ts`
- Modify: `api/prompt.test.ts`
- Modify: `src/components/ChatPage.tsx`
- Modify: `src/components/ChatPage.test.tsx`
- Modify: `src/domain/aiResponse.ts` only if fallback needs a care notice override.

- [ ] **Step 1: Add failing API safety test**

In `api/chat.test.ts`, add:

```ts
it('short-circuits Chinese urgent safety messages without calling provider', async () => {
  const result = await processChat({
    profile,
    message: '我不想活了，已经连续很多天睡不着',
    history: [],
  });

  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({
    riskLevel: 'high_risk',
    seekCareNotice: expect.stringContaining('当地急救'),
  });
  expect(callAiProviderMock).not.toHaveBeenCalled();
});
```

Use the existing provider mock variable name in the file. If it is not named `callAiProviderMock`, rename the expectation to match the existing mock.

- [ ] **Step 2: Add prompt boundary test**

In `api/prompt.test.ts`, add:

```ts
it('includes safety status without allowing AI to override deterministic triage', () => {
  const prompt = buildSleepAdvisorPrompt(
    profile,
    '今天的任务太难了',
    [],
    undefined,
    undefined,
    undefined,
    {
      currentDay: 1,
      todayTask: {
        day: 1,
        title: '固定起床时间',
        category: 'schedule',
        evidenceLabel: 'CBT-I',
        estimatedMinutes: 5,
        rationale: '稳定节律',
        action: '固定起床',
        fallbackAction: '起床后先离床',
        safetyNote: null,
      },
      stats: { completedCount: 0, skippedCount: 1, completionRate: 0, currentStreak: 0, needsFallback: true },
      safetyStatus: 'active',
    },
    undefined,
    'user',
  );

  expect(prompt).toContain('禁止覆盖安全分流规则');
  expect(prompt).toContain('今日任务：固定起床时间');
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- api/chat.test.ts api/prompt.test.ts src/components/ChatPage.test.tsx`

Expected: FAIL at least on Chinese urgent safety short-circuit.

- [ ] **Step 4: Use structured triage in API**

In `api/chatLogic.ts`, replace the old high-risk checks with:

```ts
const triage = triageSafety({
  message: input.message,
  profile: input.profile,
  assessmentResult: input.assessmentResult ?? null,
  diaryNotes: input.diarySummary?.recentNotes,
});

if (triage.shouldBlockAi) {
  return { status: 200, body: safeFallbackResponse(triage.careNotice ?? undefined) };
}
```

Import `triageSafety` from `../src/domain/safety`. If `safeFallbackResponse` currently accepts no argument, update `src/domain/aiResponse.ts`:

```ts
export function safeFallbackResponse(careNotice = defaultCareNotice): AiResponse {
  return {
    riskLevel: 'high_risk',
    summary: '你的描述包含需要优先关注的安全信号。',
    possibleFactors: ['存在需要专业评估的风险信号'],
    suggestions: [{ title: '优先寻求专业支持', detail: careNotice }],
    nextQuestions: [],
    seekCareNotice: careNotice,
    disclaimer: defaultDisclaimer,
  };
}
```

- [ ] **Step 5: Keep personalization safety secondary**

After `triageSafety`, keep the existing personalization urgent check as a secondary guard:

```ts
if (personalization.careAdvice.shouldSeekCare && personalization.careAdvice.urgency === 'urgent') {
  return { status: 200, body: safeFallbackResponse() };
}
```

- [ ] **Step 6: Verify ChatPage sends latest context**

In `src/components/ChatPage.test.tsx`, update or add an assertion that the mocked `sendChatMessage` receives:

```ts
expect(sendChatMessageMock).toHaveBeenCalledWith(expect.objectContaining({
  diarySummary: expect.objectContaining({ daysWindow: 7 }),
  programContext: expect.objectContaining({
    todayTask: expect.objectContaining({ title: expect.any(String) }),
    stats: expect.objectContaining({ completionRate: expect.any(Number) }),
  }),
}));
```

- [ ] **Step 7: Run tests**

Run: `npm test -- api/chat.test.ts api/prompt.test.ts src/domain/aiResponse.test.ts src/components/ChatPage.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add api/chatLogic.ts api/chat.test.ts api/prompt.ts api/prompt.test.ts src/domain/aiResponse.ts src/domain/aiResponse.test.ts src/components/ChatPage.tsx src/components/ChatPage.test.tsx
git commit -m "feat: enforce structured safety before chat provider"
```

Omit unchanged files from `git add`.

## Task 7: External Resource Resilience and Documentation

**Files:**
- Modify: `index.html`
- Modify: `src/styles.css`
- Modify: `README.md`
- Modify: `docs_cn/使用文档.md`

- [ ] **Step 1: Make external resources non-critical**

In `index.html`, keep font preconnects if desired, but ensure the app works without them. Replace the Lucide blocking script with a deferred script:

```html
<script defer src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

Do not add new external providers.

- [ ] **Step 2: Add CSS fallbacks**

In `src/styles.css`, ensure the root font stack has local fallback:

```css
:root {
  font-family: "LXGW WenKai", "Noto Serif SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}
```

Add fallback sizing for unhydrated icon placeholders:

```css
i[data-lucide] {
  display: inline-block;
  width: 1em;
  height: 1em;
  min-width: 1em;
  vertical-align: middle;
}
```

- [ ] **Step 3: Update README**

In `README.md`, add a section:

```md
## Safety and Product Boundary

This app is a local-first sleep health management reference tool. It is not a medical diagnosis, emergency service, prescription tool, or replacement for professional care.

For China-mainland users, urgent self-harm, chest pain, breathing difficulty, suspected sleep apnea with impairment, nightly sedative/alcohol dependence, pregnancy or postpartum severe insomnia, and severe insomnia with major daytime impairment are routed to professional evaluation guidance before ordinary behavior tasks or AI generation.

All profile, diary, task, feedback, and chat history data stays in the current browser. This version does not provide accounts, cloud sync, real system notifications, or medical platform integration.
```

- [ ] **Step 4: Update Chinese docs**

In `docs_cn/使用文档.md`, update the safety and 14-day plan sections to include:

```md
当前版本面向中国大陆用户使用语境设计安全提示。出现自伤/轻生、胸痛、呼吸困难、疑似睡眠呼吸暂停伴白天功能受损、每晚依赖助眠药或酒精、孕期或产后严重失眠等情况时，系统会优先提示联系当地急救、就近急诊/精神心理急诊、当地心理援助或危机干预热线，或睡眠门诊、呼吸科、心内科、精神心理科、产科等专业资源。不同地区热线服务不同，应用不承诺单一号码在全国可用。

14 天改善计划支持“完成今日任务”和“跳过今日任务”。反馈会保存在浏览器本地的 `dailyTaskLogs` 中，用于计算完成率、连续完成天数、跳过次数和趋势页的保守反馈。数据不会上传到云端。
```

- [ ] **Step 5: Run build and doc-adjacent tests**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html src/styles.css README.md docs_cn/使用文档.md
git commit -m "docs: clarify local safety and resource boundaries"
```

## Task 8: E2E Repair and Final Verification

**Files:**
- Modify: `e2e/app.spec.ts`
- Modify: `e2e/mvp.spec.ts`

- [ ] **Step 1: Fix quick consultation count expectation**

In `e2e/app.spec.ts`, update the quick consultation card count from 9 to 8 because `TodayPage` intentionally excludes `sound_meditation` from chat quick consultation:

```ts
expect(layout.cardCount).toBe(8);
```

Keep the knowledge scenario test at 9.

- [ ] **Step 2: Update diary selectors in MVP E2E**

In `e2e/mvp.spec.ts`, replace old diary input lines:

```ts
await page.getByLabel('睡前情绪').fill('平静');
await page.getByLabel('入睡耗时').fill('35');
```

with current guided-choice interactions:

```ts
await page.getByRole('button', { name: '平静' }).click();
await page.getByRole('button', { name: '保存睡前记录' }).click();
await page.getByRole('button', { name: /起床记录/ }).click();
await page.getByLabel('入睡时间').fill('23:40');
await page.getByLabel('起床时间').fill('07:10');
await page.getByRole('button', { name: '31-60分钟' }).click();
await page.getByRole('button', { name: '1次' }).click();
await page.getByRole('button', { name: '一般' }).click();
await page.getByRole('button', { name: '保存起床记录' }).click();
```

- [ ] **Step 3: Add plan feedback to E2E path**

After opening `方案`, add:

```ts
await expect(page.getByRole('heading', { name: '助眠方案' })).toBeVisible();
await page.getByRole('button', { name: '完成今日任务' }).click();
await page.getByRole('button', { name: '一般' }).first().click();
await page.getByRole('button', { name: '较好' }).click();
await page.getByRole('button', { name: '16-30分钟' }).click();
await page.getByRole('button', { name: '1次' }).click();
await page.getByLabel('白天精力').fill('还可以');
await page.getByRole('button', { name: '保存任务反馈' }).click();
await expect(page.getByText(/已完成 1 个任务/)).toBeVisible();
```

- [ ] **Step 4: Add Chinese high-risk E2E route assertion**

In `e2e/mvp.spec.ts`, after chat path is working, send:

```ts
await page.getByPlaceholder(/咨询/).fill('我不想活了，连续很多天睡不着');
await page.getByRole('button', { name: '发送' }).click();
await expect(page.getByText(/当地急救|就近急诊|专业支持/)).toBeVisible();
```

If the test route intercepts `/api/chat`, update the route handler to return deterministic high-risk JSON when request body contains `不想活`.

- [ ] **Step 5: Run E2E**

Run: `npm run e2e`

Expected: PASS for desktop and mobile projects.

- [ ] **Step 6: Run full verification**

Run:

```bash
npm test
npm run build
npm run e2e
git status --short
```

Expected:

- `npm test`: all Vitest files pass.
- `npm run build`: TypeScript and Vite build pass.
- `npm run e2e`: all Playwright tests pass.
- `git status --short`: only intentional modified files remain before final commit.

- [ ] **Step 7: Commit**

```bash
git add e2e/app.spec.ts e2e/mvp.spec.ts
git commit -m "test: restore full insomnia consultant e2e flow"
```

## Final Review Checklist

- [ ] Safety triage blocks Chinese urgent risk before provider calls.
- [ ] Plan task feedback writes one latest log per `programId + day`.
- [ ] Today page points to the current task without duplicating plan-page complexity.
- [ ] Trends stay conservative with sparse records.
- [ ] Diary date switching reloads fields and avoids stale saves.
- [ ] Chat context contains diary summary and program stats.
- [ ] CDN font/icon failures do not break primary actions.
- [ ] README and Chinese docs describe the implemented behavior.
- [ ] `npm test`, `npm run build`, and `npm run e2e` pass.
