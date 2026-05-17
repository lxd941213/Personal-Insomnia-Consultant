# 14-Day Sleep Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first 14-day sleep improvement program that gives users one daily task, captures lightweight feedback, shows progress and trends, and keeps safety gates deterministic.

**Architecture:** Add a focused program domain module for deterministic rules and derived state. Keep persistence in `src/storage/localStore.ts`, reuse existing profile, assessment, diary, trend, personalization, chat, and knowledge patterns, and update pages by composing domain outputs instead of embedding business rules in components.

**Tech Stack:** React 19, TypeScript 6, Vite, Vitest, React Testing Library, localStorage-backed persistence, Vercel serverless API functions.

---

## File Structure

- Create `src/domain/program.ts`: 14-day task template, safety gate, program creation, task status resolution, completion metrics, review cards, and prompt context formatting helpers.
- Create `src/domain/program.test.ts`: unit tests for program creation, safety gates, today's task, logs, streaks, fallback actions, and review data.
- Create `src/domain/trustedContent.ts`: deterministic knowledge cards derived from trusted internal content.
- Create `src/domain/trustedContent.test.ts`: unit tests for core content cards and safety-first cards.
- Modify `src/domain/types.ts`: add program, task-log, task-summary, trusted-content, and AI program context types.
- Modify `src/storage/localStore.ts`: add program and task-log read/write functions and reset coverage.
- Modify `src/storage/localStore.test.ts`: verify program and task-log persistence and reset.
- Modify `src/components/TodayPage.tsx`: show the daily program card, result form, safety state, and task-aware AI entry.
- Modify `src/components/TodayPage.test.tsx`: verify day 1 rendering, completion persistence, skip persistence, safety state, and task-aware chat callback.
- Modify `src/components/PlansPage.tsx`: replace the old 7-day personalization section with a 14-day timeline while retaining recommendations and all plans.
- Modify `src/components/PlansPage.test.tsx`: verify timeline, status labels, evidence labels, and safety state.
- Modify `src/components/TrendsPage.tsx`: include program completion metrics and conservative insight copy.
- Modify `src/components/TrendsPage.test.tsx`: verify insufficient data, completion-rate display, and conservative trend copy.
- Modify `src/components/KnowledgePage.tsx`: load trusted core cards before optional AI-generated cards.
- Modify `src/components/KnowledgePage.test.tsx`: verify trusted cards render without calling AI and AI supplemental cards remain available.
- Modify `src/App.tsx`, `src/api/chatClient.ts`, `src/components/ChatPage.tsx`, `api/chatLogic.ts`, `api/prompt.ts`, and `api/prompt.test.ts`: pass optional program context to chat prompt, support task-aware AI entry, and preserve safety boundaries.
- Modify `src/styles.css`: style program cards, timeline status, evidence labels, compact result form, and trend metrics using the current Night Serenity theme.
- Modify `README.md` and `docs_cn/使用文档.md`: document the 14-day program behavior after implementation.

## Task 1: Program Types And Domain Rules

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/program.ts`
- Create: `src/domain/program.test.ts`

- [ ] **Step 1: Add failing tests for the program domain**

Add `src/domain/program.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildProgramContextForPrompt,
  buildProgramReview,
  buildProgramStats,
  createSleepProgram,
  getProgramTaskTemplate,
  resolveProgramState,
  resolveTodayProgramTask,
} from './program';
import type { AssessmentResult, DailyTaskLog, SleepProfile } from './types';

const baseProfile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:30',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '较高',
  habits: ['睡前玩手机'],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

const mildAssessment: AssessmentResult = {
  completedAt: '2026-05-09T00:00:00.000Z',
  isi: { answers: [], score: 10, level: 'mild', summary: '轻度失眠' },
  psqiLite: { answers: [], score: 7, level: 'fair', summary: '一般' },
  riskFlags: [],
};

function log(day: number, status: 'completed' | 'skipped', date = `2026-05-${String(day).padStart(2, '0')}`): DailyTaskLog {
  return {
    id: `log-${day}`,
    programId: 'program-1',
    day,
    date,
    status,
    difficulty: status === 'completed' ? 'ok' : 'hard',
    sleepQuality: 6,
    sleepLatencyMinutes: 30,
    awakenings: 1,
    daytimeEnergy: '一般',
    note: '',
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
    version: 1,
  };
}

describe('program domain', () => {
  it('defines a complete 14-day template with evidence labels and fallback actions', () => {
    const template = getProgramTaskTemplate();

    expect(template).toHaveLength(14);
    expect(template[0]).toMatchObject({
      day: 1,
      evidenceLabel: '睡眠卫生',
      estimatedMinutes: expect.any(Number),
    });
    expect(template[7]).toMatchObject({
      day: 8,
      evidenceLabel: 'CBT-I',
    });
    expect(template.every((task) => task.fallbackAction.length > 0)).toBe(true);
  });

  it('creates an active program for normal-risk users', () => {
    const program = createSleepProgram({
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      now: new Date('2026-05-10T08:00:00.000Z'),
    });

    expect(program.status).toBe('active');
    expect(program.currentDay).toBe(1);
    expect(program.templateId).toBe('cbti_foundation_14_day');
  });

  it('marks the program as needs_care for urgent safety signals', () => {
    const program = createSleepProgram({
      profile: { ...baseProfile, safetySignals: ['疑似睡眠呼吸暂停'] },
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      now: new Date('2026-05-10T08:00:00.000Z'),
    });

    expect(program.status).toBe('needs_care');
  });

  it('marks the program as needs_care for severe ISI', () => {
    const program = createSleepProgram({
      profile: baseProfile,
      assessmentResult: {
        ...mildAssessment,
        isi: { answers: [], score: 23, level: 'severe', summary: '重度失眠' },
      },
      diarySummary: undefined,
      now: new Date('2026-05-10T08:00:00.000Z'),
    });

    expect(program.status).toBe('needs_care');
  });

  it('resolves today task and marks completed days from logs', () => {
    const program = createSleepProgram({
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      now: new Date('2026-05-10T08:00:00.000Z'),
    });
    const state = resolveProgramState({
      program,
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      logs: [log(1, 'completed'), log(2, 'completed')],
      today: '2026-05-12',
    });

    expect(state.program.currentDay).toBe(3);
    expect(resolveTodayProgramTask(state).task.day).toBe(3);
    expect(resolveTodayProgramTask(state).status).toBe('today');
  });

  it('calculates streak, completion rate, and fallback recommendation', () => {
    const stats = buildProgramStats([log(1, 'completed'), log(2, 'skipped'), log(3, 'skipped')]);

    expect(stats.completedCount).toBe(1);
    expect(stats.skippedCount).toBe(2);
    expect(stats.completionRate).toBe(33);
    expect(stats.currentStreak).toBe(0);
    expect(stats.needsFallback).toBe(true);
  });

  it('builds review data for day 7 and day 14 without over-attribution', () => {
    const review = buildProgramReview([1, 2, 3, 4, 5, 6, 7].map((day) => log(day, 'completed')), 7);

    expect(review).toEqual({
      title: '第 1 周复盘',
      summary: '已完成 7 个任务，完成率 100%。睡眠变化需要结合更多记录继续观察。',
      nextStep: '继续进入第 2 周，重点观察夜醒、担忧和刺激控制相关任务。',
    });
  });

  it('formats compact program context for AI prompt', () => {
    const context = buildProgramContextForPrompt({
      currentDay: 3,
      todayTask: getProgramTaskTemplate()[2],
      stats: buildProgramStats([log(1, 'completed'), log(2, 'skipped')]),
      safetyStatus: 'active',
    });

    expect(context).toContain('当前 14 天改善计划：第 3 天');
    expect(context).toContain('今日任务');
    expect(context).toContain('禁止覆盖安全分流规则');
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
npm test -- src/domain/program.test.ts
```

Expected: FAIL because `src/domain/program.ts`, `DailyTaskLog`, and program types do not exist.

- [ ] **Step 3: Add program types**

Append these exports to `src/domain/types.ts` after `PersonalizedSleepProfile`:

```ts
export type ProgramStatus = 'active' | 'completed' | 'paused' | 'needs_care';
export type TaskStatus = 'locked' | 'today' | 'completed' | 'skipped';
export type ProgramTemplateId = 'cbti_foundation_14_day';
export type ProgramTaskCategory = 'cbti' | 'sleep_hygiene' | 'relaxation' | 'schedule' | 'nutrition' | 'wellness';
export type EvidenceLabel = 'CBT-I' | '睡眠卫生' | '放松训练' | '饮食作息' | '养生参考';

export interface SleepProgram extends SyncRecord {
  startedAt: string;
  currentDay: number;
  status: ProgramStatus;
  templateId: ProgramTemplateId;
}

export interface ProgramTask {
  day: number;
  title: string;
  category: ProgramTaskCategory;
  evidenceLabel: EvidenceLabel;
  estimatedMinutes: number;
  rationale: string;
  action: string;
  fallbackAction: string;
  safetyNote: string | null;
}

export interface DailyTaskLog extends SyncRecord {
  programId: string;
  day: number;
  date: string;
  status: 'completed' | 'skipped';
  difficulty: 'easy' | 'ok' | 'hard' | null;
  sleepQuality: number | null;
  sleepLatencyMinutes: number | null;
  awakenings: number | null;
  daytimeEnergy: string;
  note: string;
}

export interface ProgramStats {
  completedCount: number;
  skippedCount: number;
  completionRate: number;
  currentStreak: number;
  needsFallback: boolean;
}

export interface ProgramReview {
  title: string;
  summary: string;
  nextStep: string;
}

export interface ResolvedProgramState {
  program: SleepProgram;
  tasks: Array<ProgramTask & { status: TaskStatus }>;
  stats: ProgramStats;
  safetyReasons: string[];
}

export interface ProgramPromptContext {
  currentDay: number;
  todayTask: ProgramTask;
  stats: ProgramStats;
  safetyStatus: ProgramStatus;
}
```

- [ ] **Step 4: Implement the program domain**

Create `src/domain/program.ts`:

```ts
import { buildPersonalizationProfile } from './personalization';
import type {
  AssessmentResult,
  DailyTaskLog,
  DiarySummary,
  ProgramPromptContext,
  ProgramReview,
  ProgramStats,
  ProgramStatus,
  ProgramTask,
  ResolvedProgramState,
  SleepProgram,
  SleepProfile,
  TaskStatus,
} from './types';

interface ProgramInput {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary: DiarySummary | undefined;
}

interface CreateProgramInput extends ProgramInput {
  now?: Date;
}

interface ResolveProgramInput extends ProgramInput {
  program: SleepProgram;
  logs: DailyTaskLog[];
  today: string;
}

const template: ProgramTask[] = [
  {
    day: 1,
    title: '睡眠环境重置',
    category: 'sleep_hygiene',
    evidenceLabel: '睡眠卫生',
    estimatedMinutes: 10,
    rationale: '先减少光线、噪音和电子设备刺激，让卧室重新和睡眠建立关联。',
    action: '今晚睡前整理床边环境，调暗灯光，把手机放到离床至少一臂之外的位置。',
    fallbackAction: '如果时间很少，只完成调暗灯光和手机远离床边这两件事。',
    safetyNote: null,
  },
  {
    day: 2,
    title: '固定起床时间',
    category: 'schedule',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 5,
    rationale: '稳定起床时间通常比强迫自己早睡更容易帮助昼夜节律重新稳定。',
    action: '选择明天可以坚持的起床时间，周末浮动不超过 1 小时。',
    fallbackAction: '如果无法固定完整起床时间，先固定起床后 15 分钟内离床。',
    safetyNote: null,
  },
  {
    day: 3,
    title: '睡前手机边界',
    category: 'sleep_hygiene',
    evidenceLabel: '睡眠卫生',
    estimatedMinutes: 5,
    rationale: '睡前高刺激内容会提高觉醒水平，让入睡更困难。',
    action: '睡前 30 分钟停止刷短视频、工作消息和刺激内容。',
    fallbackAction: '如果无法完全停止，把屏幕调暗并只保留低刺激内容。',
    safetyNote: null,
  },
  {
    day: 4,
    title: '咖啡因和晚餐边界',
    category: 'nutrition',
    evidenceLabel: '饮食作息',
    estimatedMinutes: 5,
    rationale: '咖啡因、晚餐过晚和过饱都可能影响入睡和夜间舒适度。',
    action: '今天午后减少咖啡、浓茶、奶茶和能量饮料，睡前 3 小时避免过饱进食。',
    fallbackAction: '如果已经摄入咖啡因，记录时间和今晚入睡耗时。',
    safetyNote: '已有慢性疾病、孕期或正在用药时，饮食调整以医生建议为准。',
  },
  {
    day: 5,
    title: '短放松练习',
    category: 'relaxation',
    evidenceLabel: '放松训练',
    estimatedMinutes: 4,
    rationale: '短时呼吸练习可以降低睡前紧张和躯体唤醒。',
    action: '睡前做 4 轮 4-7-8 呼吸，屏息不适时改为自然慢呼吸。',
    fallbackAction: '如果屏息不舒服，只做 2 分钟慢呼气练习。',
    safetyNote: '呼吸练习出现头晕、胸闷或明显不适时立即停止。',
  },
  {
    day: 6,
    title: '晨间光照和白天活动',
    category: 'schedule',
    evidenceLabel: '睡眠卫生',
    estimatedMinutes: 15,
    rationale: '白天光照和活动能帮助身体区分清醒与睡眠时段。',
    action: '起床后尽量接触自然光，白天安排一次 10-15 分钟轻度活动。',
    fallbackAction: '如果无法外出，在窗边活动 5 分钟并避免白天长时间卧床。',
    safetyNote: '运动强度按自身疾病、疼痛和医生建议调整。',
  },
  {
    day: 7,
    title: '第 1 周复盘',
    category: 'wellness',
    evidenceLabel: '养生参考',
    estimatedMinutes: 8,
    rationale: '复盘能帮助识别最容易坚持的动作，而不是追求一次解决所有问题。',
    action: '回顾本周完成情况，选出 1 个最有效、1 个最难坚持的动作。',
    fallbackAction: '如果没有完整记录，只写下这周最影响睡眠的一个因素。',
    safetyNote: '复盘只用于健康管理参考，不判断疾病或疗效。',
  },
  {
    day: 8,
    title: '刺激控制入门',
    category: 'cbti',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 10,
    rationale: '刺激控制用于减少床与清醒焦虑之间的关联。',
    action: '上床后长时间清醒时，离床做低刺激活动，困意回来再上床。',
    fallbackAction: '如果离床很困难，先坐起并做 3 分钟低刺激阅读。',
    safetyNote: '行动时注意跌倒风险，夜间起身保持照明安全。',
  },
  {
    day: 9,
    title: '睡眠效率观察',
    category: 'cbti',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 6,
    rationale: '观察床上时间和实际睡眠时间，有助于理解睡眠效率。',
    action: '记录昨晚上床时间、估计入睡时间、起床时间和夜醒次数。',
    fallbackAction: '如果记不清，只记录大致入睡耗时和主观睡眠质量。',
    safetyNote: '本功能不做睡眠限制处方，只做观察和教育。',
  },
  {
    day: 10,
    title: '担忧书写',
    category: 'cbti',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 8,
    rationale: '把担忧提前写下来，可以减少上床后反复思考。',
    action: '睡前 1 小时写下 3 个担忧和明天可执行的下一步。',
    fallbackAction: '如果不想写长内容，只写一个最困扰的问题和一个最小行动。',
    safetyNote: '出现强烈自伤想法或无法控制的痛苦时，应及时寻求专业帮助。',
  },
  {
    day: 11,
    title: '夜醒应对',
    category: 'cbti',
    evidenceLabel: 'CBT-I',
    estimatedMinutes: 5,
    rationale: '夜醒后的焦虑和看时间行为会进一步强化清醒。',
    action: '夜醒后避免反复看时间，用低刺激方式等待困意回来。',
    fallbackAction: '如果忍不住看时间，把手机和时钟放到不易看到的位置。',
    safetyNote: '夜间伴随胸痛、憋醒、呼吸困难时优先专业评估。',
  },
  {
    day: 12,
    title: '渐进放松或正念',
    category: 'relaxation',
    evidenceLabel: '放松训练',
    estimatedMinutes: 10,
    rationale: '更完整的放松训练可以帮助识别并释放肌肉紧张。',
    action: '完成一次渐进式肌肉放松或身体扫描。',
    fallbackAction: '如果没有 10 分钟，只做肩颈和下颌放松各 1 分钟。',
    safetyNote: '身体疼痛、损伤或不适部位不要用力紧张肌肉。',
  },
  {
    day: 13,
    title: '晚间流程微调',
    category: 'wellness',
    evidenceLabel: '养生参考',
    estimatedMinutes: 12,
    rationale: '固定、温和、可重复的晚间流程比临睡前补救更稳定。',
    action: '选择温水洗漱、泡脚、轻拉伸或低刺激阅读中的 1-2 项组成睡前流程。',
    fallbackAction: '如果今天很忙，只保留温水洗漱和调暗灯光。',
    safetyNote: '泡脚温度避免过热；糖尿病、感觉异常或循环问题用户需谨慎。',
  },
  {
    day: 14,
    title: '第 2 周复盘和下一步',
    category: 'wellness',
    evidenceLabel: '养生参考',
    estimatedMinutes: 10,
    rationale: '两周结束后应保留有效动作，并判断是否需要专业评估。',
    action: '查看两周任务完成率和睡眠记录，选择下周继续坚持的 2 个动作。',
    fallbackAction: '如果改善不明显，整理记录并考虑咨询睡眠门诊或专业人士。',
    safetyNote: '持续严重失眠、明显日间功能受损或风险信号应优先专业评估。',
  },
];

export function getProgramTaskTemplate(): ProgramTask[] {
  return template.map((task) => ({ ...task }));
}

function nowIso(now = new Date()): string {
  return now.toISOString();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function safetyReasons(input: ProgramInput): string[] {
  const personalization = buildPersonalizationProfile({
    profile: input.profile,
    assessmentResult: input.assessmentResult,
    diarySummary: input.diarySummary,
  });

  const reasons = [...personalization.careAdvice.reasons];
  if (input.assessmentResult?.isi.level === 'severe') {
    reasons.push('失眠严重程度为重度');
  }
  return unique(reasons);
}

function statusFromSafety(input: ProgramInput): ProgramStatus {
  return safetyReasons(input).length > 0 ? 'needs_care' : 'active';
}

export function createSleepProgram(input: CreateProgramInput): SleepProgram {
  const iso = nowIso(input.now);
  return {
    id: `program-${iso.slice(0, 10)}`,
    startedAt: iso,
    currentDay: 1,
    status: statusFromSafety(input),
    templateId: 'cbti_foundation_14_day',
    createdAt: iso,
    updatedAt: iso,
    version: 1,
  };
}

function latestLogsByDay(logs: DailyTaskLog[]): Map<number, DailyTaskLog> {
  const map = new Map<number, DailyTaskLog>();
  for (const entry of logs) {
    const previous = map.get(entry.day);
    if (!previous || entry.updatedAt >= previous.updatedAt) {
      map.set(entry.day, entry);
    }
  }
  return map;
}

export function buildProgramStats(logs: DailyTaskLog[]): ProgramStats {
  const latest = Array.from(latestLogsByDay(logs).values()).sort((a, b) => a.day - b.day);
  const completedCount = latest.filter((entry) => entry.status === 'completed').length;
  const skippedCount = latest.filter((entry) => entry.status === 'skipped').length;
  const total = completedCount + skippedCount;
  const completionRate = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  let currentStreak = 0;
  for (let index = latest.length - 1; index >= 0; index -= 1) {
    if (latest[index].status !== 'completed') break;
    currentStreak += 1;
  }

  const recentHardOrSkipped = latest
    .slice(-3)
    .filter((entry) => entry.status === 'skipped' || entry.difficulty === 'hard').length;

  return {
    completedCount,
    skippedCount,
    completionRate,
    currentStreak,
    needsFallback: recentHardOrSkipped >= 2,
  };
}

function nextDayFromLogs(logs: DailyTaskLog[]): number {
  const latest = latestLogsByDay(logs);
  for (let day = 1; day <= template.length; day += 1) {
    if (!latest.has(day)) return day;
  }
  return template.length;
}

export function resolveProgramState(input: ResolveProgramInput): ResolvedProgramState {
  const reasons = safetyReasons(input);
  const stats = buildProgramStats(input.logs);
  const nextDay = nextDayFromLogs(input.logs);
  const allDone = latestLogsByDay(input.logs).size >= template.length;
  const status: ProgramStatus = reasons.length > 0
    ? 'needs_care'
    : allDone
      ? 'completed'
      : input.program.status === 'paused'
        ? 'paused'
        : 'active';
  const program: SleepProgram = {
    ...input.program,
    currentDay: nextDay,
    status,
  };
  const latest = latestLogsByDay(input.logs);
  const tasks = template.map((task) => {
    let statusForTask: TaskStatus = 'locked';
    const log = latest.get(task.day);
    if (log) statusForTask = log.status;
    else if (task.day === nextDay && status === 'active') statusForTask = 'today';
    return { ...task, status: statusForTask };
  });

  return { program, tasks, stats, safetyReasons: reasons };
}

export function resolveTodayProgramTask(state: ResolvedProgramState): { task: ProgramTask; status: TaskStatus } {
  const current = state.tasks.find((task) => task.day === state.program.currentDay) ?? state.tasks[state.tasks.length - 1];
  return { task: current, status: current.status };
}

export function buildProgramReview(logs: DailyTaskLog[], day: 7 | 14): ProgramReview {
  const stats = buildProgramStats(logs.filter((entry) => entry.day <= day));
  if (day === 7) {
    return {
      title: '第 1 周复盘',
      summary: `已完成 ${stats.completedCount} 个任务，完成率 ${stats.completionRate}%。睡眠变化需要结合更多记录继续观察。`,
      nextStep: '继续进入第 2 周，重点观察夜醒、担忧和刺激控制相关任务。',
    };
  }
  return {
    title: '第 2 周复盘',
    summary: `两周内已完成 ${stats.completedCount} 个任务，完成率 ${stats.completionRate}%。如果症状仍明显影响白天功能，建议考虑专业评估。`,
    nextStep: '保留最容易坚持的 2 个动作，并继续记录睡眠质量、入睡耗时和白天精神状态。',
  };
}

export function buildProgramContextForPrompt(context: ProgramPromptContext): string {
  return [
    '=== 当前 14 天改善计划 ===',
    `当前 14 天改善计划：第 ${context.currentDay} 天`,
    `计划状态：${context.safetyStatus}`,
    `今日任务：${context.todayTask.title}`,
    `依据标签：${context.todayTask.evidenceLabel}`,
    `任务动作：${context.todayTask.action}`,
    `替代动作：${context.todayTask.fallbackAction}`,
    `完成情况：已完成 ${context.stats.completedCount} 个，跳过 ${context.stats.skippedCount} 个，完成率 ${context.stats.completionRate}%`,
    '边界：禁止覆盖安全分流规则；禁止诊断；禁止药物或补充剂剂量；中医内容只能作为养生参考。',
  ].join('\n');
}
```

- [ ] **Step 5: Run domain tests**

Run:

```bash
npm test -- src/domain/program.test.ts
```

Expected: PASS for all tests in `src/domain/program.test.ts`.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add src/domain/types.ts src/domain/program.ts src/domain/program.test.ts
git commit -m "feat: add sleep program domain"
```

Expected: commit succeeds.

## Task 2: Program Local Persistence

**Files:**
- Modify: `src/storage/localStore.ts`
- Modify: `src/storage/localStore.test.ts`

- [ ] **Step 1: Add failing storage tests**

Append to `src/storage/localStore.test.ts`:

```ts
import type { DailyTaskLog, SleepProgram } from '../domain/types';
import {
  getDailyTaskLogs,
  getSleepProgram,
  saveDailyTaskLogs,
  saveSleepProgram,
} from './localStore';

describe('program storage', () => {
  it('saves and reads the active sleep program', () => {
    clearAllLocalData();
    const program: SleepProgram = {
      id: 'program-1',
      startedAt: '2026-05-10T08:00:00.000Z',
      currentDay: 1,
      status: 'active',
      templateId: 'cbti_foundation_14_day',
      createdAt: '2026-05-10T08:00:00.000Z',
      updatedAt: '2026-05-10T08:00:00.000Z',
      version: 1,
    };

    saveSleepProgram(program);

    expect(getSleepProgram()).toEqual(program);
  });

  it('saves daily task logs and clears them with reset', () => {
    clearAllLocalData();
    const logs: DailyTaskLog[] = [{
      id: 'log-1',
      programId: 'program-1',
      day: 1,
      date: '2026-05-10',
      status: 'completed',
      difficulty: 'ok',
      sleepQuality: 6,
      sleepLatencyMinutes: 30,
      awakenings: 1,
      daytimeEnergy: '一般',
      note: '',
      createdAt: '2026-05-10T08:00:00.000Z',
      updatedAt: '2026-05-10T08:00:00.000Z',
      version: 1,
    }];

    saveDailyTaskLogs(logs);
    expect(getDailyTaskLogs()).toEqual(logs);

    clearAllLocalData();
    expect(getSleepProgram()).toBeNull();
    expect(getDailyTaskLogs()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run storage tests to verify they fail**

Run:

```bash
npm test -- src/storage/localStore.test.ts
```

Expected: FAIL because `getSleepProgram`, `saveSleepProgram`, `getDailyTaskLogs`, and `saveDailyTaskLogs` are not exported.

- [ ] **Step 3: Add storage keys and functions**

Modify `src/storage/localStore.ts`:

```ts
import type {
  AssessmentResult,
  ChatMessage,
  DailyTaskLog,
  FeedbackEvent,
  KnowledgeResponse,
  RelaxationSession,
  ReminderSettings,
  SleepDiaryEntry,
  SleepProfile,
  SleepProgram,
  SleepScenario,
} from '../domain/types';
```

Add keys inside `keys`:

```ts
  sleepProgram: 'sleepProgram',
  dailyTaskLogs: 'dailyTaskLogs',
```

Add functions near the diary functions:

```ts
export function getSleepProgram(): SleepProgram | null {
  return readJson<SleepProgram | null>(keys.sleepProgram, null);
}

export function saveSleepProgram(program: SleepProgram): void {
  writeJson(keys.sleepProgram, program);
}

export function getDailyTaskLogs(): DailyTaskLog[] {
  return readJson<DailyTaskLog[]>(keys.dailyTaskLogs, []);
}

export function saveDailyTaskLogs(logs: DailyTaskLog[]): void {
  writeJson(keys.dailyTaskLogs, logs);
}
```

Add to `clearAllLocalData()`:

```ts
  removeKey(keys.sleepProgram);
  removeKey(keys.dailyTaskLogs);
```

- [ ] **Step 4: Run storage tests**

Run:

```bash
npm test -- src/storage/localStore.test.ts
```

Expected: PASS for storage tests.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add src/storage/localStore.ts src/storage/localStore.test.ts
git commit -m "feat: persist sleep program locally"
```

Expected: commit succeeds.

## Task 3: Today Page Daily Task Loop

**Files:**
- Modify: `src/components/TodayPage.tsx`
- Modify: `src/components/TodayPage.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add failing TodayPage tests**

Append to `src/components/TodayPage.test.tsx`:

```ts
import { getDailyTaskLogs, getSleepProgram } from '../storage/localStore';

it('shows day 1 program task and saves completion feedback', async () => {
  const user = userEvent.setup();
  render(
    <TodayPage
      profile={profile}
      assessmentResult={null}
      onOpenChat={vi.fn()}
      onOpenAssessment={vi.fn()}
      onOpenKnowledge={vi.fn()}
      onOpenRelaxation={vi.fn()}
      onOpenDiary={vi.fn()}
      today="2026-05-10"
    />,
  );

  expect(screen.getByText('14 天改善计划')).toBeInTheDocument();
  expect(screen.getByText(/第 1 天/)).toBeInTheDocument();
  expect(screen.getByText('睡眠环境重置')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '完成今日任务' }));
  await user.click(screen.getByLabelText('睡眠质量 7 分'));
  await user.clear(screen.getByLabelText('入睡耗时'));
  await user.type(screen.getByLabelText('入睡耗时'), '25');
  await user.click(screen.getByRole('button', { name: '保存反馈' }));

  expect(getSleepProgram()?.currentDay).toBe(1);
  expect(getDailyTaskLogs()).toHaveLength(1);
  expect(getDailyTaskLogs()[0]).toMatchObject({
    day: 1,
    status: 'completed',
    sleepQuality: 7,
    sleepLatencyMinutes: 25,
  });
});

it('saves a skipped task with hard difficulty', async () => {
  const user = userEvent.setup();
  render(
    <TodayPage
      profile={profile}
      assessmentResult={null}
      onOpenChat={vi.fn()}
      onOpenAssessment={vi.fn()}
      onOpenKnowledge={vi.fn()}
      onOpenRelaxation={vi.fn()}
      onOpenDiary={vi.fn()}
      today="2026-05-10"
    />,
  );

  await user.click(screen.getByRole('button', { name: '今天跳过' }));
  await user.click(screen.getByRole('button', { name: '偏难' }));
  await user.click(screen.getByRole('button', { name: '保存反馈' }));

  expect(getDailyTaskLogs()[0]).toMatchObject({
    day: 1,
    status: 'skipped',
    difficulty: 'hard',
  });
});

it('shows professional evaluation guidance for safety-gated profiles', () => {
  render(
    <TodayPage
      profile={{ ...profile, safetySignals: ['疑似睡眠呼吸暂停'] }}
      assessmentResult={null}
      onOpenChat={vi.fn()}
      onOpenAssessment={vi.fn()}
      onOpenKnowledge={vi.fn()}
      onOpenRelaxation={vi.fn()}
      onOpenDiary={vi.fn()}
      today="2026-05-10"
    />,
  );

  expect(screen.getByText('优先进行专业评估')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '完成今日任务' })).not.toBeInTheDocument();
});

it('opens AI chat with a task-aware initial question', async () => {
  const user = userEvent.setup();
  const onOpenChat = vi.fn();
  render(
    <TodayPage
      profile={profile}
      assessmentResult={null}
      onOpenChat={onOpenChat}
      onOpenAssessment={vi.fn()}
      onOpenKnowledge={vi.fn()}
      onOpenRelaxation={vi.fn()}
      onOpenDiary={vi.fn()}
      today="2026-05-10"
    />,
  );

  await user.click(screen.getByRole('button', { name: '问 AI' }));

  expect(onOpenChat).toHaveBeenCalledWith(undefined, '请解释今天的睡眠改善任务：睡眠环境重置，并告诉我如果做不到应该怎么简化。');
});
```

- [ ] **Step 2: Run TodayPage tests to verify they fail**

Run:

```bash
npm test -- src/components/TodayPage.test.tsx
```

Expected: FAIL because TodayPage does not render the program card and feedback form.

- [ ] **Step 3: Add program state and save helpers in TodayPage**

Modify imports in `src/components/TodayPage.tsx`:

```ts
import type { AssessmentResult, DailyTaskLog, SleepProfile, SleepScenario } from '../domain/types';
import {
  buildProgramStats,
  createSleepProgram,
  resolveProgramState,
  resolveTodayProgramTask,
} from '../domain/program';
import {
  getDailyTaskLogs,
  getReminderSettings,
  getSleepProgram,
  saveDailyTaskLogs,
  saveReminderSettings,
  saveSleepProgram,
} from '../storage/localStore';
```

Update the `TodayPageProps` callback type:

```ts
  onOpenChat: (scenario?: SleepScenario, initialInput?: string) => void;
```

Add local state inside the component:

```ts
  const [program, setProgram] = useState(() => {
    const existing = getSleepProgram();
    if (existing) return existing;
    const created = createSleepProgram({ profile, assessmentResult, diarySummary: undefined });
    saveSleepProgram(created);
    return created;
  });
  const [taskLogs, setTaskLogs] = useState<DailyTaskLog[]>(() => getDailyTaskLogs());
  const [pendingTaskStatus, setPendingTaskStatus] = useState<'completed' | 'skipped' | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'ok' | 'hard' | null>('ok');
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [sleepLatencyMinutes, setSleepLatencyMinutes] = useState('');
  const [awakenings, setAwakenings] = useState('');
  const [daytimeEnergy, setDaytimeEnergy] = useState('一般');
  const [note, setNote] = useState('');

  const programState = resolveProgramState({
    program,
    profile,
    assessmentResult,
    diarySummary: undefined,
    logs: taskLogs,
    today,
  });
  const todayTask = resolveTodayProgramTask(programState);
  const programStats = buildProgramStats(taskLogs);
```

Add `saveTaskLog` inside the component:

```ts
  function saveTaskLog() {
    if (!pendingTaskStatus) return;
    const iso = new Date().toISOString();
    const log: DailyTaskLog = {
      id: `task-${todayTask.task.day}-${today}`,
      programId: program.id,
      day: todayTask.task.day,
      date: today,
      status: pendingTaskStatus,
      difficulty,
      sleepQuality,
      sleepLatencyMinutes: sleepLatencyMinutes ? Number(sleepLatencyMinutes) : null,
      awakenings: awakenings ? Number(awakenings) : null,
      daytimeEnergy,
      note,
      createdAt: iso,
      updatedAt: iso,
      version: 1,
    };
    const nextLogs = [
      ...taskLogs.filter((entry) => !(entry.programId === program.id && entry.day === log.day && entry.date === log.date)),
      log,
    ];
    setTaskLogs(nextLogs);
    saveDailyTaskLogs(nextLogs);

    const nextProgram = resolveProgramState({
      program,
      profile,
      assessmentResult,
      diarySummary: undefined,
      logs: nextLogs,
      today,
    }).program;
    setProgram(nextProgram);
    saveSleepProgram({ ...nextProgram, updatedAt: iso, version: nextProgram.version + 1 });
    setPendingTaskStatus(null);
  }
```

- [ ] **Step 4: Render program card before the existing quick consultation section**

Insert this section after the sticky header in `src/components/TodayPage.tsx`:

```tsx
      <section className="program-card">
        <div className="section-header">
          <h2>14 天改善计划</h2>
          <span className="section-count">
            第 {programState.program.currentDay} 天 / 14 天
          </span>
        </div>

        {programState.program.status === 'needs_care' ? (
          <article className="program-task-card high-risk">
            <span className="evidence-label">安全优先</span>
            <h3>优先进行专业评估</h3>
            <p>你当前的档案包含需要优先排查的安全信号。建议先记录症状、准备问题，并咨询医生或睡眠门诊。</p>
            {programState.safetyReasons.length > 0 && (
              <p className="fine-print">原因：{programState.safetyReasons.join('；')}</p>
            )}
          </article>
        ) : (
          <article className="program-task-card">
            <div className="program-task-meta">
              <span className="evidence-label">{todayTask.task.evidenceLabel}</span>
              <span>{todayTask.task.estimatedMinutes} 分钟</span>
            </div>
            <h3>{todayTask.task.title}</h3>
            <p>{todayTask.task.rationale}</p>
            <p><strong>今日动作：</strong>{todayTask.task.action}</p>
            {programStats.needsFallback && (
              <p><strong>更轻量做法：</strong>{todayTask.task.fallbackAction}</p>
            )}
            {todayTask.task.safetyNote && <p className="fine-print">{todayTask.task.safetyNote}</p>}
            <div className="program-actions">
              <button type="button" className="primary-button" onClick={() => setPendingTaskStatus('completed')}>
                完成今日任务
              </button>
              <button type="button" className="action-btn" onClick={() => setPendingTaskStatus('skipped')}>
                今天跳过
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() => onOpenChat(
                  undefined,
                  `请解释今天的睡眠改善任务：${todayTask.task.title}，并告诉我如果做不到应该怎么简化。`,
                )}
              >
                问 AI
              </button>
            </div>
          </article>
        )}

        {pendingTaskStatus && (
          <div className="program-feedback">
            <h3>保存反馈</h3>
            <div className="segmented-row" aria-label="任务难度">
              {[
                ['easy', '轻松'],
                ['ok', '可以'],
                ['hard', '偏难'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={difficulty === value ? 'selected' : ''}
                  onClick={() => setDifficulty(value as 'easy' | 'ok' | 'hard')}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="quality-row">
              {[5, 6, 7, 8].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`睡眠质量 ${value} 分`}
                  className={sleepQuality === value ? 'selected' : ''}
                  onClick={() => setSleepQuality(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <label>
              入睡耗时
              <input value={sleepLatencyMinutes} onChange={(event) => setSleepLatencyMinutes(event.target.value)} inputMode="numeric" />
            </label>
            <label>
              夜醒次数
              <input value={awakenings} onChange={(event) => setAwakenings(event.target.value)} inputMode="numeric" />
            </label>
            <label>
              白天精神
              <input value={daytimeEnergy} onChange={(event) => setDaytimeEnergy(event.target.value)} />
            </label>
            <label>
              备注
              <textarea value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <button type="button" className="primary-button" onClick={saveTaskLog}>
              保存反馈
            </button>
          </div>
        )}
      </section>
```

- [ ] **Step 5: Add minimal styles**

Append to `src/styles.css`:

```css
.program-card,
.program-task-card,
.program-feedback {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.program-task-card {
  padding: 16px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--card-bg);
}

.program-task-card.high-risk {
  border-color: var(--high-risk-border);
  background: var(--high-risk-bg);
}

.program-task-meta,
.program-actions,
.segmented-row,
.quality-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.evidence-label {
  width: fit-content;
  padding: 4px 8px;
  border: 1px solid rgba(196, 167, 110, 0.4);
  border-radius: var(--radius-sm);
  color: var(--moonbeam);
  font-size: 12px;
  font-weight: 700;
}

.program-feedback {
  padding: 14px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
}

.segmented-row button.selected,
.quality-row button.selected {
  border-color: var(--moonbeam);
  color: var(--moonbeam);
}
```

- [ ] **Step 6: Run TodayPage tests**

Run:

```bash
npm test -- src/components/TodayPage.test.tsx
```

Expected: PASS for TodayPage tests.

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add src/components/TodayPage.tsx src/components/TodayPage.test.tsx src/styles.css
git commit -m "feat: add daily program task loop"
```

Expected: commit succeeds.

## Task 4: Plans Page 14-Day Timeline

**Files:**
- Modify: `src/components/PlansPage.tsx`
- Modify: `src/components/PlansPage.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Replace 7-day test expectations with 14-day timeline tests**

Update `src/components/PlansPage.test.tsx` so the second and third tests become:

```ts
it('renders the 14-day program timeline with evidence labels', () => {
  render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

  expect(screen.getByText('14天改善计划')).toBeInTheDocument();
  expect(screen.getByText(/第1天：睡眠环境重置/)).toBeInTheDocument();
  expect(screen.getByText(/第14天：第 2 周复盘和下一步/)).toBeInTheDocument();
  expect(screen.getAllByText('CBT-I').length).toBeGreaterThan(0);
  expect(screen.getAllByText('睡眠卫生').length).toBeGreaterThan(0);
});

it('shows professional evaluation guidance instead of timeline actions when care should come first', () => {
  render(
    <PlansPage
      profile={{ ...profile, safetySignals: ['疑似睡眠呼吸暂停'] }}
      assessmentResult={assessmentResult}
    />,
  );

  expect(screen.getAllByText('优先进行专业评估').length).toBeGreaterThan(0);
  expect(screen.queryByText(/第1天：睡眠环境重置/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run PlansPage tests to verify they fail**

Run:

```bash
npm test -- src/components/PlansPage.test.tsx
```

Expected: FAIL because PlansPage still renders the seven-day personalization plan.

- [ ] **Step 3: Use program domain and local program state in PlansPage**

Modify imports in `src/components/PlansPage.tsx`:

```ts
import { createSleepProgram, resolveProgramState } from '../domain/program';
import { getDailyTaskLogs, getDiaryEntries, getSleepProgram, saveSleepProgram } from '../storage/localStore';
```

Add after `diarySummary`:

```ts
  const existingProgram = getSleepProgram();
  const program = existingProgram ?? createSleepProgram({ profile, assessmentResult, diarySummary });
  if (!existingProgram) {
    saveSleepProgram(program);
  }
  const programState = resolveProgramState({
    program,
    profile,
    assessmentResult,
    diarySummary,
    logs: getDailyTaskLogs(),
    today: new Date().toISOString().slice(0, 10),
  });
```

Replace the existing "Seven day plan" section with:

```tsx
      {programState.program.status === 'needs_care' ? (
        <section>
          <div className="section-header">
            <h2>14天改善计划</h2>
          </div>
          <article className="plan-card-featured">
            <h3>优先进行专业评估</h3>
            <p>当前存在需要先排查的安全信号。建议先记录症状、准备问题，并咨询医生或睡眠门诊。</p>
            {programState.safetyReasons.length > 0 && (
              <p className="fine-print">原因：{programState.safetyReasons.join('；')}</p>
            )}
          </article>
        </section>
      ) : (
        <section>
          <div className="section-header">
            <h2>14天改善计划</h2>
            <span className="section-count">第 {programState.program.currentDay} 天 / 14 天</span>
          </div>
          <div className="program-timeline">
            {programState.tasks.map((item) => (
              <article key={item.day} className={`timeline-item ${item.status}`}>
                <div className="program-task-meta">
                  <span className="evidence-label">{item.evidenceLabel}</span>
                  <span className="task-status-label">{item.status}</span>
                </div>
                <h4>第{item.day}天：{item.title}</h4>
                <p>{item.rationale}</p>
                <p><strong>动作：</strong>{item.action}</p>
              </article>
            ))}
          </div>
        </section>
      )}
```

- [ ] **Step 4: Add timeline styles**

Append to `src/styles.css`:

```css
.program-timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.program-timeline .timeline-item {
  padding: 14px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--card-bg);
}

.program-timeline .timeline-item.today {
  border-color: rgba(196, 167, 110, 0.65);
}

.program-timeline .timeline-item.completed {
  border-color: rgba(94, 198, 142, 0.45);
}

.program-timeline .timeline-item.skipped {
  border-color: rgba(244, 177, 131, 0.45);
}

.task-status-label {
  color: var(--text-muted);
  font-size: 12px;
}
```

- [ ] **Step 5: Run PlansPage tests**

Run:

```bash
npm test -- src/components/PlansPage.test.tsx
```

Expected: PASS for PlansPage tests.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add src/components/PlansPage.tsx src/components/PlansPage.test.tsx src/styles.css
git commit -m "feat: show 14-day program timeline"
```

Expected: commit succeeds.

## Task 5: Trends Program Feedback

**Files:**
- Modify: `src/components/TrendsPage.tsx`
- Modify: `src/components/TrendsPage.test.tsx`

- [ ] **Step 1: Add failing trend tests**

Append to `src/components/TrendsPage.test.tsx`:

```ts
vi.mock('../storage/localStore', async () => {
  const actual = await vi.importActual<typeof import('../storage/localStore')>('../storage/localStore');
  return {
    ...actual,
    getDiaryEntries: vi.fn(() => []),
    getDailyTaskLogs: vi.fn(() => [{
      id: 'log-1',
      programId: 'program-1',
      day: 1,
      date: '2026-05-10',
      status: 'completed',
      difficulty: 'ok',
      sleepQuality: 7,
      sleepLatencyMinutes: 25,
      awakenings: 1,
      daytimeEnergy: '一般',
      note: '',
      createdAt: '2026-05-10T08:00:00.000Z',
      updatedAt: '2026-05-10T08:00:00.000Z',
      version: 1,
    }],
  };
});

it('renders program completion metrics and conservative insight copy', () => {
  render(<TrendsPage today="2026-05-10" />);

  expect(screen.getByText('改善执行')).toBeInTheDocument();
  expect(screen.getByText(/完成率 100%/)).toBeInTheDocument();
  expect(screen.getByText(/记录较少/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run TrendsPage tests to verify they fail**

Run:

```bash
npm test -- src/components/TrendsPage.test.tsx
```

Expected: FAIL because TrendsPage does not read daily task logs or render program metrics.

- [ ] **Step 3: Render program metrics**

Modify imports in `src/components/TrendsPage.tsx`:

```ts
import { getDailyTaskLogs, getDiaryEntries } from '../storage/localStore';
import { buildProgramStats } from '../domain/program';
```

Add after `trends`:

```ts
  const programLogs = getDailyTaskLogs();
  const programStats = buildProgramStats(programLogs);
  const programInsight = programLogs.length < 3
    ? '任务和睡眠记录较少，先继续完成每日任务，暂不判断改善趋势。'
    : `近阶段完成率 ${programStats.completionRate}%，睡眠变化需要结合入睡耗时、夜醒和白天精神继续观察。`;
```

Add this section after the metric grid:

```tsx
      <section className="metric-grid">
        <article className="metric-card">
          <h2>改善执行</h2>
          <p>完成率 {programStats.completionRate}%</p>
          <p>连续完成 {programStats.currentStreak} 天</p>
        </article>
        <article className="metric-card">
          <h2>任务反馈</h2>
          <p>完成 {programStats.completedCount} 个</p>
          <p>跳过 {programStats.skippedCount} 个</p>
        </article>
      </section>
      <p>{programInsight}</p>
```

- [ ] **Step 4: Run TrendsPage tests**

Run:

```bash
npm test -- src/components/TrendsPage.test.tsx
```

Expected: PASS for TrendsPage tests.

- [ ] **Step 5: Commit Task 5**

Run:

```bash
git add src/components/TrendsPage.tsx src/components/TrendsPage.test.tsx
git commit -m "feat: add program feedback to trends"
```

Expected: commit succeeds.

## Task 6: Trusted Knowledge Content

**Files:**
- Create: `src/domain/trustedContent.ts`
- Create: `src/domain/trustedContent.test.ts`
- Modify: `src/components/KnowledgePage.tsx`
- Modify: `src/components/KnowledgePage.test.tsx`

- [ ] **Step 1: Add trusted content tests**

Create `src/domain/trustedContent.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildTrustedKnowledgeResponse } from './trustedContent';

describe('trusted content', () => {
  it('builds deterministic cards for insomnia scenarios', () => {
    const response = buildTrustedKnowledgeResponse('hard_to_fall_asleep');

    expect(response.scenario).toBe('hard_to_fall_asleep');
    expect(response.cards.length).toBeGreaterThanOrEqual(2);
    expect(response.cards[0].title).toContain('固定起床');
    expect(response.disclaimer).toContain('不作为医疗诊断');
  });

  it('prioritizes safety card for medical triage', () => {
    const response = buildTrustedKnowledgeResponse('medical_triage');

    expect(response.cards[0].title).toBe('优先识别需要专业评估的信号');
    expect(response.cards[0].safetyNote).toContain('专业评估');
  });
});
```

Update `src/components/KnowledgePage.test.tsx` with these expectation changes:

```ts
import { generateKnowledgeCards } from '../api/knowledgeClient';
```

Replace the scenario-selection test body with:

```ts
  it('renders trusted knowledge cards without calling AI when scenario selected', async () => {
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

    expect(screen.getByText('固定起床时间是优先动作')).toBeInTheDocument();
    expect(screen.getByText('刺激控制减少床上的清醒焦虑')).toBeInTheDocument();
    expect(generateKnowledgeCards).not.toHaveBeenCalled();
  });
```

Replace the initial-scenario test body with:

```ts
  it('renders trusted cards when initialScenario is provided', async () => {
    render(
      <KnowledgePage
        profile={mockProfile}
        assessmentResult={mockAssessmentResult}
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('固定起床时间是优先动作')).toBeInTheDocument();
    expect(generateKnowledgeCards).not.toHaveBeenCalled();
  });
```

Replace the cached-card test with a supplemental-generation cache test:

```ts
  it('saves AI supplemental cards when generated from trusted view', async () => {
    const user = userEvent.setup();

    render(
      <KnowledgePage
        profile={mockProfile}
        assessmentResult={mockAssessmentResult}
        initialScenario="hard_to_fall_asleep"
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '生成 AI 补充参考' }));

    await waitFor(() => {
      expect(screen.getByText('入睡困难调理')).toBeInTheDocument();
    });
    expect(mockLocalStore.saveKnowledgeCache).toHaveBeenCalled();
  });
```

Replace the regeneration test button name:

```ts
    await user.click(screen.getByRole('button', { name: '生成 AI 补充参考' }));
```

- [ ] **Step 2: Run trusted content tests to verify they fail**

Run:

```bash
npm test -- src/domain/trustedContent.test.ts
```

Expected: FAIL because `trustedContent.ts` does not exist.

- [ ] **Step 3: Implement trusted content**

Create `src/domain/trustedContent.ts`:

```ts
import type { KnowledgeCard, KnowledgeResponse, SleepScenario } from './types';
import { defaultDisclaimer } from './safety';

function card(input: KnowledgeCard): KnowledgeCard {
  return input;
}

const safetyCard = card({
  title: '优先识别需要专业评估的信号',
  summary: '自伤想法、疑似睡眠呼吸暂停、胸痛、药物依赖、孕期或产后严重睡眠问题，应优先专业评估。',
  keyPoints: ['先排除高风险信号', '不要自行增加助眠药物', '记录症状和发生时间'],
  misconceptions: ['严重症状不应只靠生活建议处理', 'AI 内容不能替代医生判断'],
  actions: [
    { title: '整理记录', detail: '记录睡眠时长、憋醒、胸痛、用药和白天功能影响。' },
    { title: '寻求评估', detail: '根据风险信号咨询医生、睡眠门诊或相关专科。' },
  ],
  safetyNote: '如果存在急性危险或自伤风险，请立即联系当地急救或危机干预资源。',
  followUpQuestions: ['哪些情况需要去睡眠门诊？', '看医生前我应该记录什么？'],
});

const fixedWakeCard = card({
  title: '固定起床时间是优先动作',
  summary: '对很多入睡困难和熬夜习惯用户，固定起床时间比强迫早睡更容易执行。',
  keyPoints: ['每天固定起床', '周末浮动不超过 1 小时', '起床后接触自然光'],
  misconceptions: ['不是躺得越久越能补觉', '不要因为昨晚没睡好就无限推迟起床'],
  actions: [
    { title: '设定起床锚点', detail: '选择一个现实可坚持的起床时间，并连续观察一周。' },
    { title: '配合晨间光照', detail: '起床后尽量接触自然光，帮助昼夜节律稳定。' },
  ],
  safetyNote: null,
  followUpQuestions: ['我应该几点起床？', '周末可以睡懒觉吗？'],
});

const stimulusCard = card({
  title: '刺激控制减少床上的清醒焦虑',
  summary: '床应尽量重新和睡眠建立关联，减少在床上刷手机、工作和长时间清醒。',
  keyPoints: ['困了再上床', '长时间清醒时离床做低刺激活动', '避免在床上处理工作消息'],
  misconceptions: ['硬躺几个小时不一定更容易睡着', '床上刷手机会强化清醒'],
  actions: [
    { title: '低刺激离床', detail: '长时间清醒时离床，做昏暗灯光下的低刺激活动。' },
    { title: '困意回来再上床', detail: '困意明显时再回床，避免把床变成焦虑场所。' },
  ],
  safetyNote: '夜间起身注意照明和跌倒风险。',
  followUpQuestions: ['多久睡不着需要离床？', '离床后能做什么？'],
});

const relaxationCard = card({
  title: '短放松练习降低睡前唤醒',
  summary: '呼吸、肌肉放松和正念练习适合作为睡前低刺激流程的一部分。',
  keyPoints: ['练习时间短也有价值', '不追求立刻睡着', '出现不适就停止'],
  misconceptions: ['放松训练不是催眠开关', '屏息不舒服时不需要硬撑'],
  actions: [
    { title: '慢呼气', detail: '用 2-4 分钟练习慢呼气，感到头晕时停止。' },
    { title: '身体扫描', detail: '从脚到头观察紧张部位，配合自然呼吸。' },
  ],
  safetyNote: '胸闷、头晕或明显不适时停止练习。',
  followUpQuestions: ['4-7-8 呼吸不舒服怎么办？', '放松练习什么时候做？'],
});

export function buildTrustedKnowledgeResponse(scenario: SleepScenario): KnowledgeResponse {
  const scenarioCards: Partial<Record<SleepScenario, KnowledgeCard[]>> = {
    hard_to_fall_asleep: [fixedWakeCard, stimulusCard, relaxationCard],
    late_night_habit: [fixedWakeCard, relaxationCard],
    stress_anxiety: [relaxationCard, stimulusCard],
    poor_sleep_quality: [fixedWakeCard, relaxationCard],
    wellness_regulation: [relaxationCard, fixedWakeCard],
    bedtime_ritual: [relaxationCard, fixedWakeCard],
    sound_meditation: [relaxationCard],
    medical_triage: [safetyCard],
    diet_sleep_link: [fixedWakeCard],
  };

  return {
    scenario,
    cards: scenarioCards[scenario] ?? [fixedWakeCard, relaxationCard],
    disclaimer: `以上内容仅提供健康管理参考，${defaultDisclaimer}`,
    generatedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Update KnowledgePage to show trusted cards before AI**

Modify imports in `src/components/KnowledgePage.tsx`:

```ts
import { buildTrustedKnowledgeResponse } from '../domain/trustedContent';
```

Replace `handleScenarioSelect` so scenario selection shows trusted cards immediately and does not call AI until the user presses the supplemental button:

```ts
  const handleScenarioSelect = (scenario: SleepScenario) => {
    setSelectedScenario(scenario);
    setResponse(buildTrustedKnowledgeResponse(scenario));
    setFromCache(false);
    setError('');
    setLoadingState('success');
  };
```

Replace the `useEffect` for `initialScenario` with:

```ts
  useEffect(() => {
    if (!initialScenario) return;
    setResponse(buildTrustedKnowledgeResponse(initialScenario));
    setFromCache(false);
    setLoadingState('success');
  }, [initialScenario]);
```

Keep `handleRegenerate` as the AI path and change the button text to make AI supplement explicit:

```tsx
                  生成 AI 补充参考
```

- [ ] **Step 5: Run trusted content and KnowledgePage tests**

Run:

```bash
npm test -- src/domain/trustedContent.test.ts src/components/KnowledgePage.test.tsx
```

Expected: PASS for trusted content and KnowledgePage tests.

- [ ] **Step 6: Commit Task 6**

Run:

```bash
git add src/domain/trustedContent.ts src/domain/trustedContent.test.ts src/components/KnowledgePage.tsx src/components/KnowledgePage.test.tsx
git commit -m "feat: add trusted sleep knowledge content"
```

Expected: commit succeeds.

## Task 7: AI Program Context

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/api/chatClient.ts`
- Modify: `src/components/ChatPage.tsx`
- Modify: `api/chatLogic.ts`
- Modify: `api/prompt.ts`
- Modify: `api/prompt.test.ts`

- [ ] **Step 1: Add failing prompt test**

Append to `api/prompt.test.ts`:

```ts
it('includes current program context without full diary history', () => {
  const prompt = buildSleepAdvisorPrompt(
    profile,
    '为什么今天让我做这个任务？',
    [],
    undefined,
    undefined,
    undefined,
    {
      currentDay: 3,
      todayTask: {
        day: 3,
        title: '睡前手机边界',
        category: 'sleep_hygiene',
        evidenceLabel: '睡眠卫生',
        estimatedMinutes: 5,
        rationale: '减少睡前刺激。',
        action: '睡前 30 分钟停止刷短视频。',
        fallbackAction: '只保留低刺激内容。',
        safetyNote: null,
      },
      stats: {
        completedCount: 1,
        skippedCount: 1,
        completionRate: 50,
        currentStreak: 0,
        needsFallback: false,
      },
      safetyStatus: 'active',
    },
  );

  expect(prompt).toContain('当前 14 天改善计划');
  expect(prompt).toContain('睡前手机边界');
  expect(prompt).toContain('禁止覆盖安全分流规则');
  expect(prompt).not.toContain('完整睡眠日记');
});
```

- [ ] **Step 2: Run prompt test to verify it fails**

Run:

```bash
npm test -- api/prompt.test.ts
```

Expected: FAIL because `buildSleepAdvisorPrompt` does not accept program context.

- [ ] **Step 3: Update prompt signature and content**

Modify imports in `api/prompt.ts`:

```ts
import { buildProgramContextForPrompt } from '../src/domain/program';
import type { AssessmentResult, ChatMessage, PersonalizedSleepProfile, ProgramPromptContext, SleepProfile, SleepScenario } from '../src/domain/types';
```

Update signature:

```ts
export function buildSleepAdvisorPrompt(
  profile: SleepProfile,
  message: string,
  history: ChatMessage[] = [],
  assessmentResult?: AssessmentResult,
  scenario?: SleepScenario,
  personalization?: PersonalizedSleepProfile,
  programContext?: ProgramPromptContext,
): string {
```

Add:

```ts
  const programPromptContext = programContext ? `\n\n${buildProgramContextForPrompt(programContext)}` : '';
```

Add to the instruction block:

```txt
如果提供了"当前 14 天改善计划"，可以解释今日任务、提供更轻量替代动作、帮助用户复盘没做到的原因，但不能覆盖安全分流规则。
```

Add `${programPromptContext}` after `${personalizationContext}`.

- [ ] **Step 4: Pass optional program context through chat API types**

Modify `src/api/chatClient.ts`:

```ts
import type { AssessmentResult, AiResponse, ChatMessage, ProgramPromptContext, SleepProfile, SleepScenario } from '../domain/types';
```

Add to `SendChatMessageInput`:

```ts
  programContext?: ProgramPromptContext;
```

The `body: JSON.stringify(input)` line already forwards it.

Modify `api/chatLogic.ts` imports:

```ts
import type { AssessmentResult, ChatMessage, ProgramPromptContext, SleepProfile, SleepScenario } from '../src/domain/types';
```

Add to `ChatInput`:

```ts
  programContext?: ProgramPromptContext;
```

Update prompt call:

```ts
    const prompt = buildSleepAdvisorPrompt(
      input.profile,
      input.message,
      input.history || [],
      input.assessmentResult,
      input.scenario,
      personalization,
      input.programContext,
    );
```

- [ ] **Step 5: Wire task-aware initial chat input through App**

Modify `src/App.tsx` state near `selectedScenario`:

```ts
  const [chatInitialInput, setChatInitialInput] = useState('');
```

Replace `openChat`:

```ts
  function openChat(scenario?: SleepScenario, initialInput = '') {
    setSelectedScenario(scenario ?? null);
    setChatInitialInput(initialInput);
    setChildView('chat');
  }
```

Add `initialInput` to `ChatPage`:

```tsx
        initialInput={chatInitialInput}
```

Keep reset behavior clearing the prompt:

```ts
    setChatInitialInput('');
```

- [ ] **Step 6: Build program context in ChatPage**

Modify `src/components/ChatPage.tsx` imports:

```ts
import { buildProgramStats, getProgramTaskTemplate } from '../domain/program';
import { getDailyTaskLogs } from '../storage/localStore';
```

Before calling `sendChatMessage`, add:

```ts
      const programLogs = getDailyTaskLogs();
      const stats = buildProgramStats(programLogs);
      const currentDay = Math.min(programLogs.length + 1, 14);
      const todayTask = getProgramTaskTemplate()[currentDay - 1];
```

Add to the request object:

```ts
        programContext: {
          currentDay,
          todayTask,
          stats,
          safetyStatus: profile.safetySignals.length > 0 ? 'needs_care' : 'active',
        },
```

- [ ] **Step 7: Run prompt and chat tests**

Run:

```bash
npm test -- api/prompt.test.ts src/api/chatClient.test.ts src/components/ChatPage.test.tsx src/App.test.tsx
```

Expected: PASS for prompt, chat client, ChatPage, and App tests.

- [ ] **Step 8: Commit Task 7**

Run:

```bash
git add src/App.tsx src/api/chatClient.ts src/components/ChatPage.tsx api/chatLogic.ts api/prompt.ts api/prompt.test.ts
git commit -m "feat: include program context in chat prompts"
```

Expected: commit succeeds.

## Task 8: Documentation And Full Verification

**Files:**
- Modify: `README.md`
- Modify: `docs_cn/使用文档.md`

- [ ] **Step 1: Update README feature list**

In `README.md`, add these bullets under `Features`:

```md
- 14-day sleep improvement program with one daily task.
- Deterministic safety gate before ordinary behavior tasks.
- Lightweight daily task feedback with local progress tracking.
- Trusted built-in sleep knowledge content before optional AI supplements.
```

Add this paragraph under `Sleep Enhancement Data`:

```md
The 14-day program, task logs, completion metrics, and trusted knowledge content are local-first. They are designed to work without accounts or cloud sync, and high-risk profiles are routed to professional evaluation guidance before ordinary behavior tasks.
```

- [ ] **Step 2: Update Chinese usage documentation**

In `docs_cn/使用文档.md`, add a section after `七、改善计划（Plans Page）`:

```md
### 七点五、14 天睡眠改善计划

应用会根据用户档案、评估结果和安全信号生成本地优先的 14 天计划。普通风险用户每天看到 1 个主任务，任务带有依据标签，例如 CBT-I、睡眠卫生、放松训练、饮食作息或养生参考。

用户可以完成或跳过今日任务，并记录睡眠质量、入睡耗时、夜醒次数、白天精神和备注。系统会在本地计算完成率、连续完成天数和保守趋势说明。

如用户存在自伤想法、疑似睡眠呼吸暂停、胸痛、药物依赖、孕期或产后严重睡眠问题、重度失眠等信号，系统会优先展示专业评估建议，而不是普通改善任务。
```

- [ ] **Step 3: Run all verification commands**

Run:

```bash
npm test
npm run build
npm run e2e
```

Expected:

- `npm test`: all Vitest suites pass.
- `npm run build`: TypeScript build and Vite production build complete.
- `npm run e2e`: Playwright smoke tests pass for desktop Chrome and Pixel 7.

- [ ] **Step 4: Commit Task 8**

Run:

```bash
git add README.md docs_cn/使用文档.md
git commit -m "docs: document 14-day sleep program"
```

Expected: commit succeeds.

## Final Review

- [ ] **Step 1: Inspect final diff**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: only intentional implementation commits appear. Unrelated pre-existing files such as `.claude/`, `.playwright-mcp/`, or unrelated documentation edits remain untouched unless they were intentionally part of Task 8.

- [ ] **Step 2: Manual smoke path**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL. Open the app and verify:

- New profile lands on `今日`.
- `今日` shows day 1 of the 14-day program.
- Completing a task shows saved state after refresh.
- `方案` shows 14 tasks.
- `趋势` shows completion metrics.
- `知识` shows deterministic cards before AI supplement.
- Chat still returns structured sleep guidance.

- [ ] **Step 3: Stop the dev server and summarize**

Stop the dev server with `Ctrl-C`.

Summarize:

- Commits created.
- Tests run and results.
- Any remaining risks, especially UI polish, prompt behavior, or e2e coverage gaps.
