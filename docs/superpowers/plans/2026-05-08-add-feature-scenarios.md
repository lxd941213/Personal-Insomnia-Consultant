# Add Feature Scenarios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four screenshot-inspired sleep feature cards as clickable scenarios that work in chat and knowledge flows.

**Architecture:** Extend the existing `SleepScenario` union and shared `sleepScenarios` definitions. Because `ScenarioLauncher`, chat, and knowledge pages already consume that model, no new UI subsystem or persistence model is needed.

**Tech Stack:** React, TypeScript, Vite, Vitest, existing domain scenario model.

---

## File Structure

- Modify `src/domain/types.ts`: add four new `SleepScenario` union members.
- Modify `src/domain/scenarios.ts`: append four scenario definitions with Chinese labels, descriptions, keywords, and prompts.
- Modify `src/domain/assessment.test.ts`: update scenario tests to assert nine scenarios, expected labels, expected IDs, and prompt context for new features.

Do not modify component files unless a test reveals a rendering bug. `ScenarioLauncher` already renders from `sleepScenarios`.

## Task 1: Cover New Scenario Catalog

**Files:**
- Modify: `src/domain/assessment.test.ts`
- Test: `src/domain/assessment.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace the current `sleepScenarios` tests in `src/domain/assessment.test.ts` with:

```ts
describe('sleepScenarios', () => {
  it('should have 9 scenarios', () => {
    expect(sleepScenarios).toHaveLength(9);
  });

  it('should have Chinese labels', () => {
    sleepScenarios.forEach((s) => {
      expect(s.label).toMatch(/[一-龥]/);
    });
  });

  it('uses the required Chinese labels from the plan', () => {
    expect(sleepScenarios.map((s) => s.label)).toEqual([
      '入睡困难',
      '睡眠质量差',
      '压力焦虑',
      '熬夜习惯',
      '养生调理',
      '睡前仪式助手',
      '白噪音 / 冥想音频',
      '在线问诊导流',
      '饮食 × 睡眠关联',
    ]);
  });

  it('should contain expected scenario IDs', () => {
    const ids = sleepScenarios.map((s) => s.id);
    expect(ids).toContain('hard_to_fall_asleep');
    expect(ids).toContain('late_night_habit');
    expect(ids).toContain('stress_anxiety');
    expect(ids).toContain('poor_sleep_quality');
    expect(ids).toContain('wellness_regulation');
    expect(ids).toContain('bedtime_ritual');
    expect(ids).toContain('sound_meditation');
    expect(ids).toContain('medical_triage');
    expect(ids).toContain('diet_sleep_link');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/domain/assessment.test.ts --run
```

Expected: FAIL because `sleepScenarios` still has 5 entries and the new labels and IDs are missing.

- [ ] **Step 3: Commit the failing test**

Do not commit a failing test alone. Continue to Task 2.

## Task 2: Add Scenario Types and Definitions

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/scenarios.ts`
- Test: `src/domain/assessment.test.ts`

- [ ] **Step 1: Update `SleepScenario`**

In `src/domain/types.ts`, change the union to:

```ts
export type SleepScenario =
  | 'hard_to_fall_asleep'
  | 'late_night_habit'
  | 'stress_anxiety'
  | 'poor_sleep_quality'
  | 'wellness_regulation'
  | 'bedtime_ritual'
  | 'sound_meditation'
  | 'medical_triage'
  | 'diet_sleep_link';
```

- [ ] **Step 2: Add definitions to `sleepScenarios`**

In `src/domain/scenarios.ts`, append these objects after `wellness_regulation`:

```ts
  {
    id: 'bedtime_ritual',
    label: '睡前仪式助手',
    description: '根据用户情况生成专属「睡前 30 分钟计划」',
    keywords: ['睡前仪式', '睡前计划', '睡前放松', '睡前30分钟', '睡前 30 分钟'],
    chatPrompt:
      '你是一位睡眠健康专家。请根据用户的个人情况和睡眠困扰，生成专属睡前 30 分钟计划，包括：1) 逐分钟或分阶段安排；2) 放松、环境、屏幕使用和饮水建议；3) 可持续执行的微习惯提醒；4) 需要停止计划并寻求专业帮助的警示信号。',
  },
  {
    id: 'sound_meditation',
    label: '白噪音 / 冥想音频',
    description: '雨声、海浪、脑波音乐、合规内嵌或外链',
    keywords: ['白噪音', '冥想音频', '雨声', '海浪', '脑波音乐', '助眠音乐'],
    chatPrompt:
      '你是一位睡眠健康专家。请围绕白噪音和冥想音频提供合规、实用的助眠建议，包括：1) 雨声、海浪、自然声、轻冥想或脑波音乐的适用人群；2) 音量、时长和播放设备建议；3) 如何选择合规内嵌内容或外部音频资源；4) 哪些情况下音频可能干扰睡眠。',
  },
  {
    id: 'medical_triage',
    label: '在线问诊导流',
    description: '严重失眠用户引导至合规医疗平台（商业合作）',
    keywords: ['在线问诊', '睡眠门诊', '严重失眠', '就医', '医生', '医疗平台'],
    chatPrompt:
      '你是一位睡眠健康顾问。请对可能严重失眠的用户进行谨慎的在线问诊导流说明，包括：1) 需要尽快就医或咨询睡眠门诊的信号；2) 如何准备病史、睡眠日志和用药信息；3) 合规医疗平台或线下医疗机构的选择原则；4) 明确说明本内容不替代医疗诊断。',
  },
  {
    id: 'diet_sleep_link',
    label: '饮食 × 睡眠关联',
    description: '分析用户饮食习惯与睡眠的关系，提供饮食调整建议',
    keywords: ['饮食', '咖啡因', '酒精', '晚餐', '睡眠关联', '饮食调整'],
    chatPrompt:
      '你是一位睡眠健康专家。请分析饮食习惯与睡眠之间的常见关系，并给出可执行调整建议，包括：1) 咖啡因、酒精、晚餐时间、辛辣或高糖食物对睡眠的影响；2) 适合睡前的饮食边界；3) 一周内可尝试的饮食调整计划；4) 需要营养师或医生评估的情况。',
  },
```

- [ ] **Step 3: Run the scenario tests**

Run:

```bash
npm test -- src/domain/assessment.test.ts --run
```

Expected: PASS for the updated scenario count, labels, and IDs.

- [ ] **Step 4: Commit the scenario catalog**

Run:

```bash
git add src/domain/types.ts src/domain/scenarios.ts src/domain/assessment.test.ts
git commit -m "feat: add sleep feature scenarios"
```

Only stage these three files. Leave unrelated existing worktree changes untouched.

## Task 3: Cover New Prompt Context

**Files:**
- Modify: `src/domain/assessment.test.ts`
- Test: `src/domain/assessment.test.ts`

- [ ] **Step 1: Write prompt tests**

Add these tests inside the `describe('buildScenePrompt', () => { ... })` block:

```ts
  it('returns bedtime ritual context for the bedtime ritual feature', () => {
    const prompt = buildScenePrompt('bedtime_ritual');
    expect(prompt).toContain('睡前 30 分钟计划');
  });

  it('returns audio guidance context for the sound meditation feature', () => {
    const prompt = buildScenePrompt('sound_meditation');
    expect(prompt).toContain('白噪音');
    expect(prompt).toContain('冥想音频');
  });

  it('returns medical triage context for the online consultation feature', () => {
    const prompt = buildScenePrompt('medical_triage');
    expect(prompt).toContain('在线问诊导流');
    expect(prompt).toContain('不替代医疗诊断');
  });

  it('returns diet sleep context for the diet link feature', () => {
    const prompt = buildScenePrompt('diet_sleep_link');
    expect(prompt).toContain('饮食习惯与睡眠');
  });
```

- [ ] **Step 2: Run the tests to verify they pass**

Run:

```bash
npm test -- src/domain/assessment.test.ts --run
```

Expected: PASS because Task 2 added prompts containing this context.

- [ ] **Step 3: Commit the prompt coverage**

Run:

```bash
git add src/domain/assessment.test.ts
git commit -m "test: cover feature scenario prompts"
```

Only stage `src/domain/assessment.test.ts`.

## Task 4: Verify Shared UI Coverage

**Files:**
- Test: `src/components/DashboardPage.test.tsx`
- Test: `src/components/TodayPage.test.tsx`
- Test: `src/components/KnowledgePage.test.tsx`
- Test: `src/domain/assessment.test.ts`

- [ ] **Step 1: Run component and domain tests**

Run:

```bash
npm test -- src/domain/assessment.test.ts src/components/DashboardPage.test.tsx src/components/TodayPage.test.tsx src/components/KnowledgePage.test.tsx --run
```

Expected: PASS. The new cards should render automatically through `ScenarioLauncher`.

- [ ] **Step 2: Run the relevant e2e smoke if the test command passes**

Run:

```bash
npm run e2e -- e2e/mvp.spec.ts
```

Expected: PASS. If the e2e command requires a running dev server and fails for that reason, start the app according to the project scripts and rerun.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git diff --stat
git diff -- src/domain/types.ts src/domain/scenarios.ts src/domain/assessment.test.ts
```

Expected: only the planned scenario type, definitions, and tests are present in the diff. Existing unrelated working tree changes may still appear in `git status`, but they should not be part of this feature's commits.

- [ ] **Step 4: Final commit if verification caused any small test adjustment**

If Task 4 required a test-only adjustment, run:

```bash
git add src/domain/assessment.test.ts
git commit -m "test: verify feature scenario rendering"
```

If no files changed after Task 3, skip this commit.
