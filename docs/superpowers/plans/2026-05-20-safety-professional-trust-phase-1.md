# Safety Professional Trust Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the insomnia consultant consistently safe, conservative, and non-diagnostic across domain logic, UI, API prompts, and documentation.

**Architecture:** Keep deterministic safety behavior in `src/domain/*`, keep UI rendering in focused React components, and keep the API as the final safety gate before any AI provider call. Add a shared sleep-context helper and reusable care-first UI so pages do not duplicate risk language or scattered storage assembly.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest, React Testing Library, Playwright, localStorage-backed browser persistence, Vercel-style serverless API modules.

---

## File Structure

- Create `src/domain/sleepContext.ts`: builds a unified `UserSleepContext` from profile, assessment, diary entries, program, task logs, and chat message.
- Create `src/domain/sleepContext.test.ts`: verifies context construction and safety triage propagation.
- Modify `src/domain/types.ts`: exports `UserSleepContext`, `CareAction`, `SafetyDisplayCopy`, and optional `safetyTriage` fields used by UI and prompt context.
- Modify `src/domain/safety.ts`: adds reusable display-copy and care-action helpers while preserving `triageSafety` and `detectHighRiskSignal`.
- Modify `src/domain/safety.test.ts`: covers urgent, needs-care, normal, China-mainland emergency wording, and no diagnosis/treatment claims in copy.
- Create `src/components/SafetyCarePanel.tsx`: reusable care-first panel for urgent and needs-care states.
- Create `src/components/SafetyCarePanel.test.tsx`: verifies urgent and needs-care rendering.
- Modify `src/components/AssessmentPage.tsx`: show standardized care guidance when profile safety signals appear in the assessment report.
- Modify `src/components/AssessmentPage.test.tsx`: verify standardized care guidance appears for profile safety signals.
- Modify `src/components/PlansPage.tsx`: use standardized safety copy in care-first program state.
- Modify `src/components/PlansPage.test.tsx`: verify ordinary task actions are hidden in care-first state.
- Modify `src/components/TrendsPage.tsx`: show safety guidance before trend interpretation when triage escalates.
- Modify `src/components/TrendsPage.test.tsx`: verify care-first trend state.
- Modify `api/prompt.ts`: include deterministic safety status and strict non-diagnostic boundary in prompt context.
- Modify `api/prompt.test.ts`: verify prompt includes safety level and forbids diagnosis, treatment, prescriptions, and dosage.
- Modify `api/chatLogic.ts`: run `triageSafety` once, pass safety context into prompt, and return deterministic fallback for urgent cases.
- Modify `api/chat.test.ts`: verify urgent provider short-circuit and needs-care prompt context.
- Modify `src/domain/trustedContent.ts`: expose trusted source metadata for CBT-I, general wellness boundary, and China-mainland psychological assistance.
- Modify `src/domain/trustedContent.test.ts`: verify trusted content has source labels and safety boundaries.
- Modify `README.md` and `docs_cn/使用文档.md`: document the safety boundary, local-first behavior, and China-mainland care guidance.
- Create `docs/superpowers/checklists/safety-sensitive-copy.md`: wording checklist for future H5 and Mini Program content.

## Task 1: Shared Sleep Context

**Files:**
- Create: `src/domain/sleepContext.ts`
- Create: `src/domain/sleepContext.test.ts`
- Modify: `src/domain/types.ts`

- [ ] **Step 1: Add shared context types**

In `src/domain/types.ts`, add these exports after `SafetyTriageInput`:

```ts
export interface UserSleepContext {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary: ConsultationDiarySummary | null;
  program: SleepProgram | null;
  taskLogs: DailyTaskLog[];
  message: string;
  safetyTriage: SafetyTriageResult;
}

export interface CareAction {
  label: string;
  detail: string;
}

export interface SafetyDisplayCopy {
  title: string;
  summary: string;
  actions: CareAction[];
  disclaimer: string;
}
```

- [ ] **Step 2: Write failing tests for context construction**

Create `src/domain/sleepContext.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildUserSleepContext } from './sleepContext';
import type { DailyTaskLog, SleepDiaryEntry, SleepProfile, SleepProgram } from './types';

const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:30',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '中等',
  habits: ['睡前玩手机'],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

const diaryEntry: SleepDiaryEntry = {
  id: 'diary-2026-05-20',
  date: '2026-05-20',
  bedtimeCheckin: { mood: '焦虑', stressLevel: 4, factors: ['工作消息'], plannedActions: [], notes: '脑子停不下来' },
  wakeCheckin: { sleepStart: '00:30', wakeTime: '07:00', sleepLatencyMinutes: 45, awakenings: 2, sleepQuality: 2, dreamNote: '', daytimeFeeling: '疲惫', notes: '醒来很累' },
  createdAt: '2026-05-20T00:00:00.000Z',
  updatedAt: '2026-05-20T00:00:00.000Z',
  version: 1,
};

const program: SleepProgram = {
  id: 'program-2026-05-20',
  startedAt: '2026-05-20T00:00:00.000Z',
  currentDay: 1,
  status: 'active',
  templateId: 'cbti_foundation_14_day',
  createdAt: '2026-05-20T00:00:00.000Z',
  updatedAt: '2026-05-20T00:00:00.000Z',
  version: 1,
};

const taskLogs: DailyTaskLog[] = [];

describe('buildUserSleepContext', () => {
  it('summarizes diary data and keeps normal safety status for ordinary sleep trouble', () => {
    const context = buildUserSleepContext({
      profile,
      assessmentResult: null,
      diaryEntries: [diaryEntry],
      program,
      taskLogs,
      message: '我最近入睡比较慢',
      today: new Date('2026-05-20T12:00:00.000Z'),
    });

    expect(context.diarySummary?.entryCount).toBe(1);
    expect(context.program?.id).toBe('program-2026-05-20');
    expect(context.taskLogs).toEqual([]);
    expect(context.safetyTriage.level).toBe('normal');
  });

  it('includes recent diary notes in urgent safety triage', () => {
    const context = buildUserSleepContext({
      profile,
      assessmentResult: null,
      diaryEntries: [{ ...diaryEntry, wakeCheckin: { ...diaryEntry.wakeCheckin!, notes: '胸口痛，呼吸困难' } }],
      program,
      taskLogs,
      message: '今晚又睡不着',
      today: new Date('2026-05-20T12:00:00.000Z'),
    });

    expect(context.safetyTriage.level).toBe('urgent');
    expect(context.safetyTriage.shouldBlockAi).toBe(true);
    expect(context.safetyTriage.categories).toContain('chest_pain_or_breathing');
  });
});
```

- [ ] **Step 3: Run the failing test**

Run:

```bash
npm test -- src/domain/sleepContext.test.ts
```

Expected: FAIL because `src/domain/sleepContext.ts` and `buildUserSleepContext` do not exist.

- [ ] **Step 4: Implement shared context builder**

Create `src/domain/sleepContext.ts`:

```ts
import { buildConsultationDiarySummary } from './sleepDiary';
import { triageSafety } from './safety';
import type {
  AssessmentResult,
  DailyTaskLog,
  SleepDiaryEntry,
  SleepProfile,
  SleepProgram,
  UserSleepContext,
} from './types';

interface BuildUserSleepContextInput {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diaryEntries: SleepDiaryEntry[];
  program: SleepProgram | null;
  taskLogs: DailyTaskLog[];
  message?: string;
  today?: Date;
}

export function buildUserSleepContext(input: BuildUserSleepContextInput): UserSleepContext {
  const diarySummary = input.diaryEntries.length > 0
    ? buildConsultationDiarySummary(input.diaryEntries, input.today ?? new Date())
    : null;
  const message = input.message ?? '';
  const safetyTriage = triageSafety({
    profile: input.profile,
    message,
    assessmentResult: input.assessmentResult,
    diaryNotes: diarySummary?.recentNotes ?? [],
  });

  return {
    profile: input.profile,
    assessmentResult: input.assessmentResult,
    diarySummary,
    program: input.program,
    taskLogs: input.taskLogs,
    message,
    safetyTriage,
  };
}
```

- [ ] **Step 5: Verify context tests pass**

Run:

```bash
npm test -- src/domain/sleepContext.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/domain/types.ts src/domain/sleepContext.ts src/domain/sleepContext.test.ts
git commit -m "feat: add shared sleep context"
```

## Task 2: Standard Safety Display Copy

**Files:**
- Modify: `src/domain/safety.ts`
- Modify: `src/domain/safety.test.ts`

- [ ] **Step 1: Add failing tests for display copy**

Append to `src/domain/safety.test.ts`:

```ts
import { buildSafetyDisplayCopy } from './safety';

describe('buildSafetyDisplayCopy', () => {
  it('uses China-mainland urgent guidance without diagnosis or treatment claims', () => {
    const triage = triageSafety({ message: '我不想活了，今晚可能会伤害自己' });
    const copy = buildSafetyDisplayCopy(triage);

    expect(copy.title).toContain('立即');
    expect(copy.summary).toContain('当地急救');
    expect(copy.summary).toContain('可信任的人');
    expect(copy.summary).not.toContain('988');
    expect(copy.disclaimer).toContain('不作为医疗诊断');
    expect(JSON.stringify(copy)).not.toMatch(/治愈|治疗方案|处方|剂量/);
  });

  it('uses professional evaluation guidance for needs-care cases', () => {
    const triage = triageSafety({ message: '我睡觉总是憋醒，打鼾很严重' });
    const copy = buildSafetyDisplayCopy(triage);

    expect(copy.title).toContain('建议专业评估');
    expect(copy.actions.map((action) => action.label)).toContain('整理睡眠记录');
    expect(copy.disclaimer).toContain('健康管理参考');
  });

  it('uses ordinary boundary copy for normal cases', () => {
    const triage = triageSafety({ message: '我睡前刷手机到一点' });
    const copy = buildSafetyDisplayCopy(triage);

    expect(copy.title).toBe('睡眠健康管理参考');
    expect(copy.actions.length).toBeGreaterThan(0);
    expect(copy.disclaimer).toContain('不作为医疗诊断');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- src/domain/safety.test.ts
```

Expected: FAIL because `buildSafetyDisplayCopy` is not exported.

- [ ] **Step 3: Implement display-copy helper**

Replace the top import in `src/domain/safety.ts` with:

```ts
import type { SafetyDisplayCopy, SafetyTriageCategory, SafetyTriageInput, SafetyTriageResult } from './types';
```

Add below `triageSafety`:

```ts
export function buildSafetyDisplayCopy(result: SafetyTriageResult): SafetyDisplayCopy {
  if (result.level === 'urgent') {
    return {
      title: '请立即优先处理安全风险',
      summary: result.careNotice ?? urgentCareNotice,
      actions: [
        { label: '联系当地急救', detail: '如果存在自伤危险、胸痛、呼吸困难或其他急性危险，请立即联系当地急救电话。' },
        { label: '前往线下急诊', detail: '可以前往就近急诊、精神心理急诊，或根据症状选择呼吸科、心内科、产科等线下帮助。' },
        { label: '让可信任的人陪伴', detail: '在风险没有解除前，请尽量让家人、朋友、同事或身边可信任的人陪在附近。' },
      ],
      disclaimer: defaultDisclaimer,
    };
  }

  if (result.level === 'needs_care') {
    return {
      title: '建议专业评估后再执行普通助眠任务',
      summary: result.careNotice ?? needsCareNotice,
      actions: [
        { label: '整理睡眠记录', detail: '记录入睡时间、夜醒、憋醒、用药或饮酒情况、白天功能影响，便于专业人员判断。' },
        { label: '选择合适科室', detail: '可根据症状考虑睡眠门诊、呼吸科、心内科、精神心理科、产科或其他相关科室。' },
        { label: '保守管理', detail: '在评估前，只进行温和的睡眠记录、环境调整和低强度放松，不做激烈干预。' },
      ],
      disclaimer: `${defaultDisclaimer} 如症状加重或出现急性危险，请优先线下就医或急救。`,
    };
  }

  return {
    title: '睡眠健康管理参考',
    summary: '当前未识别到需要优先阻断的高风险信号，可以继续进行睡眠记录、科普学习和保守助眠任务。',
    actions: [
      { label: '继续记录', detail: '记录入睡耗时、夜醒次数、睡眠质量和白天状态，避免过早判断趋势。' },
      { label: '温和调整', detail: '优先尝试固定起床时间、减少睡前刺激、放松练习和卧室环境调整。' },
    ],
    disclaimer: defaultDisclaimer,
  };
}
```

- [ ] **Step 4: Verify safety tests pass**

Run:

```bash
npm test -- src/domain/safety.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/safety.ts src/domain/safety.test.ts
git commit -m "feat: standardize safety display copy"
```

## Task 3: Reusable Care-First UI

**Files:**
- Create: `src/components/SafetyCarePanel.tsx`
- Create: `src/components/SafetyCarePanel.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing component tests**

Create `src/components/SafetyCarePanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildSafetyDisplayCopy, triageSafety } from '../domain/safety';
import { SafetyCarePanel } from './SafetyCarePanel';

describe('SafetyCarePanel', () => {
  it('renders urgent care-first guidance', () => {
    const triage = triageSafety({ message: '我想轻生' });
    render(<SafetyCarePanel level={triage.level} copy={buildSafetyDisplayCopy(triage)} />);

    expect(screen.getByRole('region', { name: '安全优先提示' })).toBeInTheDocument();
    expect(screen.getByText('请立即优先处理安全风险')).toBeInTheDocument();
    expect(screen.getByText('联系当地急救')).toBeInTheDocument();
    expect(screen.queryByText('988')).not.toBeInTheDocument();
  });

  it('renders needs-care guidance', () => {
    const triage = triageSafety({ message: '我睡觉总是憋醒，打鼾很严重' });
    render(<SafetyCarePanel level={triage.level} copy={buildSafetyDisplayCopy(triage)} />);

    expect(screen.getByText('建议专业评估后再执行普通助眠任务')).toBeInTheDocument();
    expect(screen.getByText('整理睡眠记录')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- src/components/SafetyCarePanel.test.tsx
```

Expected: FAIL because `SafetyCarePanel` does not exist.

- [ ] **Step 3: Implement the component**

Create `src/components/SafetyCarePanel.tsx`:

```tsx
import type { SafetyDisplayCopy, SafetyTriageLevel } from '../domain/types';

interface SafetyCarePanelProps {
  level: SafetyTriageLevel;
  copy: SafetyDisplayCopy;
}

export function SafetyCarePanel({ level, copy }: SafetyCarePanelProps) {
  return (
    <section className={`safety-care-panel ${level}`} aria-label="安全优先提示">
      <div className="safety-care-header">
        <span className="safety-care-level">{level === 'urgent' ? '紧急' : level === 'needs_care' ? '需评估' : '参考'}</span>
        <h2>{copy.title}</h2>
      </div>
      <p>{copy.summary}</p>
      <div className="safety-care-actions">
        {copy.actions.map((action) => (
          <article key={action.label} className="safety-care-action">
            <h3>{action.label}</h3>
            <p>{action.detail}</p>
          </article>
        ))}
      </div>
      <p className="fine-print">{copy.disclaimer}</p>
    </section>
  );
}
```

- [ ] **Step 4: Add scoped styles**

Append to `src/styles.css`:

```css
.safety-care-panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.safety-care-panel.urgent {
  border-color: #fca5a5;
  background: #fff5f5;
}

.safety-care-panel.needs_care {
  border-color: #facc15;
  background: #fffbeb;
}

.safety-care-header {
  display: grid;
  gap: 6px;
}

.safety-care-header h2 {
  margin: 0;
  font-size: 18px;
}

.safety-care-level {
  width: fit-content;
  border-radius: 999px;
  padding: 3px 8px;
  background: rgba(15, 23, 42, 0.08);
  font-size: 12px;
  font-weight: 700;
}

.safety-care-actions {
  display: grid;
  gap: 10px;
  margin: 14px 0;
}

.safety-care-action {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.78);
}

.safety-care-action h3 {
  margin: 0 0 4px;
  font-size: 15px;
}

.safety-care-action p {
  margin: 0;
}
```

- [ ] **Step 5: Verify component tests pass**

Run:

```bash
npm test -- src/components/SafetyCarePanel.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/components/SafetyCarePanel.tsx src/components/SafetyCarePanel.test.tsx src/styles.css
git commit -m "feat: add reusable safety care panel"
```

## Task 4: Integrate Care-First States In Pages

**Files:**
- Modify: `src/components/AssessmentPage.tsx`
- Modify: `src/components/AssessmentPage.test.tsx`
- Modify: `src/components/PlansPage.tsx`
- Modify: `src/components/PlansPage.test.tsx`
- Modify: `src/components/TrendsPage.tsx`
- Modify: `src/components/TrendsPage.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add failing page integration tests**

In `src/components/AssessmentPage.test.tsx`, update the existing test named `shows profile safety signals in the report risk flags` so its final assertion block is:

```tsx
expect(screen.getByText('存在安全信号：疑似睡眠呼吸暂停')).toBeVisible();
expect(screen.getByText('建议专业评估后再执行普通助眠任务')).toBeVisible();
expect(screen.getByText('整理睡眠记录')).toBeVisible();
```

In `src/components/PlansPage.test.tsx`, replace the assertion block in the existing test named `shows professional evaluation guidance instead of ordinary timeline actions when care should come first` with:

```tsx
expect(screen.getByText('建议专业评估后再执行普通助眠任务')).toBeInTheDocument();
expect(screen.getByText('整理睡眠记录')).toBeInTheDocument();
expect(screen.getByText('当前优先方案')).toBeInTheDocument();
expect(screen.queryByRole('button', { name: '完成今日任务' })).not.toBeInTheDocument();
expect(screen.queryByRole('button', { name: '跳过今日任务' })).not.toBeInTheDocument();
```

In `src/components/TrendsPage.test.tsx`, change the type import to include `SleepProfile`:

```ts
import type { DailyTaskLog, SleepDiaryEntry, SleepProfile } from '../domain/types';
```

Add this fixture below `hardLog`:

```ts
const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:30',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '中等',
  habits: [],
  daytimeImpact: '白天疲惫',
  safetySignals: ['疑似睡眠呼吸暂停'],
  optionalContext: '',
};
```

Add this test:

```tsx
it('prioritizes safety guidance over trend interpretation when safety escalates', () => {
  render(<TrendsPage profile={{ ...profile, safetySignals: ['疑似睡眠呼吸暂停'] }} today="2026-05-20" />);

  expect(screen.getByText('建议专业评估后再执行普通助眠任务')).toBeInTheDocument();
  expect(screen.getByText('整理睡眠记录')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run failing page tests**

Run:

```bash
npm test -- src/components/AssessmentPage.test.tsx src/components/PlansPage.test.tsx src/components/TrendsPage.test.tsx
```

Expected: FAIL because pages do not use `SafetyCarePanel` consistently and `TrendsPage` does not accept `profile`.

- [ ] **Step 3: Integrate `SafetyCarePanel` into `PlansPage`**

In `src/components/PlansPage.tsx`, add imports:

```ts
import { buildSafetyDisplayCopy, triageSafety } from '../domain/safety';
import { SafetyCarePanel } from './SafetyCarePanel';
```

In `ProgramOverview`, replace the current `needs_care` card body with:

```tsx
if (programState.program.status === 'needs_care') {
  const triage = triageSafety({
    profile,
    assessmentResult,
  });

  return (
    <section>
      <div className="section-header">
        <h2>14天改善计划</h2>
      </div>
      <SafetyCarePanel level={triage.level} copy={buildSafetyDisplayCopy(triage)} />
    </section>
  );
}
```

To support that code, add `profile` and `assessmentResult` to `ProgramOverview` props and pass them from `PlansPage`:

```tsx
<ProgramOverview
  profile={profile}
  assessmentResult={assessmentResult}
  programState={programState}
  expanded={isTimelineExpanded}
  onToggle={() => setIsTimelineExpanded((value) => !value)}
  onStartFeedback={setFeedbackStatus}
/>
```

- [ ] **Step 4: Integrate `SafetyCarePanel` into `AssessmentPage` and `TrendsPage`**

In `src/components/AssessmentPage.tsx`, add imports:

```ts
import { buildSafetyDisplayCopy, triageSafety } from '../domain/safety';
import { SafetyCarePanel } from './SafetyCarePanel';
```

Update `AssessmentReportProps`:

```ts
interface AssessmentReportProps {
  profile: SleepProfile;
  result: AssessmentResult;
}
```

Update the function signature:

```tsx
function AssessmentReport({ profile, result }: AssessmentReportProps) {
```

Inside `AssessmentReport`, below `nextActions`, add:

```ts
const safetyTriage = triageSafety({ profile, assessmentResult: result });
```

In the rendered report section, below the existing risk flags and before ordinary next-step suggestions, add:

```tsx
{safetyTriage.level !== 'normal' && (
  <SafetyCarePanel level={safetyTriage.level} copy={buildSafetyDisplayCopy(safetyTriage)} />
)}
```

Update the report render call:

```tsx
<AssessmentReport profile={profile} result={result} />
```

Change the component signature in `src/components/TrendsPage.tsx`:

```tsx
import type { SleepProfile } from '../domain/types';
import { buildSafetyDisplayCopy, triageSafety } from '../domain/safety';
import { SafetyCarePanel } from './SafetyCarePanel';

export function TrendsPage({
  profile,
  today = new Date().toISOString().slice(0, 10),
  onOpenDiary,
}: {
  profile?: SleepProfile;
  today?: string;
  onOpenDiary?: () => void;
}) {
```

After the header and before the trend hero, add:

```tsx
const safetyTriage = profile ? triageSafety({ profile }) : null;
```

Render before trend interpretation:

```tsx
{safetyTriage && safetyTriage.level !== 'normal' && (
  <SafetyCarePanel level={safetyTriage.level} copy={buildSafetyDisplayCopy(safetyTriage)} />
)}
```

Update `src/App.tsx` in the `trends` tab branch:

```tsx
<TrendsPage profile={profile!} onOpenDiary={() => setActiveTab('diary')} />
```

- [ ] **Step 5: Verify page tests pass**

Run:

```bash
npm test -- src/components/AssessmentPage.test.tsx src/components/PlansPage.test.tsx src/components/TrendsPage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/components/AssessmentPage.tsx src/components/AssessmentPage.test.tsx src/components/PlansPage.tsx src/components/PlansPage.test.tsx src/components/TrendsPage.tsx src/components/TrendsPage.test.tsx src/App.tsx
git commit -m "feat: integrate care-first page states"
```

## Task 5: API And Prompt Safety Boundary

**Files:**
- Modify: `api/chatLogic.ts`
- Modify: `api/chat.test.ts`
- Modify: `api/prompt.ts`
- Modify: `api/prompt.test.ts`
- Modify: `src/domain/types.ts`

- [ ] **Step 1: Extend prompt context type**

In `src/domain/types.ts`, update `ProgramPromptContext`:

```ts
export interface ProgramPromptContext {
  currentDay: number;
  todayTask: ProgramTask;
  stats: ProgramStats;
  safetyStatus: ProgramStatus;
  safetyTriage?: SafetyTriageResult;
}
```

- [ ] **Step 2: Add failing prompt tests**

Append to `api/prompt.test.ts`:

```ts
it('includes deterministic safety triage status and non-diagnostic boundaries', () => {
  const prompt = buildSleepAdvisorPrompt(
    profile,
    '我长期靠酒才能睡',
    [],
    undefined,
    undefined,
    undefined,
    {
      currentDay: 1,
      todayTask: {
        day: 1,
        title: '睡眠环境重置',
        category: 'sleep_hygiene',
        evidenceLabel: '睡眠卫生',
        estimatedMinutes: 10,
        rationale: '减少睡前刺激。',
        action: '调暗灯光。',
        fallbackAction: '只完成调暗灯光。',
        safetyNote: null,
      },
      stats: { completedCount: 0, skippedCount: 0, completionRate: 0, currentStreak: 0, needsFallback: false },
      safetyStatus: 'needs_care',
      safetyTriage: {
        level: 'urgent',
        reasons: ['存在助眠药物、镇静药或酒精依赖信号'],
        categories: ['medication_or_alcohol_dependence'],
        shouldBlockAi: true,
        careNotice: '请优先专业评估。',
      },
    },
    undefined,
    'user',
  );

  expect(prompt).toContain('确定性安全分诊：urgent');
  expect(prompt).toContain('禁止诊断');
  expect(prompt).toContain('禁止治疗承诺');
  expect(prompt).toContain('禁止处方');
  expect(prompt).toContain('禁止药物或补充剂剂量');
});
```

- [ ] **Step 3: Implement prompt boundary text**

In `api/prompt.ts`, add this inside `buildSleepAdvisorPrompt` after `programPromptContext`:

```ts
const safetyTriageContext = programContext?.safetyTriage
  ? `\n\n确定性安全分诊：${programContext.safetyTriage.level}
- 风险类别：${programContext.safetyTriage.categories.join('、') || '无'}
- 风险原因：${programContext.safetyTriage.reasons.join('、') || '无'}
- 是否阻断 AI：${programContext.safetyTriage.shouldBlockAi ? '是' : '否'}
- 边界：禁止诊断；禁止治疗承诺；禁止处方；禁止药物或补充剂剂量；禁止覆盖确定性安全分诊。`
  : '';
```

Add `${safetyTriageContext}` into the context section after `${programPromptContext}`.

- [ ] **Step 4: Add failing API tests**

Append to `api/chat.test.ts`:

```ts
it('short-circuits urgent Chinese risk before provider call', async () => {
  const result = await processChat({
    profile,
    message: '我不想活了，可能会伤害自己',
  });

  expect(result.status).toBe(200);
  expect(JSON.stringify(result.body)).toContain('当地急救');
  expect(callAiProvider).not.toHaveBeenCalled();
});

it('passes needs-care safety context into provider prompt', async () => {
  vi.mocked(callAiProvider).mockResolvedValueOnce({
    content: JSON.stringify({
      riskLevel: 'high_risk',
      summary: '建议优先专业评估，同时仅做温和记录。',
      possibleFactors: ['疑似睡眠呼吸相关问题'],
      suggestions: [{ title: '整理记录', detail: '记录憋醒、打鼾和白天困倦情况。' }],
      nextQuestions: [],
      seekCareNotice: '建议睡眠门诊或呼吸科评估。',
      disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
    }),
  });

  await processChat({
    profile: { ...profile, safetySignals: ['疑似睡眠呼吸暂停'] },
    message: '我睡觉打鼾很严重',
  });

  expect(callAiProvider).toHaveBeenCalledTimes(1);
  expect(vi.mocked(callAiProvider).mock.calls[0][0]).toContain('确定性安全分诊：needs_care');
});
```

- [ ] **Step 5: Implement API context passing**

In `api/chatLogic.ts`, when constructing `programContext` for prompt, merge triage:

```ts
const promptProgramContext = input.programContext
  ? { ...input.programContext, safetyTriage: triage }
  : undefined;
```

Pass `promptProgramContext` into `buildSleepAdvisorPrompt` instead of `input.programContext`.

- [ ] **Step 6: Verify API and prompt tests pass**

Run:

```bash
npm test -- api/prompt.test.ts api/chat.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/domain/types.ts api/prompt.ts api/prompt.test.ts api/chatLogic.ts api/chat.test.ts
git commit -m "feat: enforce prompt safety boundaries"
```

## Task 6: Trusted Content And Sensitive Copy Checklist

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/trustedContent.ts`
- Modify: `src/domain/trustedContent.test.ts`
- Create: `docs/superpowers/checklists/safety-sensitive-copy.md`
- Modify: `README.md`
- Modify: `docs_cn/使用文档.md`

- [ ] **Step 1: Add failing trusted-content tests**

Append to `src/domain/trustedContent.test.ts`:

```ts
it('includes source labels for CBT-I, general wellness boundary, and psychological assistance', () => {
  const responses = [
    buildTrustedKnowledgeResponse('hard_to_fall_asleep'),
    buildTrustedKnowledgeResponse('medical_triage'),
  ];
  const serialized = JSON.stringify(responses);

  expect(serialized).toContain('CBT-I');
  expect(serialized).toContain('健康管理参考');
  expect(serialized).toContain('12356');
  expect(serialized).not.toMatch(/治愈|治疗方案|处方|剂量/);
});
```

- [ ] **Step 2: Run failing trusted-content test**

Run:

```bash
npm test -- src/domain/trustedContent.test.ts
```

Expected: FAIL because trusted content does not yet include source labels and 12356 guidance together.

- [ ] **Step 3: Add trusted source metadata type**

In `src/domain/types.ts`, update `KnowledgeCard`:

```ts
export interface KnowledgeCard {
  title: string;
  summary: string;
  keyPoints: string[];
  misconceptions: string[];
  actions: Suggestion[];
  safetyNote: string | null;
  followUpQuestions: string[];
  sourceLabel?: string;
}
```

- [ ] **Step 4: Add trusted source metadata content**

In `src/domain/trustedContent.ts`, add this card immediately after `safetyCard`:

```ts
const safetyBoundaryCard = card({
  title: '安全边界与专业帮助',
  summary: '本工具提供睡眠健康管理参考，不提供诊断、治疗、处方或急救服务。出现自伤风险、胸痛、呼吸困难、疑似睡眠呼吸暂停或药物/酒精依赖时，应优先线下专业评估。',
  keyPoints: [
    'CBT-I 是慢性失眠管理中常见的一线方向，但具体治疗应由专业人员评估。',
    '数字化工具适合记录、科普和自我管理辅助，不应替代医生或心理专业人员。',
    '中国大陆用户如有心理危机，可关注当地 12356 心理援助热线可用性；急性危险优先当地急救和线下急诊。',
  ],
  misconceptions: ['睡眠健康管理工具不能替代医生诊断', 'AI 回复不能作为处方或急救服务'],
  actions: [
    { title: '整理记录', detail: '记录睡眠时长、夜醒、憋醒、用药饮酒和白天功能影响。' },
    { title: '优先线下帮助', detail: '出现急性危险、自伤风险、胸痛或呼吸困难时，优先当地急救和线下急诊。' },
  ],
  safetyNote: '如有心理危机，可关注当地 12356 心理援助热线可用性；急性危险优先当地急救。',
  followUpQuestions: ['哪些情况需要专业评估？', '看医生前应该记录什么？'],
  sourceLabel: 'ACP / AASM / FDA digital health guidance / China public mental-health assistance information',
});
```

Include `safetyBoundaryCard` in the `medical_triage` scenario before `safetyCard`:

```ts
medical_triage: [safetyBoundaryCard, safetyCard],
```

- [ ] **Step 5: Create sensitive copy checklist**

Create `docs/superpowers/checklists/safety-sensitive-copy.md`:

```markdown
# Safety Sensitive Copy Checklist

Use this checklist before adding H5 or WeChat Mini Program copy for the insomnia consultant.

## Product Positioning

- The product is a sleep health management and science-education companionship tool.
- The product is not a medical diagnosis, treatment, prescription, emergency, or medical decision platform.

## Avoid These Claims

- Do not say the app diagnoses insomnia, sleep apnea, anxiety, depression, or other diseases.
- Do not say the app treats, cures, or guarantees improvement.
- Do not provide medication, supplement, or alcohol-use instructions as a dosage plan.
- Do not imply AI output is medical judgment.
- Do not tell users to delay emergency or professional care because they used the app.

## Preferred Language

- Use "健康管理参考", "科普", "记录", "可能因素", "保守建议", and "建议专业评估".
- For urgent danger, direct users to local emergency services, nearby emergency or psychiatric emergency care, and trusted nearby people.
- For non-urgent distress, mention local psychological assistance or crisis intervention hotlines where available, including 12356 where regionally available.
- For suspected sleep apnea, chest pain, breathing difficulty, pregnancy/postpartum severe insomnia, major illness, or medication/alcohol dependence, recommend offline professional evaluation.

## WeChat Mini Program Review Notes

- Keep medical terms educational and non-diagnostic.
- Keep risk guidance conservative.
- Avoid treatment-effect promises in buttons, titles, empty states, onboarding, and push/reminder copy.
```

- [ ] **Step 6: Update docs**

In `README.md` and `docs_cn/使用文档.md`, add a "Safety and Trust Boundary" section with this wording:

```md
This app is a sleep health management and science-education companionship tool. It helps users record sleep, understand possible factors, follow conservative self-management tasks, and discuss sleep-management questions. It is not a diagnosis, treatment, prescription, emergency, or medical decision platform.

For urgent self-harm risk, chest pain, breathing difficulty, suspected sleep apnea with impairment, medication or alcohol dependence, pregnancy or postpartum severe sleep issues, major disease signals, or severe insomnia with major daytime impairment, users should prioritize local emergency services or offline professional evaluation. In China mainland, local psychological assistance or crisis intervention hotlines such as 12356 may be available, but urgent danger should not wait for online guidance.
```

- [ ] **Step 7: Verify trusted content and docs do not use prohibited claims**

Run:

```bash
npm test -- src/domain/trustedContent.test.ts
rg -n "治愈|治疗方案|处方|剂量|保证改善|诊断为" README.md docs_cn src api
```

Expected: trusted-content tests PASS. The `rg` command should return no prohibited product claims. Mentions in tests or safety-boundary prohibitions are acceptable only when the surrounding sentence clearly says they are forbidden.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/domain/types.ts src/domain/trustedContent.ts src/domain/trustedContent.test.ts docs/superpowers/checklists/safety-sensitive-copy.md README.md docs_cn/使用文档.md
git commit -m "docs: add safety trust content boundary"
```

## Task 7: Full Verification

**Files:**
- Modify: `e2e/mvp.spec.ts`
- Modify: `e2e/app.spec.ts`

- [ ] **Step 1: Add E2E safety scenario**

In `e2e/mvp.spec.ts`, add an E2E that completes profile setup, opens chat, sends an urgent Chinese risk message, and verifies deterministic care guidance appears. Use existing profile setup helpers already present in the file. The assertion block should include:

```ts
await expect(page.getByText('当地急救')).toBeVisible();
await expect(page.getByText('本内容仅提供健康管理参考，不作为医疗诊断。')).toBeVisible();
```

- [ ] **Step 2: Run E2E to verify it fails or passes based on current behavior**

Run:

```bash
npm run e2e
```

Expected: PASS after Tasks 1-6 because urgent chat renders the standardized text from `buildSafetyDisplayCopy`.

- [ ] **Step 3: Run complete verification**

Run:

```bash
npm test
npm run build
npm run e2e
```

Expected:

```text
Test Files  all passed
✓ built
8+ passed
```

- [ ] **Step 4: Commit verification updates**

Run:

```bash
git add e2e/mvp.spec.ts e2e/app.spec.ts
git commit -m "test: cover safety trust user path"
```

## Self-Review Checklist

- Spec coverage: Phase 1 safety trust is covered by shared context, display copy, reusable UI, page integration, API/prompt boundary, trusted content, sensitive-copy checklist, and verification.
- Scope control: This plan does not add accounts, cloud sync, medical-platform integration, real push notifications, clinical triage, paid referral, or backend health records.
- Type consistency: `UserSleepContext`, `SafetyDisplayCopy`, `CareAction`, and optional `ProgramPromptContext.safetyTriage` are defined before use.
- Verification: Every implementation task has a targeted test command and a commit step; final verification runs `npm test`, `npm run build`, and `npm run e2e`.
