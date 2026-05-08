# MVP Required Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Chinese scene navigation, ISI plus simplified PSQI self-assessment, and AI-generated scene knowledge cards to the existing sleep wellness H5 MVP.

**Architecture:** Keep local-first product state in the browser and keep AI calls behind serverless APIs. Domain scoring and response normalization live outside React components; React pages render Chinese UI and call typed clients. The existing chat API is extended with assessment context, and a new `/api/knowledge` endpoint mirrors the current provider parsing and safe fallback pattern.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Playwright, Vercel serverless functions, browser `localStorage`.

---

## File Structure

Create:

- `src/domain/scenarios.ts`: fixed scene definitions, Chinese labels, descriptions, and scene prompt builders.
- `src/domain/assessment.ts`: ISI questions, simplified PSQI questions, scoring, summaries, and risk flags.
- `src/domain/assessment.test.ts`: domain tests for score boundaries and risk flags.
- `src/domain/knowledge.ts`: knowledge response normalization, fallback response, and type helpers.
- `src/domain/knowledge.test.ts`: tests for normalization and fallback behavior.
- `api/knowledgePrompt.ts`: strict Chinese JSON prompt builder for scene knowledge cards.
- `api/knowledgeLogic.ts`: request validation, high-risk handling, provider call, JSON parsing, normalization.
- `api/knowledge.ts`: Vercel handler for `POST /api/knowledge`.
- `api/knowledge.test.ts`: API behavior tests.
- `src/api/knowledgeClient.ts`: typed frontend client for `/api/knowledge`.
- `src/api/knowledgeClient.test.ts`: client normalization and failure tests.
- `src/components/DashboardPage.tsx`: post-profile Chinese dashboard.
- `src/components/DashboardPage.test.tsx`: dashboard rendering and navigation tests.
- `src/components/ScenarioLauncher.tsx`: shared scene option component.
- `src/components/AssessmentPage.tsx`: Chinese assessment form and report page.
- `src/components/AssessmentPage.test.tsx`: assessment form/report tests.
- `src/components/KnowledgePage.tsx`: scene knowledge generation, cache, retry, regenerate UI.
- `src/components/KnowledgePage.test.tsx`: knowledge UI states and cache tests.

Modify:

- `src/domain/types.ts`: add `SleepScenario`, `AssessmentResult`, `KnowledgeCard`, `KnowledgeResponse`; update chat client/API input types.
- `src/storage/localStore.ts`: add assessment and knowledge cache persistence; reset clears all local data.
- `src/storage/localStore.test.ts`: cover new storage keys and reset behavior.
- `api/chatLogic.ts`: accept optional `assessmentResult` and pass to prompt.
- `api/prompt.ts`: include Chinese assessment context when present.
- `api/chat.test.ts`: assert prompt receives assessment context and conservative safety still works.
- `src/api/chatClient.ts`: include optional `assessmentResult`.
- `src/components/ChatPage.tsx`: add Chinese return action, optional scene prompt, latest assessment summary.
- `src/components/ChatPage.test.tsx`: cover return action and assessment context in sent request.
- `src/App.tsx`: route among entry, profile, dashboard, assessment, knowledge, chat.
- `src/App.test.tsx`: update English expectations to Chinese and verify dashboard landing.
- `src/styles.css`: add responsive dashboard, scene, assessment, report, and knowledge layouts.
- `e2e/mvp.spec.ts`: update flow to Chinese UI and dashboard.
- `e2e/app.spec.ts`: add assessment and knowledge smoke flows if this file already owns broader acceptance coverage.
- `README.md`: document new verification scope and local-only assessment/cache storage.

---

### Task 1: Domain Types And Scene Definitions

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/scenarios.ts`
- Create: `src/domain/assessment.ts`
- Create: `src/domain/assessment.test.ts`

- [ ] **Step 1: Write failing assessment and scene tests**

Add `src/domain/assessment.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildAssessmentResult, getIsiLevel, getPsqiLiteLevel, isiQuestions, psqiLiteQuestions } from './assessment';
import { sleepScenarios, buildScenePrompt } from './scenarios';
import type { SleepProfile } from './types';

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

describe('assessment scoring', () => {
  it('defines the complete ISI and simplified sleep quality questions in Chinese', () => {
    expect(isiQuestions).toHaveLength(7);
    expect(psqiLiteQuestions).toHaveLength(6);
    expect(isiQuestions[0].title).toContain('入睡');
    expect(psqiLiteQuestions[0].title).toContain('睡眠质量');
  });

  it('maps ISI score boundaries to expected levels', () => {
    expect(getIsiLevel(0)).toBe('none');
    expect(getIsiLevel(7)).toBe('none');
    expect(getIsiLevel(8)).toBe('mild');
    expect(getIsiLevel(14)).toBe('mild');
    expect(getIsiLevel(15)).toBe('moderate');
    expect(getIsiLevel(21)).toBe('moderate');
    expect(getIsiLevel(22)).toBe('severe');
    expect(getIsiLevel(28)).toBe('severe');
  });

  it('maps simplified sleep quality score boundaries to expected levels', () => {
    expect(getPsqiLiteLevel(0)).toBe('good');
    expect(getPsqiLiteLevel(5)).toBe('good');
    expect(getPsqiLiteLevel(6)).toBe('fair');
    expect(getPsqiLiteLevel(11)).toBe('fair');
    expect(getPsqiLiteLevel(12)).toBe('poor');
    expect(getPsqiLiteLevel(24)).toBe('poor');
  });

  it('builds Chinese summaries and risk flags from answers and profile safety signals', () => {
    const result = buildAssessmentResult({
      isiAnswers: [4, 4, 4, 4, 3, 3, 3],
      psqiLiteAnswers: [4, 4, 4, 4, 4, 4],
      profile: { ...profile, safetySignals: ['疑似睡眠呼吸暂停'] },
      now: new Date('2026-05-08T08:00:00.000Z'),
    });

    expect(result.completedAt).toBe('2026-05-08T08:00:00.000Z');
    expect(result.isi).toMatchObject({ score: 26, level: 'severe' });
    expect(result.psqiLite).toMatchObject({ score: 24, level: 'poor' });
    expect(result.isi.summary).toContain('较重');
    expect(result.psqiLite.summary).toContain('较差');
    expect(result.riskFlags).toEqual(expect.arrayContaining(['失眠严重度较高', '睡眠质量较差', '存在安全信号：疑似睡眠呼吸暂停']));
  });
});

describe('sleep scenarios', () => {
  it('defines fixed Chinese scenario labels', () => {
    expect(sleepScenarios.map((scenario) => scenario.label)).toEqual([
      '入睡困难',
      '熬夜习惯',
      '压力焦虑',
      '睡眠质量差',
      '养生调理',
    ]);
  });

  it('builds a Chinese scene prompt for chat launch', () => {
    expect(buildScenePrompt('late_night_habit')).toContain('熬夜');
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
npm test -- src/domain/assessment.test.ts
```

Expected: FAIL because `src/domain/assessment.ts` and `src/domain/scenarios.ts` do not exist.

- [ ] **Step 3: Add domain types**

Modify `src/domain/types.ts` by appending these exported types after `FeedbackEvent`:

```ts
export type SleepScenario =
  | 'hard_to_fall_asleep'
  | 'late_night_habit'
  | 'stress_anxiety'
  | 'poor_sleep_quality'
  | 'wellness_regulation';

export interface AssessmentSectionResult<TLevel extends string> {
  answers: number[];
  score: number;
  level: TLevel;
  summary: string;
}

export interface AssessmentResult {
  completedAt: string;
  isi: AssessmentSectionResult<'none' | 'mild' | 'moderate' | 'severe'>;
  psqiLite: AssessmentSectionResult<'good' | 'fair' | 'poor'>;
  riskFlags: string[];
}

export interface KnowledgeCard {
  title: string;
  summary: string;
  keyPoints: string[];
  misconceptions: string[];
  actions: Suggestion[];
  safetyNote: string | null;
  followUpQuestions: string[];
}

export interface KnowledgeResponse {
  scenario: SleepScenario;
  cards: KnowledgeCard[];
  disclaimer: string;
  generatedAt: string;
}
```

- [ ] **Step 4: Add fixed scenarios**

Create `src/domain/scenarios.ts`:

```ts
import type { SleepScenario } from './types';

export interface SleepScenarioDefinition {
  value: SleepScenario;
  label: string;
  description: string;
  chatPrompt: string;
}

export const sleepScenarios: SleepScenarioDefinition[] = [
  {
    value: 'hard_to_fall_asleep',
    label: '入睡困难',
    description: '睡前清醒、脑子停不下来、越想睡越睡不着',
    chatPrompt: '我最近入睡困难，请结合我的睡眠档案，帮我分析可能原因，并给出今晚可以执行的建议。',
  },
  {
    value: 'late_night_habit',
    label: '熬夜习惯',
    description: '刷手机、打游戏或工作拖到很晚，想减少损伤',
    chatPrompt: '我有熬夜习惯，请结合我的作息，帮我制定更容易执行的调整建议。',
  },
  {
    value: 'stress_anxiety',
    label: '压力焦虑',
    description: '压力大、紧张、睡前反复想事情',
    chatPrompt: '我睡前容易焦虑和想很多事，请结合我的情况，给我低风险的放松和睡前安排建议。',
  },
  {
    value: 'poor_sleep_quality',
    label: '睡眠质量差',
    description: '多梦、易醒、睡够了还是疲惫',
    chatPrompt: '我感觉睡眠质量差，请结合我的档案，帮我分析可能因素和改善方向。',
  },
  {
    value: 'wellness_regulation',
    label: '养生调理',
    description: '希望从作息、饮食、运动和放松习惯综合改善',
    chatPrompt: '我想从养生和生活方式角度改善睡眠，请结合我的档案给出稳妥建议。',
  },
];

export function getScenarioDefinition(value: SleepScenario): SleepScenarioDefinition {
  return sleepScenarios.find((scenario) => scenario.value === value) || sleepScenarios[0];
}

export function isSleepScenario(value: unknown): value is SleepScenario {
  return typeof value === 'string' && sleepScenarios.some((scenario) => scenario.value === value);
}

export function buildScenePrompt(value: SleepScenario): string {
  return getScenarioDefinition(value).chatPrompt;
}
```

- [ ] **Step 5: Add assessment scoring**

Create `src/domain/assessment.ts`:

```ts
import type { AssessmentResult, SleepProfile } from './types';

export interface AssessmentQuestion {
  id: string;
  title: string;
  options: Array<{ label: string; value: number }>;
}

const frequencyOptions = [
  { label: '没有', value: 0 },
  { label: '轻微', value: 1 },
  { label: '中等', value: 2 },
  { label: '明显', value: 3 },
  { label: '非常严重', value: 4 },
];

export const isiQuestions: AssessmentQuestion[] = [
  { id: 'isi-fall-asleep', title: '过去两周，入睡困难的程度如何？', options: frequencyOptions },
  { id: 'isi-stay-asleep', title: '过去两周，夜间维持睡眠困难的程度如何？', options: frequencyOptions },
  { id: 'isi-early-waking', title: '过去两周，早醒问题的程度如何？', options: frequencyOptions },
  { id: 'isi-satisfaction', title: '你对当前睡眠模式的满意程度如何？', options: [
    { label: '很满意', value: 0 },
    { label: '较满意', value: 1 },
    { label: '一般', value: 2 },
    { label: '不太满意', value: 3 },
    { label: '很不满意', value: 4 },
  ] },
  { id: 'isi-daytime-impact', title: '睡眠问题对白天功能的影响程度如何？', options: frequencyOptions },
  { id: 'isi-noticeable', title: '他人是否容易注意到你的睡眠问题造成的影响？', options: frequencyOptions },
  { id: 'isi-worry', title: '你对当前睡眠问题的担心程度如何？', options: frequencyOptions },
];

export const psqiLiteQuestions: AssessmentQuestion[] = [
  { id: 'psqi-quality', title: '过去一周，你的主观睡眠质量如何？', options: [
    { label: '很好', value: 0 },
    { label: '还可以', value: 1 },
    { label: '一般偏差', value: 2 },
    { label: '较差', value: 3 },
    { label: '很差', value: 4 },
  ] },
  { id: 'psqi-latency', title: '通常需要多久才能睡着？', options: [
    { label: '15 分钟以内', value: 0 },
    { label: '16-30 分钟', value: 1 },
    { label: '31-60 分钟', value: 2 },
    { label: '1-2 小时', value: 3 },
    { label: '超过 2 小时', value: 4 },
  ] },
  { id: 'psqi-duration', title: '最近实际睡眠时长通常是多少？', options: [
    { label: '7 小时及以上', value: 0 },
    { label: '6-7 小时', value: 1 },
    { label: '5-6 小时', value: 2 },
    { label: '4-5 小时', value: 3 },
    { label: '少于 4 小时', value: 4 },
  ] },
  { id: 'psqi-interruption', title: '夜间醒来或睡眠中断的频率如何？', options: [
    { label: '很少', value: 0 },
    { label: '每周 1 次左右', value: 1 },
    { label: '每周 2 次左右', value: 2 },
    { label: '每周 3 次以上', value: 3 },
    { label: '几乎每晚多次', value: 4 },
  ] },
  { id: 'psqi-daytime', title: '白天困倦、注意力下降或疲惫的程度如何？', options: frequencyOptions },
  { id: 'psqi-sleep-aid', title: '是否依赖助眠药物、酒精或其他方式才能入睡？', options: [
    { label: '没有', value: 0 },
    { label: '偶尔', value: 1 },
    { label: '每周 1-2 次', value: 2 },
    { label: '每周 3 次以上', value: 3 },
    { label: '几乎每天', value: 4 },
  ] },
];

export function getIsiLevel(score: number): AssessmentResult['isi']['level'] {
  if (score <= 7) return 'none';
  if (score <= 14) return 'mild';
  if (score <= 21) return 'moderate';
  return 'severe';
}

export function getPsqiLiteLevel(score: number): AssessmentResult['psqiLite']['level'] {
  if (score <= 5) return 'good';
  if (score <= 11) return 'fair';
  return 'poor';
}

function sum(answers: number[]): number {
  return answers.reduce((total, value) => total + value, 0);
}

function isiSummary(level: AssessmentResult['isi']['level']): string {
  const summaries = {
    none: '当前 ISI 自评分未显示明显失眠倾向，可继续保持稳定作息。',
    mild: '当前 ISI 自评分提示轻度失眠倾向，建议先从作息和睡前习惯调整入手。',
    moderate: '当前 ISI 自评分提示中度失眠倾向，建议连续观察并考虑寻求专业评估。',
    severe: '当前 ISI 自评分提示较重失眠倾向，建议尽快寻求专业医生或睡眠门诊评估。',
  };
  return summaries[level];
}

function psqiLiteSummary(level: AssessmentResult['psqiLite']['level']): string {
  const summaries = {
    good: '简化睡眠质量筛查显示整体睡眠质量较好，可继续保持现有节律。',
    fair: '简化睡眠质量筛查显示睡眠质量有波动，建议优先调整睡前行为和白天节律。',
    poor: '简化睡眠质量筛查显示睡眠质量较差，如果持续存在，建议寻求专业评估。',
  };
  return summaries[level];
}

function riskFlags(params: {
  isiLevel: AssessmentResult['isi']['level'];
  psqiLevel: AssessmentResult['psqiLite']['level'];
  psqiAnswers: number[];
  profile: SleepProfile;
}): string[] {
  const flags: string[] = [];
  if (params.isiLevel === 'severe') flags.push('失眠严重度较高');
  if (params.psqiLevel === 'poor') flags.push('睡眠质量较差');
  if (params.psqiAnswers[2] >= 3) flags.push('实际睡眠时长明显不足');
  if (params.psqiAnswers[4] >= 3) flags.push('白天功能受影响较明显');
  if (params.psqiAnswers[5] >= 3) flags.push('存在助眠药物或酒精依赖风险');
  params.profile.safetySignals.forEach((signal) => flags.push(`存在安全信号：${signal}`));
  return Array.from(new Set(flags));
}

export function buildAssessmentResult(input: {
  isiAnswers: number[];
  psqiLiteAnswers: number[];
  profile: SleepProfile;
  now?: Date;
}): AssessmentResult {
  const isiScore = sum(input.isiAnswers);
  const psqiScore = sum(input.psqiLiteAnswers);
  const isiLevel = getIsiLevel(isiScore);
  const psqiLevel = getPsqiLiteLevel(psqiScore);

  return {
    completedAt: (input.now || new Date()).toISOString(),
    isi: {
      answers: input.isiAnswers,
      score: isiScore,
      level: isiLevel,
      summary: isiSummary(isiLevel),
    },
    psqiLite: {
      answers: input.psqiLiteAnswers,
      score: psqiScore,
      level: psqiLevel,
      summary: psqiLiteSummary(psqiLevel),
    },
    riskFlags: riskFlags({ isiLevel, psqiLevel, psqiAnswers: input.psqiLiteAnswers, profile: input.profile }),
  };
}
```

- [ ] **Step 6: Run tests for Task 1**

Run:

```bash
npm test -- src/domain/assessment.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add src/domain/types.ts src/domain/scenarios.ts src/domain/assessment.ts src/domain/assessment.test.ts
git commit -m "feat: add sleep assessment domain"
```

Expected: commit succeeds with only Task 1 files staged.

---

### Task 2: Local Storage For Assessment And Knowledge Cache

**Files:**
- Modify: `src/storage/localStore.ts`
- Modify: `src/storage/localStore.test.ts`

- [ ] **Step 1: Write failing storage tests**

Update the imports at the top of `src/storage/localStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllLocalData,
  getAssessmentResult,
  getChatHistory,
  getFeedbackEvents,
  getKnowledgeCache,
  getSleepProfile,
  saveAssessmentResult,
  saveChatHistory,
  saveFeedbackEvents,
  saveKnowledgeCache,
  saveSleepProfile,
} from './localStore';
import type { AssessmentResult, KnowledgeResponse, SleepProfile } from '../domain/types';
```

Append these constants after the existing `profile` constant:

```ts
const assessmentResult: AssessmentResult = {
  completedAt: '2026-05-08T08:00:00.000Z',
  isi: { answers: [1, 1, 1, 1, 1, 1, 1], score: 7, level: 'none', summary: '当前 ISI 自评分未显示明显失眠倾向。' },
  psqiLite: { answers: [1, 1, 1, 1, 1, 1], score: 6, level: 'fair', summary: '简化睡眠质量筛查显示睡眠质量有波动。' },
  riskFlags: [],
};

const knowledgeResponse: KnowledgeResponse = {
  scenario: 'hard_to_fall_asleep',
  generatedAt: '2026-05-08T08:00:00.000Z',
  disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
  cards: [
    {
      title: '为什么越想睡越睡不着',
      summary: '压力和过度关注睡眠可能让身体更清醒。',
      keyPoints: ['睡前警觉升高'],
      misconceptions: ['躺得越久越容易睡着'],
      actions: [{ title: '离床放松', detail: '超过 20 分钟仍睡不着时，起身做低刺激放松。' }],
      safetyNote: null,
      followUpQuestions: ['你睡前通常会看手机吗？'],
    },
  ],
};
```

Append these tests inside the existing `describe('localStore', () => { ... })` block:

```ts
it('persists assessment result and knowledge cache locally', () => {
  saveAssessmentResult(assessmentResult);
  saveKnowledgeCache({ hard_to_fall_asleep: knowledgeResponse });

  expect(getAssessmentResult()).toEqual(assessmentResult);
  expect(getKnowledgeCache()).toEqual({ hard_to_fall_asleep: knowledgeResponse });
});

it('clears assessment result and knowledge cache with all local data', () => {
  saveAssessmentResult(assessmentResult);
  saveKnowledgeCache({ hard_to_fall_asleep: knowledgeResponse });

  clearAllLocalData();

  expect(getAssessmentResult()).toBeNull();
  expect(getKnowledgeCache()).toEqual({});
});
```

- [ ] **Step 2: Run storage tests to verify failure**

Run:

```bash
npm test -- src/storage/localStore.test.ts
```

Expected: FAIL because the new storage functions are not exported.

- [ ] **Step 3: Implement storage functions**

Modify `src/storage/localStore.ts`:

```ts
import type { AssessmentResult, ChatMessage, FeedbackEvent, KnowledgeResponse, SleepProfile, SleepScenario } from '../domain/types';

const keys = {
  profile: 'sleepProfile',
  chatHistory: 'chatHistory',
  feedbackEvents: 'feedbackEvents',
  assessmentResult: 'assessmentResult',
  knowledgeCache: 'knowledgeCache',
} as const;

export type KnowledgeCache = Partial<Record<SleepScenario, KnowledgeResponse>>;
```

Append these functions before `clearAllLocalData()`:

```ts
export function getAssessmentResult(): AssessmentResult | null {
  return readJson<AssessmentResult | null>(keys.assessmentResult, null);
}

export function saveAssessmentResult(result: AssessmentResult): void {
  writeJson(keys.assessmentResult, result);
}

export function getKnowledgeCache(): KnowledgeCache {
  return readJson<KnowledgeCache>(keys.knowledgeCache, {});
}

export function saveKnowledgeCache(cache: KnowledgeCache): void {
  writeJson(keys.knowledgeCache, cache);
}
```

Update `clearAllLocalData()`:

```ts
export function clearAllLocalData(): void {
  removeKey(keys.profile);
  removeKey(keys.chatHistory);
  removeKey(keys.feedbackEvents);
  removeKey(keys.assessmentResult);
  removeKey(keys.knowledgeCache);
}
```

- [ ] **Step 4: Run storage tests**

Run:

```bash
npm test -- src/storage/localStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add src/storage/localStore.ts src/storage/localStore.test.ts
git commit -m "feat: persist assessment and knowledge cache"
```

Expected: commit succeeds with only storage files staged.

---

### Task 3: Knowledge Response Normalization And API

**Files:**
- Create: `src/domain/knowledge.ts`
- Create: `src/domain/knowledge.test.ts`
- Create: `api/knowledgePrompt.ts`
- Create: `api/knowledgeLogic.ts`
- Create: `api/knowledge.ts`
- Create: `api/knowledge.test.ts`

- [ ] **Step 1: Write failing domain tests**

Create `src/domain/knowledge.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fallbackKnowledgeResponse, normalizeKnowledgeResponse } from './knowledge';

describe('knowledge response normalization', () => {
  it('normalizes valid structured card output', () => {
    const result = normalizeKnowledgeResponse({
      scenario: 'hard_to_fall_asleep',
      generatedAt: '2026-05-08T08:00:00.000Z',
      disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
      cards: [
        {
          title: '为什么越想睡越睡不着',
          summary: '睡前过度努力可能提高警觉水平。',
          keyPoints: ['压力会提高警觉'],
          misconceptions: ['躺得越久越容易睡着'],
          actions: [{ title: '离床放松', detail: '睡不着时离床做低刺激放松。' }],
          safetyNote: null,
          followUpQuestions: ['你睡前会刷手机吗？'],
        },
      ],
    });

    expect(result.cards[0].title).toBe('为什么越想睡越睡不着');
    expect(result.disclaimer).toContain('不作为医疗诊断');
  });

  it('returns Chinese fallback for malformed output', () => {
    const result = normalizeKnowledgeResponse({ scenario: 'hard_to_fall_asleep', cards: [{ title: '不完整' }] });

    expect(result.cards[0].title).toBe('暂时无法生成可靠知识卡片');
    expect(result.cards[0].safetyNote).toContain('专业评估');
    expect(result.disclaimer).toContain('不作为医疗诊断');
  });

  it('builds conservative fallback for high-risk contexts', () => {
    const result = fallbackKnowledgeResponse('poor_sleep_quality', '建议优先寻求专业评估。');

    expect(result.scenario).toBe('poor_sleep_quality');
    expect(result.cards[0].summary).toContain('专业评估');
  });
});
```

- [ ] **Step 2: Run domain tests to verify failure**

Run:

```bash
npm test -- src/domain/knowledge.test.ts
```

Expected: FAIL because `src/domain/knowledge.ts` does not exist.

- [ ] **Step 3: Implement knowledge normalization**

Create `src/domain/knowledge.ts`:

```ts
import { defaultDisclaimer } from './safety';
import { isSleepScenario } from './scenarios';
import type { KnowledgeCard, KnowledgeResponse, SleepScenario, Suggestion } from './types';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSuggestionArray(value: unknown): value is Suggestion[] {
  return Array.isArray(value) && value.every((item) =>
    item &&
    typeof item === 'object' &&
    typeof (item as Suggestion).title === 'string' &&
    typeof (item as Suggestion).detail === 'string'
  );
}

function isKnowledgeCard(value: unknown): value is KnowledgeCard {
  if (!value || typeof value !== 'object') return false;
  const card = value as KnowledgeCard;
  return (
    typeof card.title === 'string' &&
    typeof card.summary === 'string' &&
    isStringArray(card.keyPoints) &&
    isStringArray(card.misconceptions) &&
    isSuggestionArray(card.actions) &&
    (card.safetyNote === null || typeof card.safetyNote === 'string') &&
    isStringArray(card.followUpQuestions)
  );
}

export function fallbackKnowledgeResponse(
  scenario: SleepScenario = 'hard_to_fall_asleep',
  safetyNote = '如果睡眠问题严重、持续加重，或伴随明显白天功能受损，建议寻求专业医生或睡眠门诊评估。',
): KnowledgeResponse {
  return {
    scenario,
    generatedAt: new Date().toISOString(),
    disclaimer: defaultDisclaimer,
    cards: [
      {
        title: '暂时无法生成可靠知识卡片',
        summary: '当前内容生成不稳定。为了安全起见，先提供保守的健康管理提醒，并建议在症状明显或持续时寻求专业评估。',
        keyPoints: ['保持规律起床时间', '避免自行调整药物或剂量', '记录睡眠变化和白天影响'],
        misconceptions: ['不要把 AI 内容当作诊断', '不要依赖酒精或自行加量用药来助眠'],
        actions: [
          { title: '记录一周睡眠', detail: '记录上床时间、入睡估计时间、夜醒次数、起床时间和白天精神状态。' },
          { title: '优先降低风险', detail: '如有呼吸暂停、自伤想法、胸痛、药物依赖等信号，请及时寻求专业帮助。' },
        ],
        safetyNote,
        followUpQuestions: ['我应该记录哪些睡眠信息？', '什么情况下需要去睡眠门诊？'],
      },
    ],
  };
}

export function normalizeKnowledgeResponse(payload: unknown): KnowledgeResponse {
  if (!payload || typeof payload !== 'object') {
    return fallbackKnowledgeResponse();
  }

  const input = payload as Partial<KnowledgeResponse>;
  if (
    !isSleepScenario(input.scenario) ||
    !Array.isArray(input.cards) ||
    input.cards.length === 0 ||
    input.cards.length > 4 ||
    !input.cards.every(isKnowledgeCard)
  ) {
    return fallbackKnowledgeResponse(isSleepScenario(input.scenario) ? input.scenario : 'hard_to_fall_asleep');
  }

  return {
    scenario: input.scenario,
    cards: input.cards,
    disclaimer: typeof input.disclaimer === 'string' ? input.disclaimer : defaultDisclaimer,
    generatedAt: typeof input.generatedAt === 'string' ? input.generatedAt : new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run domain tests**

Run:

```bash
npm test -- src/domain/knowledge.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing API tests**

Create `api/knowledge.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import handler from './knowledge';
import type { AssessmentResult, SleepProfile } from '../src/domain/types';
import { callAiProvider } from './provider';

vi.mock('./provider', () => ({
  callAiProvider: vi.fn(async () => ({
    content: JSON.stringify({
      scenario: 'hard_to_fall_asleep',
      generatedAt: '2026-05-08T08:00:00.000Z',
      disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
      cards: [
        {
          title: '为什么越想睡越睡不着',
          summary: '压力和过度关注睡眠会提高睡前警觉。',
          keyPoints: ['睡前警觉升高'],
          misconceptions: ['躺得越久越容易睡着'],
          actions: [{ title: '安排离床放松', detail: '超过 20 分钟仍睡不着时，离开床做低刺激放松。' }],
          safetyNote: null,
          followUpQuestions: ['你睡前通常会做什么？'],
        },
      ],
    }),
  })),
}));

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

const assessmentResult: AssessmentResult = {
  completedAt: '2026-05-08T08:00:00.000Z',
  isi: { answers: [2, 2, 2, 2, 2, 2, 2], score: 14, level: 'mild', summary: '轻度失眠倾向。' },
  psqiLite: { answers: [2, 2, 2, 2, 2, 2], score: 12, level: 'poor', summary: '睡眠质量较差。' },
  riskFlags: ['睡眠质量较差'],
};

function mockRes() {
  return {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

describe('knowledge api', () => {
  it('rejects non-POST requests', async () => {
    const res = mockRes();
    await handler({ method: 'GET', body: {} } as never, res as never);

    expect(res.statusCode).toBe(405);
  });

  it('rejects invalid scenario', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, scenario: 'bad' } } as never, res as never);

    expect(res.statusCode).toBe(400);
  });

  it('returns normalized Chinese cards for valid requests', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, scenario: 'hard_to_fall_asleep', assessmentResult } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      scenario: 'hard_to_fall_asleep',
      cards: [{ title: '为什么越想睡越睡不着' }],
    });
    expect(vi.mocked(callAiProvider).mock.calls[0][0]).toContain('轻度失眠倾向');
  });

  it('returns safe fallback on provider failure', async () => {
    vi.mocked(callAiProvider).mockRejectedValueOnce(new Error('provider down'));
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, scenario: 'hard_to_fall_asleep' } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ cards: [{ title: '暂时无法生成可靠知识卡片' }] });
  });

  it('returns conservative cards without provider call for profile safety signals', async () => {
    vi.mocked(callAiProvider).mockClear();
    const res = mockRes();
    await handler({
      method: 'POST',
      body: { profile: { ...profile, safetySignals: ['自伤想法'] }, scenario: 'stress_anxiety' },
    } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ scenario: 'stress_anxiety' });
    expect(JSON.stringify(res.body)).toContain('专业评估');
    expect(callAiProvider).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run API test to verify failure**

Run:

```bash
npm test -- api/knowledge.test.ts
```

Expected: FAIL because `api/knowledge.ts` does not exist.

- [ ] **Step 7: Implement knowledge prompt and logic**

Create `api/knowledgePrompt.ts`:

```ts
import type { AssessmentResult, SleepProfile, SleepScenario } from '../src/domain/types';
import { getScenarioDefinition } from '../src/domain/scenarios';

function assessmentSummary(result?: AssessmentResult): string {
  if (!result) return '暂无测评结果';
  return [
    `ISI：${result.isi.score} 分，${result.isi.summary}`,
    `简化睡眠质量筛查：${result.psqiLite.score} 分，${result.psqiLite.summary}`,
    `风险提示：${result.riskFlags.join('、') || '无'}`,
  ].join('\n');
}

export function buildKnowledgePrompt(profile: SleepProfile, scenario: SleepScenario, assessmentResult?: AssessmentResult): string {
  const scene = getScenarioDefinition(scenario);
  return `
你是一位睡眠健康 AI 顾问，只提供健康管理参考，不提供医疗诊断。
请为用户选择的场景生成 2-4 张中文知识卡片。

严格要求：
- 只返回合法 JSON，不要 Markdown。
- 所有用户可见内容必须使用中文。
- 不要诊断疾病。
- 不要开处方。
- 不要推荐药物剂量。
- 不要宣称某种食物、补剂或技巧可以治愈失眠。
- 如存在高风险信号，优先建议专业评估，只提供低风险自我照护建议。

返回 JSON 格式：
{
  "scenario": "${scenario}",
  "cards": [
    {
      "title": "卡片标题",
      "summary": "简短解释",
      "keyPoints": ["要点"],
      "misconceptions": ["常见误区"],
      "actions": [{"title": "行动标题", "detail": "具体做法"}],
      "safetyNote": null,
      "followUpQuestions": ["可以继续问的问题"]
    }
  ],
  "disclaimer": "本内容仅提供健康管理参考，不作为医疗诊断。",
  "generatedAt": "${new Date().toISOString()}"
}

用户场景：${scene.label}
场景说明：${scene.description}

睡眠档案：
- 年龄段：${profile.ageRange}
- 就寝时间：${profile.bedtime}
- 起床时间：${profile.wakeTime}
- 主要问题：${profile.mainConcern}
- 持续时间：${profile.concernDuration}
- 压力水平：${profile.stressLevel}
- 习惯：${profile.habits.join('、') || '未提供'}
- 白天影响：${profile.daytimeImpact}
- 安全信号：${profile.safetySignals.join('、') || '无'}
- 补充说明：${profile.optionalContext || '未提供'}

测评结果：
${assessmentSummary(assessmentResult)}
`;
}
```

Create `api/knowledgeLogic.ts`:

```ts
import { fallbackKnowledgeResponse, normalizeKnowledgeResponse } from '../src/domain/knowledge';
import { isSleepScenario } from '../src/domain/scenarios';
import { detectHighRiskSignal } from '../src/domain/safety';
import type { AssessmentResult, SleepProfile } from '../src/domain/types';
import { callAiProvider } from './provider';
import { buildKnowledgePrompt } from './knowledgePrompt';

function parseProviderJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    for (let start = candidate.indexOf('{'); start !== -1; start = candidate.indexOf('{', start + 1)) {
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let index = start; index < candidate.length; index += 1) {
        const char = candidate[index];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\' && inString) {
          escaped = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (char === '{') depth += 1;
        if (char === '}') depth -= 1;
        if (depth === 0) return JSON.parse(candidate.slice(start, index + 1));
      }
    }
    throw new Error('Provider response did not contain JSON');
  }
}

interface KnowledgeInput {
  profile: SleepProfile;
  scenario: unknown;
  assessmentResult?: AssessmentResult;
}

function hasHighRiskContext(profile: SleepProfile, assessmentResult?: AssessmentResult): boolean {
  return (
    profile.safetySignals.length > 0 ||
    assessmentResult?.isi.level === 'severe' ||
    assessmentResult?.riskFlags.some((flag) => detectHighRiskSignal(flag)) === true
  );
}

export async function processKnowledge(input: KnowledgeInput): Promise<{ status: number; body: unknown }> {
  if (!input.profile || !isSleepScenario(input.scenario)) {
    return { status: 400, body: { error: 'Profile and valid scenario are required' } };
  }

  if (hasHighRiskContext(input.profile, input.assessmentResult)) {
    return {
      status: 200,
      body: fallbackKnowledgeResponse(input.scenario, '你的档案或测评结果包含需要谨慎对待的信号，建议优先寻求专业评估。'),
    };
  }

  try {
    const prompt = buildKnowledgePrompt(input.profile, input.scenario, input.assessmentResult);
    const providerResult = await callAiProvider(prompt);
    const parsed = parseProviderJson(providerResult.content);
    return { status: 200, body: normalizeKnowledgeResponse(parsed) };
  } catch (error) {
    console.error('Knowledge handler error:', error instanceof Error ? error.message : String(error));
    return { status: 200, body: fallbackKnowledgeResponse(input.scenario) };
  }
}
```

Create `api/knowledge.ts`:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processKnowledge } from './knowledgeLogic';
import { sendJson } from './response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const result = await processKnowledge(req.body);
  return sendJson(res, result.status, result.body);
}
```

- [ ] **Step 8: Run knowledge tests**

Run:

```bash
npm test -- src/domain/knowledge.test.ts api/knowledge.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

Run:

```bash
git add src/domain/knowledge.ts src/domain/knowledge.test.ts api/knowledgePrompt.ts api/knowledgeLogic.ts api/knowledge.ts api/knowledge.test.ts
git commit -m "feat: add ai knowledge card api"
```

Expected: commit succeeds with only Task 3 files staged.

---

### Task 4: Chat Assessment Context

**Files:**
- Modify: `api/prompt.ts`
- Modify: `api/chatLogic.ts`
- Modify: `api/chat.test.ts`
- Modify: `src/api/chatClient.ts`

- [ ] **Step 1: Add failing chat prompt test**

Append to `api/chat.test.ts`:

```ts
it('includes assessment context in provider prompt when provided', async () => {
  vi.mocked(callAiProvider).mockClear();
  const assessmentResult = {
    completedAt: '2026-05-08T08:00:00.000Z',
    isi: { answers: [2, 2, 2, 2, 2, 2, 2], score: 14, level: 'mild', summary: '轻度失眠倾向。' },
    psqiLite: { answers: [2, 2, 2, 2, 2, 2], score: 12, level: 'poor', summary: '睡眠质量较差。' },
    riskFlags: ['睡眠质量较差'],
  };
  const res = mockRes();

  await handler({ method: 'POST', body: { profile, message: '我该怎么调整？', history: [], assessmentResult } } as never, res as never);

  expect(res.statusCode).toBe(200);
  expect(vi.mocked(callAiProvider).mock.calls[0][0]).toContain('最近一次睡眠自测');
  expect(vi.mocked(callAiProvider).mock.calls[0][0]).toContain('ISI：14 分');
});
```

- [ ] **Step 2: Run chat test to verify failure**

Run:

```bash
npm test -- api/chat.test.ts
```

Expected: FAIL because the prompt does not include assessment context.

- [ ] **Step 3: Extend prompt builder**

Modify `api/prompt.ts`:

```ts
import type { AssessmentResult, ChatMessage, SleepProfile } from '../src/domain/types';

function formatAssessmentContext(assessmentResult?: AssessmentResult): string {
  if (!assessmentResult) return '暂无测评结果';
  return [
    '最近一次睡眠自测：',
    `- ISI：${assessmentResult.isi.score} 分，${assessmentResult.isi.summary}`,
    `- 简化睡眠质量筛查：${assessmentResult.psqiLite.score} 分，${assessmentResult.psqiLite.summary}`,
    `- 风险提示：${assessmentResult.riskFlags.join('、') || '无'}`,
    '引用这些信息时请表述为用户自测参考，不要当作诊断。',
  ].join('\n');
}

export function buildSleepAdvisorPrompt(
  profile: SleepProfile,
  message: string,
  history: ChatMessage[] = [],
  assessmentResult?: AssessmentResult,
): string {
```

Inside the returned template, add this block after the sleep profile block:

```ts
睡眠自测：
${formatAssessmentContext(assessmentResult)}
```

- [ ] **Step 4: Pass context through chat logic**

Modify `api/chatLogic.ts`:

```ts
import type { AssessmentResult, ChatMessage, SleepProfile } from '../src/domain/types';

export interface ChatInput {
  profile: SleepProfile;
  message: string;
  history?: ChatMessage[];
  assessmentResult?: AssessmentResult;
}
```

Change prompt construction:

```ts
const prompt = buildSleepAdvisorPrompt(input.profile, input.message, input.history || [], input.assessmentResult);
```

- [ ] **Step 5: Extend chat client input**

Modify `src/api/chatClient.ts`:

```ts
import type { AiResponse, AssessmentResult, ChatMessage, SleepProfile } from '../domain/types';

interface SendChatMessageInput {
  profile: SleepProfile;
  message: string;
  history: ChatMessage[];
  assessmentResult?: AssessmentResult | null;
}
```

Keep `JSON.stringify(input)` unchanged.

- [ ] **Step 6: Run chat tests**

Run:

```bash
npm test -- api/chat.test.ts src/api/chatClient.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

Run:

```bash
git add api/prompt.ts api/chatLogic.ts api/chat.test.ts src/api/chatClient.ts
git commit -m "feat: include assessment context in chat"
```

Expected: commit succeeds with only Task 4 files staged.

---

### Task 5: Knowledge Frontend Client

**Files:**
- Create: `src/api/knowledgeClient.ts`
- Create: `src/api/knowledgeClient.test.ts`

- [ ] **Step 1: Write failing client tests**

Create `src/api/knowledgeClient.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateKnowledgeCards } from './knowledgeClient';
import type { SleepProfile } from '../domain/types';

const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '较高',
  habits: [],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('generateKnowledgeCards', () => {
  it('posts profile and scenario then normalizes response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        scenario: 'hard_to_fall_asleep',
        generatedAt: '2026-05-08T08:00:00.000Z',
        disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
        cards: [
          {
            title: '入睡困难机制',
            summary: '压力可能提高警觉。',
            keyPoints: ['警觉升高'],
            misconceptions: ['躺久就能睡着'],
            actions: [{ title: '离床放松', detail: '睡不着时离开床。' }],
            safetyNote: null,
            followUpQuestions: ['睡前会看手机吗？'],
          },
        ],
      }),
    } as Response);

    const result = await generateKnowledgeCards({ profile, scenario: 'hard_to_fall_asleep' });

    expect(fetch).toHaveBeenCalledWith('/api/knowledge', expect.objectContaining({ method: 'POST' }));
    expect(result.cards[0].title).toBe('入睡困难机制');
  });

  it('throws a Chinese-facing error on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 500 } as Response);

    await expect(generateKnowledgeCards({ profile, scenario: 'hard_to_fall_asleep' })).rejects.toThrow('知识卡片生成失败');
  });
});
```

- [ ] **Step 2: Run client test to verify failure**

Run:

```bash
npm test -- src/api/knowledgeClient.test.ts
```

Expected: FAIL because `src/api/knowledgeClient.ts` does not exist.

- [ ] **Step 3: Implement client**

Create `src/api/knowledgeClient.ts`:

```ts
import { normalizeKnowledgeResponse } from '../domain/knowledge';
import type { AssessmentResult, KnowledgeResponse, SleepProfile, SleepScenario } from '../domain/types';

interface GenerateKnowledgeCardsInput {
  profile: SleepProfile;
  scenario: SleepScenario;
  assessmentResult?: AssessmentResult | null;
}

export async function generateKnowledgeCards(input: GenerateKnowledgeCardsInput): Promise<KnowledgeResponse> {
  const response = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`知识卡片生成失败：${response.status}`);
  }

  return normalizeKnowledgeResponse(await response.json());
}
```

- [ ] **Step 4: Run client tests**

Run:

```bash
npm test -- src/api/knowledgeClient.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 5**

Run:

```bash
git add src/api/knowledgeClient.ts src/api/knowledgeClient.test.ts
git commit -m "feat: add knowledge card client"
```

Expected: commit succeeds with only Task 5 files staged.

---

### Task 6: Dashboard And Routing

**Files:**
- Create: `src/components/ScenarioLauncher.tsx`
- Create: `src/components/DashboardPage.tsx`
- Create: `src/components/DashboardPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing dashboard tests**

Create `src/components/DashboardPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import type { AssessmentResult, SleepProfile } from '../domain/types';

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

const assessmentResult: AssessmentResult = {
  completedAt: '2026-05-08T08:00:00.000Z',
  isi: { answers: [1, 1, 1, 1, 1, 1, 1], score: 7, level: 'none', summary: '无明显失眠。' },
  psqiLite: { answers: [2, 2, 2, 2, 2, 2], score: 12, level: 'poor', summary: '睡眠质量较差。' },
  riskFlags: ['睡眠质量较差'],
};

describe('DashboardPage', () => {
  it('renders Chinese dashboard, scenes, and latest assessment summary', () => {
    render(
      <DashboardPage
        profile={profile}
        assessmentResult={assessmentResult}
        onStartAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenChat={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: '睡眠健康首页' })).toBeInTheDocument();
    expect(screen.getByText('入睡困难')).toBeInTheDocument();
    expect(screen.getByText('熬夜习惯')).toBeInTheDocument();
    expect(screen.getByText(/最近自测/)).toBeInTheDocument();
    expect(screen.getByText(/ISI 7 分/)).toBeInTheDocument();
  });

  it('launches chat from a scene', async () => {
    const user = userEvent.setup();
    const onOpenChat = vi.fn();
    render(
      <DashboardPage
        profile={profile}
        assessmentResult={null}
        onStartAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenChat={onOpenChat}
        onReset={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /咨询入睡困难/ }));

    expect(onOpenChat).toHaveBeenCalledWith('hard_to_fall_asleep');
  });
});
```

Update `src/App.test.tsx` expectations to Chinese and dashboard landing:

```tsx
expect(screen.getByRole('heading', { name: '几分钟内获得个性化睡眠指导' })).toBeInTheDocument();
expect(screen.getByRole('button', { name: '创建睡眠档案' })).toBeInTheDocument();
```

Final profile completion expectation:

```tsx
expect(screen.getByRole('heading', { name: '睡眠健康首页' })).toBeInTheDocument();
```

- [ ] **Step 2: Run dashboard tests to verify failure**

Run:

```bash
npm test -- src/components/DashboardPage.test.tsx src/App.test.tsx
```

Expected: FAIL because dashboard components and routing do not exist.

- [ ] **Step 3: Implement ScenarioLauncher**

Create `src/components/ScenarioLauncher.tsx`:

```tsx
import { sleepScenarios } from '../domain/scenarios';
import type { SleepScenario } from '../domain/types';

interface ScenarioLauncherProps {
  mode: 'chat' | 'knowledge';
  onSelect: (scenario: SleepScenario) => void;
}

export function ScenarioLauncher({ mode, onSelect }: ScenarioLauncherProps) {
  return (
    <section className="scenario-section" aria-labelledby="scenario-title">
      <h2 id="scenario-title">今天想改善什么？</h2>
      <div className="scenario-grid">
        {sleepScenarios.map((scenario) => (
          <button key={scenario.value} className="scenario-card" type="button" onClick={() => onSelect(scenario.value)}>
            <span className="scenario-label">{scenario.label}</span>
            <span className="scenario-desc">{scenario.description}</span>
            <span className="scenario-action">{mode === 'chat' ? `咨询${scenario.label}` : `生成${scenario.label}卡片`}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement DashboardPage**

Create `src/components/DashboardPage.tsx`:

```tsx
import type { AssessmentResult, SleepProfile, SleepScenario } from '../domain/types';
import { ScenarioLauncher } from './ScenarioLauncher';

interface DashboardPageProps {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  onStartAssessment: () => void;
  onOpenKnowledge: (scenario?: SleepScenario) => void;
  onOpenChat: (scenario?: SleepScenario) => void;
  onReset: () => void;
}

export function DashboardPage({ profile, assessmentResult, onStartAssessment, onOpenKnowledge, onOpenChat, onReset }: DashboardPageProps) {
  return (
    <main className="page dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">睡眠健康 AI 顾问</p>
          <h1>睡眠健康首页</h1>
          <p>{profile.ageRange} · {profile.bedtime}-{profile.wakeTime} · {profile.stressLevel}压力</p>
        </div>
        <button type="button" className="reset-btn" onClick={onReset}>重置档案</button>
      </header>

      {assessmentResult ? (
        <section className="summary-band">
          <h2>最近自测</h2>
          <p>ISI {assessmentResult.isi.score} 分 · {assessmentResult.isi.summary}</p>
          <p>简化睡眠质量筛查 {assessmentResult.psqiLite.score} 分 · {assessmentResult.psqiLite.summary}</p>
        </section>
      ) : (
        <section className="summary-band">
          <h2>还没有自测结果</h2>
          <p>完成标准自测后，AI 咨询会结合你的测评结果给出更贴近的建议。</p>
        </section>
      )}

      <ScenarioLauncher mode="chat" onSelect={onOpenChat} />

      <section className="dashboard-actions" aria-label="主要功能">
        <button className="primary-button" type="button" onClick={onStartAssessment}>开始标准自测</button>
        <button className="secondary-button" type="button" onClick={() => onOpenKnowledge()}>生成知识卡片</button>
        <button className="secondary-button" type="button" onClick={() => onOpenChat()}>继续咨询</button>
      </section>
      <p className="fine-print">记录仅存储在本浏览器中，建议不作为医疗诊断</p>
    </main>
  );
}
```

- [ ] **Step 5: Update App routing**

Modify `src/App.tsx`:

```tsx
import { useState } from 'react';
import './styles.css';
import { ChatPage } from './components/ChatPage';
import { DashboardPage } from './components/DashboardPage';
import { EntryPage } from './components/EntryPage';
import { ProfileWizard } from './components/ProfileWizard';
import type { SleepProfile } from './domain/types';
import { clearAllLocalData, getAssessmentResult, getSleepProfile, saveSleepProfile } from './storage/localStore';

type View = 'entry' | 'profile' | 'dashboard' | 'assessment' | 'knowledge' | 'chat';

export default function App() {
  const [profile, setProfile] = useState<SleepProfile | null>(() => getSleepProfile());
  const [view, setView] = useState<View>(() => (getSleepProfile() ? 'dashboard' : 'entry'));
  const [assessmentResult, setAssessmentResult] = useState(() => getAssessmentResult());

  function completeProfile(nextProfile: SleepProfile) {
    saveSleepProfile(nextProfile);
    setProfile(nextProfile);
    setView('dashboard');
  }

  function resetProfile() {
    clearAllLocalData();
    setProfile(null);
    setAssessmentResult(null);
    setView('profile');
  }

  function openChat() {
    setView('chat');
  }

  function openKnowledge() {
    setView('knowledge');
  }

  if (view === 'entry') return <EntryPage onStart={() => setView('profile')} />;
  if (view === 'profile' || !profile) return <ProfileWizard onComplete={completeProfile} />;

  if (view === 'dashboard') {
    return (
      <DashboardPage
        profile={profile}
        assessmentResult={assessmentResult}
        onStartAssessment={() => setView('assessment')}
        onOpenKnowledge={openKnowledge}
        onOpenChat={openChat}
        onReset={resetProfile}
      />
    );
  }

  return <ChatPage profile={profile} onReset={resetProfile} />;
}
```

This temporarily routes unimplemented `assessment` and `knowledge` views to chat until later tasks replace those branches. Task 8 expands `ChatPage` to accept scene prompts, assessment context, and a return action.

- [ ] **Step 6: Run tests**

Run:

```bash
npm test -- src/components/DashboardPage.test.tsx src/App.test.tsx
```

Expected: PASS after adapting existing App test labels to current Chinese UI. If current `EntryPage` heading has a line break, query with regex `/几分钟内.*个性化睡眠指导/`.

- [ ] **Step 7: Commit Task 6**

Run:

```bash
git add src/components/ScenarioLauncher.tsx src/components/DashboardPage.tsx src/components/DashboardPage.test.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: add chinese sleep dashboard"
```

Expected: commit succeeds with only Task 6 files staged.

---

### Task 7: Assessment Page And Report

**Files:**
- Create: `src/components/AssessmentPage.tsx`
- Create: `src/components/AssessmentPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing assessment page tests**

Create `src/components/AssessmentPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AssessmentPage } from './AssessmentPage';
import type { SleepProfile } from '../domain/types';

const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '较高',
  habits: [],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

describe('AssessmentPage', () => {
  it('requires all answers before showing report', async () => {
    const user = userEvent.setup();
    render(<AssessmentPage profile={profile} onComplete={vi.fn()} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '生成自测报告' }));

    expect(screen.getByText('请完成所有题目后再生成报告')).toBeVisible();
  });

  it('renders Chinese report after all questions are answered', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<AssessmentPage profile={profile} onComplete={onComplete} onBack={vi.fn()} />);

    for (const radio of screen.getAllByRole('radio', { name: '轻微' })) {
      await user.click(radio);
    }
    for (const radio of screen.getAllByRole('radio', { name: '还可以' })) {
      await user.click(radio);
    }
    await user.click(screen.getByRole('radio', { name: '16-30 分钟' }));
    await user.click(screen.getByRole('radio', { name: '6-7 小时' }));
    await user.click(screen.getByRole('radio', { name: '每周 1 次左右' }));
    await user.click(screen.getByRole('radio', { name: '偶尔' }));
    await user.click(screen.getByRole('button', { name: '生成自测报告' }));

    expect(screen.getByRole('heading', { name: '睡眠自测报告' })).toBeVisible();
    expect(screen.getByText(/ISI/)).toBeVisible();
    expect(screen.getByText(/简化睡眠质量筛查/)).toBeVisible();
    expect(screen.getByText(/本内容仅提供健康管理参考/)).toBeVisible();
    expect(onComplete).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/components/AssessmentPage.test.tsx
```

Expected: FAIL because `AssessmentPage` does not exist.

- [ ] **Step 3: Implement AssessmentPage**

Create `src/components/AssessmentPage.tsx`:

```tsx
import { useState } from 'react';
import { buildAssessmentResult, isiQuestions, psqiLiteQuestions } from '../domain/assessment';
import type { AssessmentQuestion } from '../domain/assessment';
import type { AssessmentResult, SleepProfile } from '../domain/types';
import { saveAssessmentResult } from '../storage/localStore';

interface AssessmentPageProps {
  profile: SleepProfile;
  onComplete: (result: AssessmentResult) => void;
  onBack: () => void;
}

function QuestionGroup({ title, questions, answers, onAnswer }: {
  title: string;
  questions: AssessmentQuestion[];
  answers: number[];
  onAnswer: (index: number, value: number) => void;
}) {
  return (
    <section className="assessment-section">
      <h2>{title}</h2>
      {questions.map((question, index) => (
        <fieldset className="assessment-question" key={question.id}>
          <legend>{question.title}</legend>
          <div className="rating-row">
            {question.options.map((option) => (
              <label key={`${question.id}-${option.value}`} className="rating-option">
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[index] === option.value}
                  onChange={() => onAnswer(index, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </section>
  );
}

function AssessmentReport({ result, onBack }: { result: AssessmentResult; onBack: () => void }) {
  return (
    <main className="page assessment-page">
      <header className="chat-header">
        <div>
          <p className="eyebrow">标准自测</p>
          <h1>睡眠自测报告</h1>
        </div>
        <button type="button" className="reset-btn" onClick={onBack}>返回首页</button>
      </header>
      <section className="report-grid">
        <article className="report-card">
          <h2>ISI 失眠严重度</h2>
          <p className="score-text">{result.isi.score} / 28 分</p>
          <p>{result.isi.summary}</p>
        </article>
        <article className="report-card">
          <h2>简化睡眠质量筛查</h2>
          <p className="score-text">{result.psqiLite.score} / 24 分</p>
          <p>{result.psqiLite.summary}</p>
        </article>
      </section>
      {result.riskFlags.length > 0 && (
        <section className="safety-box">
          <h2>需要关注的信号</h2>
          <ul>{result.riskFlags.map((flag) => <li key={flag}>{flag}</li>)}</ul>
        </section>
      )}
      <section className="summary-band">
        <h2>下一步建议</h2>
        <p>你可以带着这份自测结果继续咨询 AI 顾问。若问题持续、明显加重，或伴随安全信号，请寻求专业医生或睡眠门诊评估。</p>
      </section>
      <p className="fine-print">本内容仅提供健康管理参考，不作为医疗诊断。</p>
    </main>
  );
}

export function AssessmentPage({ profile, onComplete, onBack }: AssessmentPageProps) {
  const [isiAnswers, setIsiAnswers] = useState<number[]>([]);
  const [psqiAnswers, setPsqiAnswers] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AssessmentResult | null>(null);

  function setAnswer(kind: 'isi' | 'psqi', index: number, value: number) {
    const setter = kind === 'isi' ? setIsiAnswers : setPsqiAnswers;
    setter((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  function submit() {
    if (isiAnswers.filter((value) => value !== undefined).length !== isiQuestions.length ||
        psqiAnswers.filter((value) => value !== undefined).length !== psqiLiteQuestions.length) {
      setError('请完成所有题目后再生成报告');
      return;
    }
    const next = buildAssessmentResult({ isiAnswers, psqiLiteAnswers: psqiAnswers, profile });
    saveAssessmentResult(next);
    setResult(next);
    setError('');
    onComplete(next);
  }

  if (result) return <AssessmentReport result={result} onBack={onBack} />;

  return (
    <main className="page assessment-page">
      <header className="chat-header">
        <div>
          <p className="eyebrow">标准自测</p>
          <h1>睡眠自测</h1>
          <p>完成 ISI 与简化睡眠质量筛查，生成中文报告。</p>
        </div>
        <button type="button" className="reset-btn" onClick={onBack}>返回首页</button>
      </header>
      <QuestionGroup title="ISI 失眠严重度" questions={isiQuestions} answers={isiAnswers} onAnswer={(index, value) => setAnswer('isi', index, value)} />
      <QuestionGroup title="简化睡眠质量筛查" questions={psqiLiteQuestions} answers={psqiAnswers} onAnswer={(index, value) => setAnswer('psqi', index, value)} />
      {error && <p className="error">{error}</p>}
      <button className="primary-button" type="button" onClick={submit}>生成自测报告</button>
      <p className="fine-print">自测结果仅存储在本浏览器中，不作为医疗诊断。</p>
    </main>
  );
}
```

- [ ] **Step 4: Wire assessment route**

Modify `src/App.tsx` branch before the chat return:

```tsx
if (view === 'assessment') {
  return (
    <AssessmentPage
      profile={profile}
      onComplete={(result) => setAssessmentResult(result)}
      onBack={() => setView('dashboard')}
    />
  );
}
```

Add import:

```ts
import { AssessmentPage } from './components/AssessmentPage';
```

- [ ] **Step 5: Add focused styles**

Append to `src/styles.css`:

```css
.dashboard-page,
.assessment-page {
  gap: 18px;
}

.dashboard-header,
.summary-band,
.assessment-section,
.report-card,
.safety-box {
  width: min(100%, 760px);
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.88);
  border-radius: 8px;
  padding: 18px;
}

.scenario-grid,
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.scenario-card,
.secondary-button {
  border: 1px solid rgba(148, 163, 184, 0.32);
  background: #fff;
  color: #172033;
  border-radius: 8px;
  padding: 14px;
  text-align: left;
}

.scenario-label,
.scenario-action,
.score-text {
  display: block;
  font-weight: 700;
}

.scenario-desc {
  display: block;
  margin: 6px 0;
  color: #526070;
}

.dashboard-actions {
  width: min(100%, 760px);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.assessment-question {
  border: 0;
  padding: 12px 0;
}

.rating-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.rating-option {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  padding: 10px;
  background: #fff;
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm test -- src/components/AssessmentPage.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Task 7**

Run:

```bash
git add src/components/AssessmentPage.tsx src/components/AssessmentPage.test.tsx src/App.tsx src/styles.css
git commit -m "feat: add chinese sleep assessment"
```

Expected: commit succeeds with only Task 7 files staged.

---

### Task 8: Knowledge Page And Final Integration

**Files:**
- Create: `src/components/KnowledgePage.tsx`
- Create: `src/components/KnowledgePage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/ChatPage.tsx`
- Modify: `src/components/ChatPage.test.tsx`
- Modify: `src/styles.css`
- Modify: `e2e/mvp.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Write failing KnowledgePage tests**

Create `src/components/KnowledgePage.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KnowledgePage } from './KnowledgePage';
import type { KnowledgeResponse, SleepProfile } from '../domain/types';
import * as client from '../api/knowledgeClient';

const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '较高',
  habits: [],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

const response: KnowledgeResponse = {
  scenario: 'hard_to_fall_asleep',
  generatedAt: '2026-05-08T08:00:00.000Z',
  disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
  cards: [
    {
      title: '为什么越想睡越睡不着',
      summary: '压力和过度关注睡眠可能提高警觉。',
      keyPoints: ['睡前警觉升高'],
      misconceptions: ['躺得越久越容易睡着'],
      actions: [{ title: '离床放松', detail: '睡不着时离开床。' }],
      safetyNote: null,
      followUpQuestions: ['你睡前会看手机吗？'],
    },
  ],
};

beforeEach(() => {
  window.localStorage.clear();
});

describe('KnowledgePage', () => {
  it('generates and renders Chinese knowledge cards', async () => {
    vi.spyOn(client, 'generateKnowledgeCards').mockResolvedValueOnce(response);
    const user = userEvent.setup();
    render(<KnowledgePage profile={profile} assessmentResult={null} initialScenario={undefined} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /生成入睡困难卡片/ }));

    await waitFor(() => expect(screen.getByText('为什么越想睡越睡不着')).toBeVisible());
    expect(screen.getByText('常见误区')).toBeVisible();
    expect(screen.getByText(/本内容仅提供健康管理参考/)).toBeVisible();
  });

  it('uses cached cards and supports regeneration', async () => {
    window.localStorage.setItem('knowledgeCache', JSON.stringify({ hard_to_fall_asleep: response }));
    vi.spyOn(client, 'generateKnowledgeCards').mockResolvedValueOnce(response);
    const user = userEvent.setup();
    render(<KnowledgePage profile={profile} assessmentResult={null} initialScenario="hard_to_fall_asleep" onBack={vi.fn()} />);

    expect(screen.getByText('上次生成')).toBeVisible();
    expect(screen.getByText('为什么越想睡越睡不着')).toBeVisible();

    await user.click(screen.getByRole('button', { name: '重新生成' }));

    await waitFor(() => expect(client.generateKnowledgeCards).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run KnowledgePage tests to verify failure**

Run:

```bash
npm test -- src/components/KnowledgePage.test.tsx
```

Expected: FAIL because `KnowledgePage` does not exist.

- [ ] **Step 3: Implement KnowledgePage**

Create `src/components/KnowledgePage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { generateKnowledgeCards } from '../api/knowledgeClient';
import { getScenarioDefinition } from '../domain/scenarios';
import type { AssessmentResult, KnowledgeResponse, SleepProfile, SleepScenario } from '../domain/types';
import { getKnowledgeCache, saveKnowledgeCache } from '../storage/localStore';
import { ScenarioLauncher } from './ScenarioLauncher';

interface KnowledgePageProps {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  initialScenario?: SleepScenario;
  onBack: () => void;
}

export function KnowledgePage({ profile, assessmentResult, initialScenario, onBack }: KnowledgePageProps) {
  const [selectedScenario, setSelectedScenario] = useState<SleepScenario | undefined>(initialScenario);
  const [response, setResponse] = useState<KnowledgeResponse | null>(() => {
    if (!initialScenario) return null;
    return getKnowledgeCache()[initialScenario] || null;
  });
  const [fromCache, setFromCache] = useState(Boolean(response));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function load(scenario: SleepScenario, force = false) {
    setSelectedScenario(scenario);
    const cache = getKnowledgeCache();
    if (!force && cache[scenario]) {
      setResponse(cache[scenario] || null);
      setFromCache(true);
      setError('');
      return;
    }
    setPending(true);
    setError('');
    try {
      const next = await generateKnowledgeCards({ profile, scenario, assessmentResult });
      saveKnowledgeCache({ ...cache, [scenario]: next });
      setResponse(next);
      setFromCache(false);
    } catch {
      setError('知识卡片生成失败，请稍后重试');
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (initialScenario && !response) {
      void load(initialScenario);
    }
  }, []);

  return (
    <main className="page knowledge-page">
      <header className="chat-header">
        <div>
          <p className="eyebrow">AI 知识卡片</p>
          <h1>睡眠知识卡片</h1>
          <p>选择一个场景，生成适合当前档案的中文知识卡片。</p>
        </div>
        <button type="button" className="reset-btn" onClick={onBack}>返回首页</button>
      </header>

      {!selectedScenario && <ScenarioLauncher mode="knowledge" onSelect={(scenario) => void load(scenario)} />}

      {selectedScenario && (
        <section className="summary-band">
          <h2>{getScenarioDefinition(selectedScenario).label}</h2>
          {fromCache && <p>上次生成</p>}
          {pending && <p>正在生成知识卡片...</p>}
          {error && <p className="error">{error}</p>}
          <button className="secondary-button" type="button" onClick={() => void load(selectedScenario, true)} disabled={pending}>重新生成</button>
        </section>
      )}

      {response && (
        <section className="knowledge-list">
          {response.cards.map((card) => (
            <article className="knowledge-card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.summary}</p>
              <h3>关键要点</h3>
              <ul>{card.keyPoints.map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>常见误区</h3>
              <ul>{card.misconceptions.map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>可执行建议</h3>
              <ul>{card.actions.map((item) => <li key={item.title}><strong>{item.title}</strong>：{item.detail}</li>)}</ul>
              {card.safetyNote && <p className="safety-inline">{card.safetyNote}</p>}
              <h3>可以继续问</h3>
              <ul>{card.followUpQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
          <p className="fine-print">{response.disclaimer}</p>
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Wire KnowledgePage and enhance ChatPage**

Modify `src/App.tsx`:

```tsx
import { KnowledgePage } from './components/KnowledgePage';
```

Add imports and state needed for scene-aware chat and knowledge routing:

```ts
import { buildScenePrompt } from './domain/scenarios';
import type { SleepScenario } from './domain/types';
```

Inside `App`, after `assessmentResult` state:

```ts
const [chatDraft, setChatDraft] = useState('');
const [selectedScenario, setSelectedScenario] = useState<SleepScenario | undefined>();
```

Replace the temporary `openChat` and `openKnowledge` functions:

```ts
function openChat(scenario?: SleepScenario) {
  setSelectedScenario(scenario);
  setChatDraft(scenario ? buildScenePrompt(scenario) : '');
  setView('chat');
}

function openKnowledge(scenario?: SleepScenario) {
  setSelectedScenario(scenario);
  setView('knowledge');
}
```

Update `resetProfile()` to clear the new route state:

```ts
setChatDraft('');
setSelectedScenario(undefined);
```

Add branch before assessment/chat:

```tsx
if (view === 'knowledge') {
  return (
    <KnowledgePage
      profile={profile}
      assessmentResult={assessmentResult}
      initialScenario={selectedScenario}
      onBack={() => setView('dashboard')}
    />
  );
}
```

Modify `src/components/ChatPage.tsx` props:

```ts
import type { AssessmentResult, ChatMessage, FeedbackEvent, SleepProfile } from '../domain/types';

interface ChatPageProps {
  profile: SleepProfile;
  assessmentResult?: AssessmentResult | null;
  initialInput?: string;
  onBack: () => void;
  onReset: () => void;
}
```

Initialize input:

```ts
export function ChatPage({ profile, assessmentResult = null, initialInput = '', onBack, onReset }: ChatPageProps) {
  const [input, setInput] = useState(initialInput);
```

Pass context to client:

```ts
const response = await sendChatMessage({ profile, message: userMessage.content, history: messages, assessmentResult });
```

Render return action and assessment summary in header:

```tsx
<div className="chat-actions">
  <button type="button" className="reset-btn" onClick={onBack}>返回首页</button>
  <button type="button" className="reset-btn" onClick={reset}>重置档案</button>
</div>
{assessmentResult && (
  <section className="summary-band">
    <h2>最近自测</h2>
    <p>ISI {assessmentResult.isi.score} 分 · {assessmentResult.isi.summary}</p>
  </section>
)}
```

- [ ] **Step 5: Add KnowledgePage styles**

Append to `src/styles.css`:

```css
.knowledge-page {
  gap: 18px;
}

.knowledge-list {
  width: min(100%, 760px);
  display: grid;
  gap: 14px;
}

.knowledge-card {
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 18px;
}

.knowledge-card h3 {
  margin-top: 14px;
  font-size: 15px;
}

.safety-inline {
  border-left: 3px solid #d97706;
  background: #fff7ed;
  padding: 10px 12px;
}

.chat-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
```

- [ ] **Step 6: Run component tests**

Run:

```bash
npm test -- src/components/KnowledgePage.test.tsx src/components/ChatPage.test.tsx src/App.test.tsx
```

Expected: PASS after updating existing ChatPage tests to pass `onBack={vi.fn()}` and Chinese labels.

- [ ] **Step 7: Update E2E**

Modify `e2e/mvp.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('user can create profile, complete assessment, generate knowledge cards, and reach chat', async ({ page }) => {
  await page.route('/api/knowledge', async (route) => {
    await route.fulfill({
      json: {
        scenario: 'hard_to_fall_asleep',
        generatedAt: '2026-05-08T08:00:00.000Z',
        disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
        cards: [
          {
            title: '为什么越想睡越睡不着',
            summary: '压力和睡前手机可能提高警觉。',
            keyPoints: ['睡前警觉升高'],
            misconceptions: ['躺得越久越容易睡着'],
            actions: [{ title: '离床放松', detail: '超过 20 分钟仍睡不着时离开床。' }],
            safetyNote: null,
            followUpQuestions: ['你睡前会看手机吗？'],
          },
        ],
      },
    });
  });

  await page.route('/api/chat', async (route) => {
    await route.fulfill({
      json: {
        riskLevel: 'normal',
        summary: '你的作息和压力可能影响入睡。',
        possibleFactors: ['睡前手机', '压力较高'],
        suggestions: [{ title: '设置放松时间', detail: '今晚提前 30 分钟停止刷手机。' }],
        nextQuestions: ['下午是否摄入咖啡因？'],
        seekCareNotice: null,
        disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
      },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '创建睡眠档案' }).click();
  await page.getByLabel('年龄段').selectOption('25-34岁');
  await page.getByLabel('通常就寝时间').fill('01:00');
  await page.getByLabel('通常起床时间').fill('08:00');
  await page.getByLabel('主要睡眠问题').selectOption('hard_to_fall_asleep');
  await page.getByLabel('问题持续时间').selectOption('1-3个月');
  await page.getByLabel('压力水平').selectOption('较高');
  await page.getByLabel('白天影响').fill('白天疲惫');
  await page.getByRole('button', { name: '开始咨询' }).click();

  await expect(page.getByRole('heading', { name: '睡眠健康首页' })).toBeVisible();

  await page.getByRole('button', { name: '开始标准自测' }).click();
  await page.getByRole('radio', { name: '轻微' }).first().check();
  for (const group of await page.locator('fieldset').all()) {
    const checked = await group.locator('input:checked').count();
    if (checked === 0) await group.locator('input[type="radio"]').first().check();
  }
  await page.getByRole('button', { name: '生成自测报告' }).click();
  await expect(page.getByRole('heading', { name: '睡眠自测报告' })).toBeVisible();
  await page.getByRole('button', { name: '返回首页' }).click();

  await page.getByRole('button', { name: '生成知识卡片' }).click();
  await page.getByRole('button', { name: /生成入睡困难卡片/ }).click();
  await expect(page.getByText('为什么越想睡越睡不着')).toBeVisible();
  await page.getByRole('button', { name: '返回首页' }).click();

  await page.getByRole('button', { name: /咨询入睡困难/ }).click();
  await page.getByRole('button', { name: '发送' }).click();
  await expect(page.getByText('你的作息和压力可能影响入睡')).toBeVisible();
});
```

- [ ] **Step 8: Update README**

Append to `README.md` feature list:

```md
- Chinese dashboard with scene-based sleep navigation.
- ISI self-assessment and simplified sleep quality screening.
- AI-generated Chinese knowledge cards by sleep scene.
- Local assessment result and knowledge card cache.
```

Append to privacy boundary:

```md
Assessment results and generated knowledge card cache are also stored only in the current browser. They are not clinical diagnoses and are not stored on the server by this MVP.
```

- [ ] **Step 9: Run full verification**

Run:

```bash
npm test
npm run build
npm run e2e
```

Expected:

- `npm test`: all Vitest suites pass.
- `npm run build`: TypeScript and Vite build complete successfully.
- `npm run e2e`: Playwright tests pass.

- [ ] **Step 10: Commit Task 8**

Run:

```bash
git add src/components/KnowledgePage.tsx src/components/KnowledgePage.test.tsx src/App.tsx src/components/ChatPage.tsx src/components/ChatPage.test.tsx src/styles.css e2e/mvp.spec.ts README.md
git commit -m "feat: add ai knowledge cards"
```

Expected: commit succeeds with only Task 8 files staged.

---

## Final Verification

- [ ] **Step 1: Check worktree**

Run:

```bash
git status --short
```

Expected: no untracked or modified files from this implementation remain, except pre-existing unrelated user changes that were intentionally left alone.

- [ ] **Step 2: Run all verification commands once more**

Run:

```bash
npm test
npm run build
npm run e2e
```

Expected: all commands pass.

- [ ] **Step 3: Manual Chinese UI scan**

Run the app:

```bash
npm run dev
```

Open the local URL printed by Vite. Walk through:

- Entry page.
- Profile wizard.
- Dashboard.
- Assessment form.
- Assessment report.
- Knowledge page.
- Chat page.

Expected: all user-facing frontend text is Chinese, including loading, error, retry, report, card field labels, and disclaimers.
