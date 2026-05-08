# Sleep Enhancement Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Chinese local-first sleep enhancement loop: 今日, 日记, 趋势, 方案, 我的.

**Architecture:** Keep all new product data in browser local storage using sync-ready record shapes. Domain modules own diary statistics, reminder tasks, relaxation definitions, and plan recommendations; React components render Chinese pages and call storage/domain helpers. Existing chat, assessment, and knowledge flows remain as child views reachable from the new tab shell.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Playwright, browser `localStorage`.

---

## File Structure

Create:

- `src/domain/sleepDiary.ts`: diary types, date helpers, merge/update helpers, sleep duration and diary summary logic.
- `src/domain/sleepDiary.test.ts`: diary merge and calculation tests.
- `src/domain/trends.ts`: 7/30 day trend window calculations and insight rules.
- `src/domain/trends.test.ts`: trend window, empty state, and insight tests.
- `src/domain/reminders.ts`: reminder settings defaults and today's in-app task generation.
- `src/domain/reminders.test.ts`: reminder task tests.
- `src/domain/relaxation.ts`: relaxation tool definitions, session helper, timer step helpers.
- `src/domain/relaxation.test.ts`: tool and session tests.
- `src/domain/sleepPlans.ts`: built-in plan library and deterministic recommendation rules.
- `src/domain/sleepPlans.test.ts`: recommendation and safety downgrade tests.
- `src/components/BottomTabs.tsx`: persistent bottom tab navigation.
- `src/components/TodayPage.tsx`: default tab and daily action surface.
- `src/components/DiaryPage.tsx`: bedtime/wake diary editor.
- `src/components/TrendsPage.tsx`: 7/30 day trend view.
- `src/components/PlansPage.tsx`: plan recommendations and library.
- `src/components/RelaxationPage.tsx`: guided relaxation detail page.
- `src/components/MyPage.tsx`: profile/settings/data management page.
- Component tests for each new page.

Modify:

- `src/domain/types.ts`: export new shared record types.
- `src/storage/localStore.ts`: add diary, reminder, relaxation, and plan preference storage keys.
- `src/storage/localStore.test.ts`: cover new local storage behavior.
- `src/App.tsx`: replace dashboard-only app shell with tab shell plus child views.
- `src/App.test.tsx`: update routing/navigation expectations.
- `src/styles.css`: add tab shell, diary form, trend, plan, relaxation, and settings styles.
- `e2e/mvp.spec.ts`: extend smoke flow to cover diary, trend, and plan recommendation.
- `README.md`: document local-first enhancement data and verification commands.

---

### Task 1: Shared Domain Types And Diary Helpers

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/sleepDiary.ts`
- Create: `src/domain/sleepDiary.test.ts`

- [ ] **Step 1: Write failing diary domain tests**

Create `src/domain/sleepDiary.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildDiaryEntry,
  calculateSleepDurationMinutes,
  summarizeRecentDiary,
  upsertBedtimeCheckin,
  upsertWakeCheckin,
} from './sleepDiary';

describe('sleep diary helpers', () => {
  it('creates one sync-ready entry per date and updates bedtime and wake sections independently', () => {
    const base = buildDiaryEntry('2026-05-08', new Date('2026-05-08T12:00:00.000Z'));
    const withBedtime = upsertBedtimeCheckin(base, {
      mood: '紧张',
      stressLevel: 4,
      factors: ['睡前玩手机'],
      plannedActions: ['4-7-8 呼吸'],
      notes: '今晚工作较晚',
    }, new Date('2026-05-08T13:00:00.000Z'));
    const withWake = upsertWakeCheckin(withBedtime, {
      sleepStart: '23:40',
      wakeTime: '07:10',
      sleepLatencyMinutes: 35,
      awakenings: 2,
      sleepQuality: 3,
      dreamNote: '多梦',
      daytimeFeeling: '疲惫',
      notes: '凌晨醒过两次',
    }, new Date('2026-05-09T00:00:00.000Z'));

    expect(withWake).toMatchObject({
      date: '2026-05-08',
      version: 3,
      bedtimeCheckin: { mood: '紧张', stressLevel: 4 },
      wakeCheckin: { sleepStart: '23:40', wakeTime: '07:10', awakenings: 2 },
    });
    expect(withWake.id).toBe('diary-2026-05-08');
    expect(withWake.createdAt).toBe('2026-05-08T12:00:00.000Z');
    expect(withWake.updatedAt).toBe('2026-05-09T00:00:00.000Z');
  });

  it('calculates sleep duration across midnight', () => {
    expect(calculateSleepDurationMinutes('23:30', '07:00')).toBe(450);
    expect(calculateSleepDurationMinutes('00:30', '06:45')).toBe(375);
  });

  it('summarizes recent wake checkins for recommendations', () => {
    const entries = ['2026-05-06', '2026-05-07', '2026-05-08'].map((date, index) =>
      upsertWakeCheckin(buildDiaryEntry(date), {
        sleepStart: '00:30',
        wakeTime: '06:30',
        sleepLatencyMinutes: 45 + index * 5,
        awakenings: 2,
        sleepQuality: 2,
        dreamNote: '',
        daytimeFeeling: '疲惫',
        notes: '',
      }),
    );

    expect(summarizeRecentDiary(entries)).toMatchObject({
      entryCount: 3,
      averageSleepDurationMinutes: 360,
      averageSleepLatencyMinutes: 50,
      averageAwakenings: 2,
      averageSleepQuality: 2,
    });
  });
});
```

- [ ] **Step 2: Run the diary test and verify failure**

Run:

```bash
npm test -- src/domain/sleepDiary.test.ts
```

Expected: FAIL because `src/domain/sleepDiary.ts` does not exist.

- [ ] **Step 3: Add shared types**

Append to `src/domain/types.ts`:

```ts
export interface SyncRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BedtimeCheckin {
  mood: string;
  stressLevel: number;
  factors: string[];
  plannedActions: string[];
  notes: string;
}

export interface WakeCheckin {
  sleepStart: string;
  wakeTime: string;
  sleepLatencyMinutes: number;
  awakenings: number;
  sleepQuality: number;
  dreamNote: string;
  daytimeFeeling: string;
  notes: string;
}

export interface SleepDiaryEntry extends SyncRecord {
  date: string;
  bedtimeCheckin: BedtimeCheckin | null;
  wakeCheckin: WakeCheckin | null;
}

export interface DiarySummary {
  entryCount: number;
  averageSleepDurationMinutes: number | null;
  averageSleepLatencyMinutes: number | null;
  averageAwakenings: number | null;
  averageSleepQuality: number | null;
}
```

- [ ] **Step 4: Implement diary helpers**

Create `src/domain/sleepDiary.ts`:

```ts
import type { BedtimeCheckin, DiarySummary, SleepDiaryEntry, WakeCheckin } from './types';

function nowIso(now = new Date()): string {
  return now.toISOString();
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export function buildDiaryEntry(date: string, now = new Date()): SleepDiaryEntry {
  const iso = nowIso(now);
  return {
    id: `diary-${date}`,
    date,
    bedtimeCheckin: null,
    wakeCheckin: null,
    createdAt: iso,
    updatedAt: iso,
    version: 1,
  };
}

export function upsertBedtimeCheckin(
  entry: SleepDiaryEntry,
  bedtimeCheckin: BedtimeCheckin,
  now = new Date(),
): SleepDiaryEntry {
  return {
    ...entry,
    bedtimeCheckin,
    updatedAt: nowIso(now),
    version: entry.version + 1,
  };
}

export function upsertWakeCheckin(
  entry: SleepDiaryEntry,
  wakeCheckin: WakeCheckin,
  now = new Date(),
): SleepDiaryEntry {
  return {
    ...entry,
    wakeCheckin,
    updatedAt: nowIso(now),
    version: entry.version + 1,
  };
}

export function calculateSleepDurationMinutes(sleepStart: string, wakeTime: string): number {
  const [startHour, startMinute] = sleepStart.split(':').map(Number);
  const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
  const startTotal = startHour * 60 + startMinute;
  let wakeTotal = wakeHour * 60 + wakeMinute;
  if (wakeTotal <= startTotal) {
    wakeTotal += 24 * 60;
  }
  return wakeTotal - startTotal;
}

export function summarizeRecentDiary(entries: SleepDiaryEntry[]): DiarySummary {
  const wakeEntries = entries
    .filter((entry) => entry.wakeCheckin)
    .map((entry) => entry.wakeCheckin as WakeCheckin);

  return {
    entryCount: wakeEntries.length,
    averageSleepDurationMinutes: average(
      wakeEntries.map((entry) => calculateSleepDurationMinutes(entry.sleepStart, entry.wakeTime)),
    ),
    averageSleepLatencyMinutes: average(wakeEntries.map((entry) => entry.sleepLatencyMinutes)),
    averageAwakenings: average(wakeEntries.map((entry) => entry.awakenings)),
    averageSleepQuality: average(wakeEntries.map((entry) => entry.sleepQuality)),
  };
}
```

- [ ] **Step 5: Run diary tests and commit**

Run:

```bash
npm test -- src/domain/sleepDiary.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/domain/types.ts src/domain/sleepDiary.ts src/domain/sleepDiary.test.ts
git commit -m "feat: add sleep diary domain helpers"
```

---

### Task 2: Local Storage For Enhancement Data

**Files:**
- Modify: `src/storage/localStore.ts`
- Modify: `src/storage/localStore.test.ts`

- [ ] **Step 1: Write failing storage tests**

Append to `src/storage/localStore.test.ts`:

```ts
import type { SleepDiaryEntry } from '../domain/types';
import {
  getDiaryEntries,
  getReminderSettings,
  getRelaxationSessions,
  saveDiaryEntries,
  saveReminderSettings,
  saveRelaxationSessions,
} from './localStore';

it('stores diary entries, reminder settings, and relaxation sessions', () => {
  const entry: SleepDiaryEntry = {
    id: 'diary-2026-05-08',
    date: '2026-05-08',
    bedtimeCheckin: null,
    wakeCheckin: null,
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
    version: 1,
  };

  saveDiaryEntries([entry]);
  saveReminderSettings({
    id: 'reminder-settings',
    bedtimeEnabled: true,
    bedtimeTime: '22:30',
    wakeEnabled: true,
    wakeTime: '07:00',
    lastBedtimeAckDate: null,
    lastWakeAckDate: null,
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
    version: 1,
  });
  saveRelaxationSessions([{
    id: 'session-1',
    toolId: 'breathing-478',
    startedAt: '2026-05-08T22:00:00.000Z',
    completedAt: '2026-05-08T22:04:00.000Z',
    durationSeconds: 240,
    status: 'completed',
    createdAt: '2026-05-08T22:00:00.000Z',
    updatedAt: '2026-05-08T22:04:00.000Z',
    version: 2,
  }]);

  expect(getDiaryEntries()).toEqual([entry]);
  expect(getReminderSettings()?.bedtimeTime).toBe('22:30');
  expect(getRelaxationSessions()).toHaveLength(1);
});
```

- [ ] **Step 2: Run storage tests and verify failure**

Run:

```bash
npm test -- src/storage/localStore.test.ts
```

Expected: FAIL because new exports and types do not exist.

- [ ] **Step 3: Add reminder and relaxation types**

Append to `src/domain/types.ts`:

```ts
export interface ReminderSettings extends SyncRecord {
  bedtimeEnabled: boolean;
  bedtimeTime: string;
  wakeEnabled: boolean;
  wakeTime: string;
  lastBedtimeAckDate: string | null;
  lastWakeAckDate: string | null;
}

export type RelaxationSessionStatus = 'started' | 'completed';

export interface RelaxationSession extends SyncRecord {
  toolId: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  status: RelaxationSessionStatus;
}
```

- [ ] **Step 4: Add storage keys and accessors**

Modify `src/storage/localStore.ts` imports:

```ts
import type {
  AssessmentResult,
  ChatMessage,
  FeedbackEvent,
  KnowledgeResponse,
  RelaxationSession,
  ReminderSettings,
  SleepDiaryEntry,
  SleepProfile,
  SleepScenario,
} from '../domain/types';
```

Extend `keys`:

```ts
const keys = {
  profile: 'sleepProfile',
  chatHistory: 'chatHistory',
  feedbackEvents: 'feedbackEvents',
  assessmentResult: 'assessmentResult',
  knowledgeCache: 'knowledgeCache',
  diaryEntries: 'sleepDiaryEntries',
  reminderSettings: 'reminderSettings',
  relaxationSessions: 'relaxationSessions',
} as const;
```

Add accessors before `clearAllLocalData()`:

```ts
export function getDiaryEntries(): SleepDiaryEntry[] {
  return readJson<SleepDiaryEntry[]>(keys.diaryEntries, []);
}

export function saveDiaryEntries(entries: SleepDiaryEntry[]): void {
  writeJson(keys.diaryEntries, entries);
}

export function getReminderSettings(): ReminderSettings | null {
  return readJson<ReminderSettings | null>(keys.reminderSettings, null);
}

export function saveReminderSettings(settings: ReminderSettings): void {
  writeJson(keys.reminderSettings, settings);
}

export function getRelaxationSessions(): RelaxationSession[] {
  return readJson<RelaxationSession[]>(keys.relaxationSessions, []);
}

export function saveRelaxationSessions(sessions: RelaxationSession[]): void {
  writeJson(keys.relaxationSessions, sessions);
}
```

Extend `clearAllLocalData()`:

```ts
  removeKey(keys.diaryEntries);
  removeKey(keys.reminderSettings);
  removeKey(keys.relaxationSessions);
```

- [ ] **Step 5: Run storage tests and commit**

Run:

```bash
npm test -- src/storage/localStore.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/domain/types.ts src/storage/localStore.ts src/storage/localStore.test.ts
git commit -m "feat: persist sleep enhancement data locally"
```

---

### Task 3: Trends Domain

**Files:**
- Create: `src/domain/trends.ts`
- Create: `src/domain/trends.test.ts`

- [ ] **Step 1: Write failing trend tests**

Create `src/domain/trends.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildTrendSummary } from './trends';
import { buildDiaryEntry, upsertWakeCheckin } from './sleepDiary';

function entry(date: string, quality: number, latency: number) {
  return upsertWakeCheckin(buildDiaryEntry(date), {
    sleepStart: '00:00',
    wakeTime: '07:00',
    sleepLatencyMinutes: latency,
    awakenings: 1,
    sleepQuality: quality,
    dreamNote: '',
    daytimeFeeling: '一般',
    notes: '',
  });
}

describe('trend summary', () => {
  it('builds 7 and 30 day windows ending on the selected date', () => {
    const summary = buildTrendSummary([
      entry('2026-04-10', 4, 20),
      entry('2026-05-02', 2, 50),
      entry('2026-05-08', 3, 40),
    ], '2026-05-08');

    expect(summary.last7Days.entryCount).toBe(2);
    expect(summary.last30Days.entryCount).toBe(3);
    expect(summary.last7Days.averageSleepLatencyMinutes).toBe(45);
  });

  it('returns an empty state when there are no wake checkins', () => {
    const summary = buildTrendSummary([], '2026-05-08');
    expect(summary.last7Days.entryCount).toBe(0);
    expect(summary.insights).toContain('还没有足够的睡眠记录，先完成一次起床记录。');
  });

  it('adds local insights for long latency and low quality', () => {
    const summary = buildTrendSummary([
      entry('2026-05-06', 2, 55),
      entry('2026-05-07', 2, 50),
      entry('2026-05-08', 2, 45),
    ], '2026-05-08');

    expect(summary.insights).toEqual(expect.arrayContaining([
      '近 7 天平均入睡耗时偏长，可以优先尝试固定睡前流程和放松训练。',
      '近 7 天主观睡眠质量偏低，建议关注夜醒、压力和睡前刺激因素。',
    ]));
  });
});
```

- [ ] **Step 2: Run trend tests and verify failure**

Run:

```bash
npm test -- src/domain/trends.test.ts
```

Expected: FAIL because `src/domain/trends.ts` does not exist.

- [ ] **Step 3: Implement trend summary**

Create `src/domain/trends.ts`:

```ts
import { summarizeRecentDiary } from './sleepDiary';
import type { DiarySummary, SleepDiaryEntry } from './types';

export interface TrendSummary {
  last7Days: DiarySummary;
  last30Days: DiarySummary;
  insights: string[];
}

function dateToTime(date: string): number {
  return new Date(`${date}T00:00:00.000Z`).getTime();
}

function entriesInWindow(entries: SleepDiaryEntry[], endDate: string, days: number): SleepDiaryEntry[] {
  const end = dateToTime(endDate);
  const start = end - (days - 1) * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => {
    const current = dateToTime(entry.date);
    return current >= start && current <= end && entry.wakeCheckin;
  });
}

function buildInsights(last7Days: DiarySummary): string[] {
  if (last7Days.entryCount === 0) {
    return ['还没有足够的睡眠记录，先完成一次起床记录。'];
  }

  const insights: string[] = [];
  if ((last7Days.averageSleepLatencyMinutes ?? 0) >= 45) {
    insights.push('近 7 天平均入睡耗时偏长，可以优先尝试固定睡前流程和放松训练。');
  }
  if ((last7Days.averageSleepQuality ?? 5) <= 2.5) {
    insights.push('近 7 天主观睡眠质量偏低，建议关注夜醒、压力和睡前刺激因素。');
  }
  if (insights.length === 0) {
    insights.push('近 7 天记录较稳定，可以继续保持当前作息并观察变化。');
  }
  return insights;
}

export function buildTrendSummary(entries: SleepDiaryEntry[], endDate: string): TrendSummary {
  const last7Days = summarizeRecentDiary(entriesInWindow(entries, endDate, 7));
  const last30Days = summarizeRecentDiary(entriesInWindow(entries, endDate, 30));
  return {
    last7Days,
    last30Days,
    insights: buildInsights(last7Days),
  };
}
```

- [ ] **Step 4: Run trend tests and commit**

Run:

```bash
npm test -- src/domain/trends.test.ts src/domain/sleepDiary.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/domain/trends.ts src/domain/trends.test.ts
git commit -m "feat: add sleep trend summaries"
```

---

### Task 4: Reminder And Relaxation Domain

**Files:**
- Create: `src/domain/reminders.ts`
- Create: `src/domain/reminders.test.ts`
- Create: `src/domain/relaxation.ts`
- Create: `src/domain/relaxation.test.ts`

- [ ] **Step 1: Write failing reminder and relaxation tests**

Create `src/domain/reminders.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildDefaultReminderSettings, buildTodayReminderTasks } from './reminders';

describe('reminders', () => {
  it('creates sync-ready default in-app reminder settings', () => {
    expect(buildDefaultReminderSettings(new Date('2026-05-08T00:00:00.000Z'))).toMatchObject({
      id: 'reminder-settings',
      bedtimeEnabled: true,
      bedtimeTime: '22:30',
      wakeEnabled: true,
      wakeTime: '07:00',
      version: 1,
    });
  });

  it('builds pending tasks until acknowledged for the current date', () => {
    const settings = buildDefaultReminderSettings(new Date('2026-05-08T00:00:00.000Z'));
    expect(buildTodayReminderTasks(settings, '2026-05-08')).toEqual([
      { id: 'bedtime-2026-05-08', label: '22:30 睡前准备提醒', type: 'bedtime' },
      { id: 'wake-2026-05-08', label: '07:00 起床后补充睡眠记录', type: 'wake' },
    ]);
  });
});
```

Create `src/domain/relaxation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildRelaxationSession, completeRelaxationSession, relaxationTools } from './relaxation';

describe('relaxation tools', () => {
  it('defines breathing, muscle relaxation, and mindfulness tools in Chinese', () => {
    expect(relaxationTools.map((tool) => tool.id)).toEqual([
      'breathing-478',
      'muscle-relaxation',
      'mindfulness',
    ]);
    expect(relaxationTools[0].steps[0].label).toContain('吸气');
    expect(relaxationTools.every((tool) => tool.audioState === 'unavailable')).toBe(true);
  });

  it('records started and completed sessions', () => {
    const started = buildRelaxationSession('breathing-478', new Date('2026-05-08T22:00:00.000Z'));
    const completed = completeRelaxationSession(started, 240, new Date('2026-05-08T22:04:00.000Z'));

    expect(started.status).toBe('started');
    expect(completed).toMatchObject({
      toolId: 'breathing-478',
      completedAt: '2026-05-08T22:04:00.000Z',
      durationSeconds: 240,
      status: 'completed',
      version: 2,
    });
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- src/domain/reminders.test.ts src/domain/relaxation.test.ts
```

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Implement reminders**

Create `src/domain/reminders.ts`:

```ts
import type { ReminderSettings } from './types';

export interface ReminderTask {
  id: string;
  label: string;
  type: 'bedtime' | 'wake';
}

export function buildDefaultReminderSettings(now = new Date()): ReminderSettings {
  const iso = now.toISOString();
  return {
    id: 'reminder-settings',
    bedtimeEnabled: true,
    bedtimeTime: '22:30',
    wakeEnabled: true,
    wakeTime: '07:00',
    lastBedtimeAckDate: null,
    lastWakeAckDate: null,
    createdAt: iso,
    updatedAt: iso,
    version: 1,
  };
}

export function buildTodayReminderTasks(settings: ReminderSettings | null, date: string): ReminderTask[] {
  if (!settings) return [];
  const tasks: ReminderTask[] = [];
  if (settings.bedtimeEnabled && settings.lastBedtimeAckDate !== date) {
    tasks.push({ id: `bedtime-${date}`, label: `${settings.bedtimeTime} 睡前准备提醒`, type: 'bedtime' });
  }
  if (settings.wakeEnabled && settings.lastWakeAckDate !== date) {
    tasks.push({ id: `wake-${date}`, label: `${settings.wakeTime} 起床后补充睡眠记录`, type: 'wake' });
  }
  return tasks;
}
```

- [ ] **Step 4: Add relaxation types and implementation**

Append to `src/domain/types.ts`:

```ts
export interface RelaxationStep {
  label: string;
  durationSeconds: number;
}

export interface RelaxationTool {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  steps: RelaxationStep[];
  audioUrl: string | null;
  audioState: 'unavailable';
}
```

Create `src/domain/relaxation.ts`:

```ts
import type { RelaxationSession, RelaxationTool } from './types';

export const relaxationTools: RelaxationTool[] = [
  {
    id: 'breathing-478',
    title: '4-7-8 呼吸',
    description: '用固定节奏降低睡前唤醒水平。',
    estimatedMinutes: 4,
    steps: [
      { label: '吸气 4 秒', durationSeconds: 4 },
      { label: '屏息 7 秒', durationSeconds: 7 },
      { label: '呼气 8 秒', durationSeconds: 8 },
    ],
    audioUrl: null,
    audioState: 'unavailable',
  },
  {
    id: 'muscle-relaxation',
    title: '渐进式肌肉放松',
    description: '依次紧张和放松身体部位，帮助识别紧绷感。',
    estimatedMinutes: 10,
    steps: [
      { label: '双手握拳后放松', durationSeconds: 30 },
      { label: '肩颈轻轻耸起后放松', durationSeconds: 30 },
      { label: '双腿绷紧后放松', durationSeconds: 30 },
    ],
    audioUrl: null,
    audioState: 'unavailable',
  },
  {
    id: 'mindfulness',
    title: '正念引导',
    description: '把注意力放回呼吸和身体感觉，减少反复思考。',
    estimatedMinutes: 8,
    steps: [
      { label: '观察自然呼吸', durationSeconds: 60 },
      { label: '觉察身体接触床面的感觉', durationSeconds: 60 },
      { label: '把跑开的注意力温和带回呼吸', durationSeconds: 60 },
    ],
    audioUrl: null,
    audioState: 'unavailable',
  },
];

export function buildRelaxationSession(toolId: string, now = new Date()): RelaxationSession {
  const iso = now.toISOString();
  return {
    id: `relax-${toolId}-${now.getTime()}`,
    toolId,
    startedAt: iso,
    completedAt: null,
    durationSeconds: 0,
    status: 'started',
    createdAt: iso,
    updatedAt: iso,
    version: 1,
  };
}

export function completeRelaxationSession(
  session: RelaxationSession,
  durationSeconds: number,
  now = new Date(),
): RelaxationSession {
  return {
    ...session,
    completedAt: now.toISOString(),
    durationSeconds,
    status: 'completed',
    updatedAt: now.toISOString(),
    version: session.version + 1,
  };
}
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm test -- src/domain/reminders.test.ts src/domain/relaxation.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/domain/types.ts src/domain/reminders.ts src/domain/reminders.test.ts src/domain/relaxation.ts src/domain/relaxation.test.ts
git commit -m "feat: add reminders and relaxation domain"
```

---

### Task 5: Built-In Plans And Rule Recommendations

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/sleepPlans.ts`
- Create: `src/domain/sleepPlans.test.ts`

- [ ] **Step 1: Write failing plan recommendation tests**

Create `src/domain/sleepPlans.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { recommendSleepPlans, sleepPlans } from './sleepPlans';
import type { AssessmentResult, DiarySummary, SleepProfile } from './types';

const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '较高',
  habits: ['睡前玩手机'],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

const assessment: AssessmentResult = {
  completedAt: '2026-05-08T00:00:00.000Z',
  isi: { answers: [], score: 18, level: 'moderate', summary: '中度失眠' },
  psqiLite: { answers: [], score: 14, level: 'poor', summary: '睡眠质量较差' },
  riskFlags: [],
};

const diarySummary: DiarySummary = {
  entryCount: 3,
  averageSleepDurationMinutes: 360,
  averageSleepLatencyMinutes: 55,
  averageAwakenings: 2,
  averageSleepQuality: 2,
};

describe('sleep plans', () => {
  it('defines built-in Chinese plan library', () => {
    expect(sleepPlans.map((plan) => plan.id)).toEqual(expect.arrayContaining([
      'fixed-wake-time',
      'stimulus-control',
      'breathing-before-bed',
      'caffeine-boundary',
    ]));
  });

  it('recommends plans with visible reasons from profile, assessment, and diary', () => {
    const recommendations = recommendSleepPlans({ profile, assessmentResult: assessment, diarySummary });
    expect(recommendations[0]).toMatchObject({
      planId: 'fixed-wake-time',
      reasons: expect.arrayContaining(['入睡困难和作息偏晚时，固定起床时间通常是优先级较高的基础动作。']),
    });
    expect(recommendations.some((item) => item.planId === 'stimulus-control')).toBe(true);
  });

  it('prioritizes conservative safety recommendation when safety signals exist', () => {
    const recommendations = recommendSleepPlans({
      profile: { ...profile, safetySignals: ['疑似睡眠呼吸暂停'] },
      assessmentResult: assessment,
      diarySummary,
    });

    expect(recommendations[0].planId).toBe('medical-evaluation');
    expect(recommendations[0].safetyNote).toContain('疑似睡眠呼吸暂停');
  });
});
```

- [ ] **Step 2: Run plan tests and verify failure**

Run:

```bash
npm test -- src/domain/sleepPlans.test.ts
```

Expected: FAIL because `src/domain/sleepPlans.ts` does not exist.

- [ ] **Step 3: Add plan types**

Append to `src/domain/types.ts`:

```ts
export type SleepPlanCategory = 'cbti' | 'schedule' | 'relaxation' | 'nutrition' | 'wellness' | 'safety';

export interface SleepPlan {
  id: string;
  category: SleepPlanCategory;
  title: string;
  summary: string;
  steps: string[];
  tags: string[];
  safetyNote: string | null;
}

export interface PlanRecommendation {
  planId: string;
  priority: number;
  reasons: string[];
  matchedSignals: string[];
  safetyNote: string | null;
}
```

- [ ] **Step 4: Implement plan library and rules**

Create `src/domain/sleepPlans.ts`:

```ts
import type { AssessmentResult, DiarySummary, PlanRecommendation, SleepPlan, SleepProfile } from './types';

export const sleepPlans: SleepPlan[] = [
  {
    id: 'medical-evaluation',
    category: 'safety',
    title: '优先进行专业评估',
    summary: '存在安全信号时，先排查需要医疗处理的睡眠问题。',
    steps: ['记录异常表现', '预约睡眠门诊或相关专科', '避免自行增加助眠药物或保健品'],
    tags: ['安全信号'],
    safetyNote: '出现呼吸暂停、严重嗜睡或持续加重时，应优先专业评估。',
  },
  {
    id: 'fixed-wake-time',
    category: 'schedule',
    title: '固定起床时间',
    summary: '用稳定起床时间帮助生物钟重新建立节律。',
    steps: ['选择可长期坚持的起床时间', '周末浮动不超过 1 小时', '起床后接触自然光'],
    tags: ['入睡困难', '熬夜习惯', '作息稳定'],
    safetyNote: null,
  },
  {
    id: 'stimulus-control',
    category: 'cbti',
    title: '刺激控制入门',
    summary: '减少床和清醒焦虑之间的关联。',
    steps: ['困了再上床', '躺下约 20 分钟仍清醒时离床做低刺激活动', '避免在床上刷手机或工作'],
    tags: ['入睡困难', 'CBT-I'],
    safetyNote: null,
  },
  {
    id: 'breathing-before-bed',
    category: 'relaxation',
    title: '睡前 4-7-8 呼吸',
    summary: '用短时间呼吸练习降低睡前唤醒水平。',
    steps: ['吸气 4 秒', '屏息 7 秒', '呼气 8 秒', '重复 4 轮'],
    tags: ['压力焦虑', '放松训练'],
    safetyNote: '如屏息不适，可改为自然慢呼吸。',
  },
  {
    id: 'caffeine-boundary',
    category: 'nutrition',
    title: '咖啡因边界',
    summary: '减少下午和晚间咖啡因对入睡的影响。',
    steps: ['午后减少咖啡、浓茶、能量饮料', '记录摄入时间和当晚入睡耗时', '用无咖啡因饮品替代晚间习惯'],
    tags: ['营养补充', '入睡困难'],
    safetyNote: null,
  },
  {
    id: 'wellness-routine',
    category: 'wellness',
    title: '温和调理睡前流程',
    summary: '用固定、低刺激的睡前流程替代临睡前临时补救。',
    steps: ['睡前 30 分钟调暗灯光', '温水洗漱或泡脚', '做 5 分钟拉伸或呼吸'],
    tags: ['中医调理方向', '睡眠卫生'],
    safetyNote: '调理建议仅作健康管理参考，不替代诊疗。',
  },
];

interface RecommendInput {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary: DiarySummary;
}

function makeRecommendation(
  planId: string,
  priority: number,
  reasons: string[],
  matchedSignals: string[],
  safetyNote: string | null = null,
): PlanRecommendation {
  return { planId, priority, reasons, matchedSignals, safetyNote };
}

export function recommendSleepPlans({ profile, assessmentResult, diarySummary }: RecommendInput): PlanRecommendation[] {
  if (profile.safetySignals.length > 0 || (assessmentResult?.riskFlags.length ?? 0) > 0) {
    return [
      makeRecommendation(
        'medical-evaluation',
        100,
        ['当前存在需要优先关注的安全信号，建议先排除需要医疗处理的因素。'],
        [...profile.safetySignals, ...(assessmentResult?.riskFlags ?? [])],
        `安全信号：${[...profile.safetySignals, ...(assessmentResult?.riskFlags ?? [])].join('、')}`,
      ),
    ];
  }

  const recommendations: PlanRecommendation[] = [
    makeRecommendation(
      'fixed-wake-time',
      90,
      ['入睡困难和作息偏晚时，固定起床时间通常是优先级较高的基础动作。'],
      [profile.mainConcern, profile.bedtime],
    ),
  ];

  if (profile.mainConcern === 'hard_to_fall_asleep' || (diarySummary.averageSleepLatencyMinutes ?? 0) >= 45) {
    recommendations.push(makeRecommendation(
      'stimulus-control',
      80,
      ['最近入睡耗时偏长，刺激控制可以减少床与清醒焦虑的关联。'],
      ['入睡耗时偏长'],
    ));
  }

  if (profile.stressLevel.includes('高') || profile.mainConcern === 'stress_anxiety') {
    recommendations.push(makeRecommendation(
      'breathing-before-bed',
      70,
      ['压力或睡前唤醒较高时，短时呼吸练习更容易执行。'],
      [profile.stressLevel],
      '如屏息不适，可改为自然慢呼吸。',
    ));
  }

  if (profile.habits.some((habit) => habit.includes('咖啡') || habit.includes('茶'))) {
    recommendations.push(makeRecommendation(
      'caffeine-boundary',
      60,
      ['饮品习惯可能影响入睡，可以先建立午后咖啡因边界。'],
      profile.habits,
    ));
  }

  if ((assessmentResult?.psqiLite.level === 'poor') || (diarySummary.averageSleepQuality ?? 5) <= 2.5) {
    recommendations.push(makeRecommendation(
      'wellness-routine',
      50,
      ['睡眠质量偏低时，稳定、低刺激的睡前流程有助于减少波动。'],
      ['睡眠质量偏低'],
      '调理建议仅作健康管理参考，不替代诊疗。',
    ));
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
```

- [ ] **Step 5: Run plan tests and commit**

Run:

```bash
npm test -- src/domain/sleepPlans.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/domain/types.ts src/domain/sleepPlans.ts src/domain/sleepPlans.test.ts
git commit -m "feat: add sleep plan recommendations"
```

---

### Task 6: Diary, Trend, Plan, Relaxation Components

**Files:**
- Create: `src/components/DiaryPage.tsx`
- Create: `src/components/DiaryPage.test.tsx`
- Create: `src/components/TrendsPage.tsx`
- Create: `src/components/TrendsPage.test.tsx`
- Create: `src/components/PlansPage.tsx`
- Create: `src/components/PlansPage.test.tsx`
- Create: `src/components/RelaxationPage.tsx`
- Create: `src/components/RelaxationPage.test.tsx`

- [ ] **Step 1: Write component tests**

Create focused tests with these assertions:

`src/components/DiaryPage.test.tsx`:

```ts
it('saves bedtime and wake checkins for the same date', async () => {
  const user = userEvent.setup();
  render(<DiaryPage selectedDate="2026-05-08" />);
  await user.type(screen.getByLabelText('睡前情绪'), '紧张');
  await user.click(screen.getByRole('button', { name: '保存睡前记录' }));
  await user.type(screen.getByLabelText('入睡时间'), '23:40');
  await user.type(screen.getByLabelText('起床时间'), '07:10');
  await user.type(screen.getByLabelText('入睡耗时'), '35');
  await user.click(screen.getByRole('button', { name: '保存起床记录' }));
  expect(screen.getByText('已保存 2026-05-08 的睡眠日记')).toBeInTheDocument();
});
```

`src/components/TrendsPage.test.tsx`:

```ts
it('renders empty state when no diary data exists', () => {
  render(<TrendsPage today="2026-05-08" />);
  expect(screen.getByText('还没有足够的睡眠记录')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '去记录睡前状态' })).toBeInTheDocument();
});
```

`src/components/PlansPage.test.tsx`:

```ts
it('renders recommended plans with reasons', () => {
  render(<PlansPage profile={mockProfile} assessmentResult={mockAssessmentResult} />);
  expect(screen.getByText('推荐方案')).toBeInTheDocument();
  expect(screen.getByText(/推荐理由/)).toBeInTheDocument();
});
```

`src/components/RelaxationPage.test.tsx`:

```ts
it('starts and completes a relaxation session', async () => {
  vi.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<RelaxationPage toolId="breathing-478" onBack={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '开始' }));
  vi.advanceTimersByTime(19_000);
  await user.click(screen.getByRole('button', { name: '完成练习' }));
  expect(screen.getByText('本次练习已完成')).toBeInTheDocument();
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run component tests and verify failure**

Run:

```bash
npm test -- src/components/DiaryPage.test.tsx src/components/TrendsPage.test.tsx src/components/PlansPage.test.tsx src/components/RelaxationPage.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement components minimally**

Implement `DiaryPage` around this state and save shape:

```ts
export function DiaryPage({ selectedDate = new Date().toISOString().slice(0, 10) }: { selectedDate?: string }) {
  const [entries, setEntries] = useState(() => getDiaryEntries());
  const current = entries.find((entry) => entry.date === selectedDate) ?? buildDiaryEntry(selectedDate);
  const [mood, setMood] = useState(current.bedtimeCheckin?.mood ?? '');
  const [sleepStart, setSleepStart] = useState(current.wakeCheckin?.sleepStart ?? '');
  const [wakeTime, setWakeTime] = useState(current.wakeCheckin?.wakeTime ?? '');
  const [sleepLatencyMinutes, setSleepLatencyMinutes] = useState(String(current.wakeCheckin?.sleepLatencyMinutes ?? ''));
  const [savedMessage, setSavedMessage] = useState('');

  function saveEntry(nextEntry: SleepDiaryEntry) {
    const nextEntries = [...entries.filter((entry) => entry.date !== selectedDate), nextEntry]
      .sort((a, b) => a.date.localeCompare(b.date));
    setEntries(nextEntries);
    saveDiaryEntries(nextEntries);
    setSavedMessage(`已保存 ${selectedDate} 的睡眠日记`);
  }

  function saveBedtime() {
    saveEntry(upsertBedtimeCheckin(current, {
      mood,
      stressLevel: 3,
      factors: [],
      plannedActions: [],
      notes: '',
    }));
  }

  function saveWake() {
    saveEntry(upsertWakeCheckin(current, {
      sleepStart,
      wakeTime,
      sleepLatencyMinutes: Number(sleepLatencyMinutes || 0),
      awakenings: current.wakeCheckin?.awakenings ?? 0,
      sleepQuality: current.wakeCheckin?.sleepQuality ?? 3,
      dreamNote: current.wakeCheckin?.dreamNote ?? '',
      daytimeFeeling: current.wakeCheckin?.daytimeFeeling ?? '',
      notes: current.wakeCheckin?.notes ?? '',
    }));
  }

  return (
    <main className="page diary-page">
      <h1>睡眠日记</h1>
      <label>睡前情绪<input value={mood} onChange={(event) => setMood(event.target.value)} /></label>
      <button type="button" onClick={saveBedtime}>保存睡前记录</button>
      <label>入睡时间<input value={sleepStart} onChange={(event) => setSleepStart(event.target.value)} /></label>
      <label>起床时间<input value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} /></label>
      <label>入睡耗时<input value={sleepLatencyMinutes} onChange={(event) => setSleepLatencyMinutes(event.target.value)} /></label>
      <button type="button" onClick={saveWake}>保存起床记录</button>
      {savedMessage && <p>{savedMessage}</p>}
    </main>
  );
}
```

Implement `TrendsPage` with this data path:

```ts
export function TrendsPage({ today = new Date().toISOString().slice(0, 10), onOpenDiary }: { today?: string; onOpenDiary?: () => void }) {
  const trends = buildTrendSummary(getDiaryEntries(), today);
  return (
    <main className="page trends-page">
      <h1>睡眠趋势</h1>
      <section className="metric-grid">
        <article className="metric-card">
          <h2>近 7 天</h2>
          <p>记录 {trends.last7Days.entryCount} 天</p>
          <p>平均入睡耗时 {trends.last7Days.averageSleepLatencyMinutes ?? '--'} 分钟</p>
        </article>
        <article className="metric-card">
          <h2>近 30 天</h2>
          <p>记录 {trends.last30Days.entryCount} 天</p>
          <p>平均睡眠质量 {trends.last30Days.averageSleepQuality ?? '--'}</p>
        </article>
      </section>
      {trends.insights.map((insight) => <p key={insight}>{insight}</p>)}
      {trends.last7Days.entryCount === 0 && <button type="button" onClick={onOpenDiary}>去记录睡前状态</button>}
    </main>
  );
}
```

Implement `PlansPage` and `RelaxationPage` with these required data paths:

```ts
export function PlansPage({ profile, assessmentResult }: { profile: SleepProfile; assessmentResult: AssessmentResult | null }) {
  const diarySummary = summarizeRecentDiary(getDiaryEntries());
  const recommendations = recommendSleepPlans({ profile, assessmentResult, diarySummary });
  return (
    <main className="page plans-page">
      <h1>助眠方案</h1>
      <h2>推荐方案</h2>
      {recommendations.map((recommendation) => {
        const plan = sleepPlans.find((item) => item.id === recommendation.planId);
        if (!plan) return null;
        return (
          <article key={recommendation.planId} className="plan-card">
            <h3>{plan.title}</h3>
            <p>{plan.summary}</p>
            <p>推荐理由：{recommendation.reasons.join('；')}</p>
            {recommendation.safetyNote && <p>{recommendation.safetyNote}</p>}
          </article>
        );
      })}
      <h2>全部方案</h2>
      {sleepPlans.map((plan) => <article key={plan.id} className="plan-card"><h3>{plan.title}</h3><p>{plan.summary}</p></article>)}
    </main>
  );
}

export function RelaxationPage({ toolId, onBack }: { toolId: string; onBack: () => void }) {
  const tool = relaxationTools.find((item) => item.id === toolId) ?? relaxationTools[0];
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [session, setSession] = useState<RelaxationSession | null>(null);

  function start() {
    setRunning(true);
    setSession(buildRelaxationSession(tool.id));
  }

  function complete() {
    if (!session) return;
    saveRelaxationSessions([...getRelaxationSessions(), completeRelaxationSession(session, tool.estimatedMinutes * 60)]);
    setRunning(false);
    setCompleted(true);
  }

  return (
    <main className="page relaxation-page">
      <button type="button" onClick={onBack}>返回</button>
      <h1>{tool.title}</h1>
      <p>{tool.description}</p>
      <p>音频即将支持</p>
      {tool.steps.map((step) => <p key={step.label}>{step.label}</p>)}
      <button type="button" onClick={start}>{running ? '进行中' : '开始'}</button>
      <button type="button" onClick={complete}>完成练习</button>
      {completed && <p>本次练习已完成</p>}
    </main>
  );
}
```

All visible text must be Chinese. Use `label` elements for form fields so Testing Library can query by label text.

- [ ] **Step 4: Run component tests and commit**

Run:

```bash
npm test -- src/components/DiaryPage.test.tsx src/components/TrendsPage.test.tsx src/components/PlansPage.test.tsx src/components/RelaxationPage.test.tsx
```

Expected: PASS.

Commit:

```bash
git add src/components/DiaryPage.tsx src/components/DiaryPage.test.tsx src/components/TrendsPage.tsx src/components/TrendsPage.test.tsx src/components/PlansPage.tsx src/components/PlansPage.test.tsx src/components/RelaxationPage.tsx src/components/RelaxationPage.test.tsx
git commit -m "feat: add diary trend plan and relaxation pages"
```

---

### Task 7: Tab Shell, Today Page, And My Page

**Files:**
- Create: `src/components/BottomTabs.tsx`
- Create: `src/components/BottomTabs.test.tsx`
- Create: `src/components/TodayPage.tsx`
- Create: `src/components/TodayPage.test.tsx`
- Create: `src/components/MyPage.tsx`
- Create: `src/components/MyPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing navigation tests**

Create tests that assert:

```ts
it('renders bottom tabs in Chinese and switches tabs', async () => {
  const user = userEvent.setup();
  render(<App />);
  // Seed profile through existing helpers or complete onboarding as current App tests do.
  expect(screen.getByRole('button', { name: '今日' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '日记' }));
  expect(screen.getByRole('heading', { name: '睡眠日记' })).toBeInTheDocument();
});

it('keeps chat assessment and knowledge reachable from today page', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('heading', { name: '今日睡眠' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /入睡困难/ }));
  expect(screen.getByRole('heading', { name: '入睡困难' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '返回' }));
  expect(screen.getByRole('heading', { name: '今日睡眠' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run App tests and verify failure**

Run:

```bash
npm test -- src/App.test.tsx src/components/BottomTabs.test.tsx src/components/TodayPage.test.tsx src/components/MyPage.test.tsx
```

Expected: FAIL because new tab components and App routing do not exist.

- [ ] **Step 3: Add bottom tab and page contracts**

Create `src/components/BottomTabs.tsx`:

```ts
export type MainTab = 'today' | 'diary' | 'trends' | 'plans' | 'my';

const tabs: Array<{ value: MainTab; label: string }> = [
  { value: 'today', label: '今日' },
  { value: 'diary', label: '日记' },
  { value: 'trends', label: '趋势' },
  { value: 'plans', label: '方案' },
  { value: 'my', label: '我的' },
];

export function BottomTabs({ active, onChange }: { active: MainTab; onChange: (tab: MainTab) => void }) {
  return (
    <nav className="bottom-tabs" aria-label="主导航">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={active === tab.value ? 'bottom-tab active' : 'bottom-tab'}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
```

Create `TodayPage` and `MyPage` with these concrete structures:

```ts
interface TodayPageProps {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  onOpenChat: (scenario?: SleepScenario) => void;
  onOpenAssessment: () => void;
  onOpenKnowledge: (scenario?: SleepScenario) => void;
  onOpenRelaxation: (toolId: string) => void;
  onOpenDiary: () => void;
}

export function TodayPage({
  profile,
  assessmentResult,
  onOpenChat,
  onOpenAssessment,
  onOpenKnowledge,
  onOpenRelaxation,
  onOpenDiary,
}: TodayPageProps) {
  const today = new Date().toISOString().slice(0, 10);
  const settings = getReminderSettings() ?? buildDefaultReminderSettings();
  const tasks = buildTodayReminderTasks(settings, today);
  return (
    <main className="page today-page">
      <h1>今日睡眠</h1>
      <p>{profile.ageRange} · 通常睡眠 {profile.bedtime}-{profile.wakeTime}</p>
      <ScenarioLauncher mode="chat" onSelect={onOpenChat} />
      <section className="daily-card">
        <h2>今晚待办</h2>
        {tasks.map((task) => <p key={task.id}>{task.label}</p>)}
        <button type="button" onClick={onOpenDiary}>记录睡眠</button>
      </section>
      <section className="daily-card">
        <h2>推荐放松</h2>
        <button type="button" onClick={() => onOpenRelaxation('breathing-478')}>4-7-8 呼吸</button>
      </section>
      <button type="button" onClick={onOpenAssessment}>睡眠自测</button>
      <button type="button" onClick={() => onOpenKnowledge()}>睡眠知识</button>
      {assessmentResult && <p>最近 ISI {assessmentResult.isi.score}</p>}
    </main>
  );
}

export function MyPage({ profile, onReset }: { profile: SleepProfile; onReset: () => void }) {
  return (
    <main className="page my-page">
      <h1>我的</h1>
      <section className="settings-card">
        <h2>睡眠档案</h2>
        <p>{profile.ageRange} · {profile.mainConcern}</p>
        <p>通常睡眠 {profile.bedtime}-{profile.wakeTime}</p>
      </section>
      <section className="settings-card">
        <h2>提醒设置</h2>
        <p>本版本仅在应用内展示提醒，不请求系统通知权限。</p>
      </section>
      <section className="settings-card">
        <h2>本地数据</h2>
        <p>日记、趋势、方案和咨询记录仅保存在本浏览器。</p>
        <button type="button" onClick={onReset}>重置档案</button>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Refactor App routing**

In `src/App.tsx`, replace dashboard as the default authenticated view with:

```ts
type MainTab = 'today' | 'diary' | 'trends' | 'plans' | 'my';
type ChildView = 'assessment' | 'knowledge' | 'chat' | 'relaxation' | null;

const [activeTab, setActiveTab] = useState<MainTab>('today');
const [childView, setChildView] = useState<ChildView>(null);
const [selectedRelaxationTool, setSelectedRelaxationTool] = useState('breathing-478');
```

Render child views first when `childView` is set. Otherwise render the active tab page and `BottomTabs`. Keep the existing `EntryPage` and `ProfileWizard` behavior for users without a profile.

- [ ] **Step 5: Run navigation tests and commit**

Run:

```bash
npm test -- src/App.test.tsx src/components/BottomTabs.test.tsx src/components/TodayPage.test.tsx src/components/MyPage.test.tsx
```

Expected: PASS.

Commit:

```bash
git add src/App.tsx src/App.test.tsx src/components/BottomTabs.tsx src/components/BottomTabs.test.tsx src/components/TodayPage.tsx src/components/TodayPage.test.tsx src/components/MyPage.tsx src/components/MyPage.test.tsx
git commit -m "feat: add sleep enhancement tab shell"
```

---

### Task 8: Styling, E2E, README, And Full Verification

**Files:**
- Modify: `src/styles.css`
- Modify: `e2e/mvp.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Add responsive styles**

Append focused CSS sections to `src/styles.css`:

```css
.app-shell {
  min-height: 100vh;
  padding-bottom: 84px;
}

.bottom-tabs {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(640px, 100%);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(11, 16, 38, 0.96);
  border-top: 1px solid rgba(168, 180, 214, 0.14);
  box-sizing: border-box;
  z-index: 10;
}

.bottom-tab {
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  padding: 8px 4px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.bottom-tab.active {
  color: var(--night-deep);
  background: var(--moonbeam);
  font-weight: 700;
}

.metric-grid,
.plan-grid,
.today-action-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.metric-card,
.plan-card,
.daily-card,
.settings-card {
  border: 1px solid rgba(168, 180, 214, 0.12);
  background: var(--night-surface);
  border-radius: var(--radius-md);
  padding: 16px;
}

.diary-form {
  display: grid;
  gap: 14px;
}

.timer-display {
  font-size: 48px;
  font-weight: 700;
  color: var(--moonbeam);
  text-align: center;
}
```

- [ ] **Step 2: Extend e2e smoke**

Modify `e2e/mvp.spec.ts` to include:

```ts
await page.getByRole('button', { name: '日记' }).click();
await expect(page.getByRole('heading', { name: '睡眠日记' })).toBeVisible();
await page.getByLabel('睡前情绪').fill('平静');
await page.getByRole('button', { name: '保存睡前记录' }).click();
await page.getByLabel('入睡时间').fill('23:40');
await page.getByLabel('起床时间').fill('07:10');
await page.getByLabel('入睡耗时').fill('35');
await page.getByRole('button', { name: '保存起床记录' }).click();
await page.getByRole('button', { name: '趋势' }).click();
await expect(page.getByText(/近 7 天/)).toBeVisible();
await page.getByRole('button', { name: '方案' }).click();
await expect(page.getByText('推荐方案')).toBeVisible();
```

- [ ] **Step 3: Update README**

Add a section:

```md
## Sleep Enhancement Data

The enhanced diary, trend, reminder, relaxation, and plan recommendation features are local-first. Data is stored in this browser through localStorage with sync-ready IDs and timestamps, but this version does not include accounts, backend storage, browser notifications, or audio playback.

Verification:

```bash
npm test
npm run build
npm run e2e
```
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test
npm run build
npm run e2e
```

Expected: all pass.

- [ ] **Step 5: Commit final integration**

Commit:

```bash
git add src/styles.css e2e/mvp.spec.ts README.md
git commit -m "test: cover sleep enhancement flow"
```

---

## Final Review Checklist

- [ ] `今日 / 日记 / 趋势 / 方案 / 我的` appears in Chinese.
- [ ] Existing chat, assessment, and knowledge flows remain reachable.
- [ ] Diary saves bedtime and wake sections for the same date.
- [ ] Trends render empty and populated states.
- [ ] Reminders are in-app only and do not request browser notification permission.
- [ ] Relaxation tools show text steps and unavailable audio state.
- [ ] Plan recommendations are deterministic and show reasons.
- [ ] `clearAllLocalData()` clears all new local data.
- [ ] `npm test`, `npm run build`, and `npm run e2e` pass.
