# 14-Day Sleep Program Design

## Context

The current app is a local-first mobile H5 sleep wellness product. It already includes:

- Profile onboarding with extended sleep, lifestyle, medication, condition, and safety fields.
- ISI and PSQI-Lite assessment.
- AI consultation by scenario.
- AI-supported sleep knowledge cards.
- Sleep diary, trend summaries, reminders, relaxation tools, plan recommendations, and local persistence.
- Deterministic personalization with severity, care advice, behavior targets, relaxation targets, nutrition targets, exercise targets, TCM-style wellness direction, and a seven-day plan.

The next phase should not add more disconnected pages. It should turn the existing modules into a daily-use loop that improves retention and raises perceived professional credibility.

## Product Direction

Build a 14-day sleep improvement program centered on a daily task loop.

The product promise for this phase is:

> Every day, the user sees one clear sleep improvement action, records a short result, and receives conservative feedback based on their profile, safety status, task history, and recent sleep signals.

This phase prioritizes:

- Daily retention through one main task per day.
- Professional credibility through CBT-I-informed structure, sleep hygiene, clear safety boundaries, and evidence labels.
- Maintainability through deterministic program rules, with AI used for explanation and personalization rather than core decision-making.

This phase does not include accounts, cloud sync, WeChat Mini Program conversion, paid memberships, clinician accounts, push notifications, audio production, or clinical diagnosis.

## Core Loop

The daily flow is:

1. User opens `今日`.
2. App shows the current 14-day program progress and today's main task.
3. User completes, skips, or asks AI about the task.
4. User records a lightweight result: task difficulty, sleep quality, sleep latency, awakenings, daytime energy, and optional note.
5. App saves the task log locally.
6. App updates streak, completion rate, current day, trend summaries, and conservative insight copy.
7. Day 7 and day 14 show review cards with next-step guidance.

The app should keep full diary entry available, but the daily task loop should not require filling the full diary. The lightweight result record is the minimum feedback needed for retention and trend explanation.

## Program Structure

The default template is `cbti_foundation_14_day`.

Days 1-7 focus on basic rhythm and low-friction habits:

1. Sleep environment reset.
2. Fixed wake time.
3. Phone boundary before bed.
4. Caffeine and late meal boundary.
5. Short relaxation practice.
6. Morning light and daytime movement.
7. Week-one review.

Days 8-14 focus on common insomnia-maintaining factors:

8. Stimulus control introduction.
9. Sleep efficiency observation.
10. Worry writing before bed.
11. Night waking response.
12. Progressive relaxation or mindfulness.
13. Diet, exercise, and evening routine adjustment.
14. Program review and next-step plan.

Each task includes:

- Day number.
- Title.
- Category.
- Evidence label.
- Estimated minutes.
- Rationale.
- Primary action.
- Fallback action.
- Safety note.

Evidence labels are user-facing and limited to:

- `CBT-I`
- `睡眠卫生`
- `放松训练`
- `饮食作息`
- `养生参考`

TCM and wellness content can appear only as auxiliary regulation guidance. It must use non-diagnostic language such as “养生参考”, “调养方向”, and “体质倾向”.

## Safety Gate

Before showing ordinary behavior tasks, the app evaluates the existing profile, assessment result, and diary summary using deterministic safety rules.

The program status becomes `needs_care` when any of these signals are present:

- Self-harm or severe emotional risk.
- Suspected sleep apnea.
- Chest pain or major disease signal.
- Pregnancy or postpartum severe sleep problem.
- Medication dependence or nightly sedative use.
- Severe ISI.
- Chronic insomnia with obvious daytime impairment.
- Very short sleep duration with meaningful daytime impairment.

When status is `needs_care`:

- `今日` shows professional evaluation guidance instead of ordinary program tasks.
- `方案` can still show education and preparation steps, such as recording symptoms and preparing questions for a clinician.
- `日记`, `趋势`, `知识`, `放松`, and AI chat remain available, but wording must prioritize safety.
- The app must not recommend medication changes, supplement dosing, or ordinary lifestyle changes as a substitute for care.

## Information Architecture

The current bottom tabs remain: `今日 / 日记 / 趋势 / 方案 / 我的`.

### 今日

`今日` becomes the primary daily loop surface.

It shows:

- Current program progress: day N of 14.
- Today's task: title, evidence label, estimated time, rationale, action, fallback action, and safety note.
- Actions: complete, skip, adjust difficulty, ask AI.
- Lightweight result inputs after completion or skip.
- Streak and this-week summary.

If safety rules produce `needs_care`, the task area is replaced with professional evaluation guidance and conservative next steps.

### 方案

`方案` becomes the 14-day program timeline.

It shows:

- Current program status.
- All 14 tasks with status: locked, today, completed, or skipped.
- Evidence labels and short rationale for each task.
- Week-one and day-fourteen review cards.
- Existing plan library in a secondary section.

### 日记

`日记` keeps the existing bedtime and wake check-ins.

It also exposes the lightweight daily result path used by the program:

- Task completed or skipped.
- Difficulty.
- Sleep quality.
- Sleep latency.
- Awakenings.
- Daytime energy.
- Optional note.

The lightweight result can update or coexist with full diary entries. Full diary remains useful for richer trend analysis, but it is not required for daily program progress.

### 趋势

`趋势` expands from sleep metrics into improvement feedback.

It shows:

- Recent completion rate.
- Current streak.
- Sleep quality trend.
- Sleep latency trend.
- Awakenings trend.
- Conservative insight copy.

Trend copy must avoid over-attribution. For example, it can say “入睡耗时近 7 天有所下降，但记录较少，暂不判断是否由某个任务导致。”

### AI 咨询

AI chat can be opened from a task.

Supported task-aware prompts include:

- Why was this task recommended?
- What if I failed today?
- Can this task be made easier?
- What should I do after several days without improvement?
- How should I adapt this task to my schedule?

AI cannot override deterministic safety rules.

## Data Model

Add local-first records with sync-ready fields.

```ts
type ProgramStatus = 'active' | 'completed' | 'paused' | 'needs_care';
type TaskStatus = 'locked' | 'today' | 'completed' | 'skipped';

interface SleepProgram {
  id: string;
  startedAt: string;
  currentDay: number;
  status: ProgramStatus;
  templateId: 'cbti_foundation_14_day';
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface ProgramTask {
  day: number;
  title: string;
  category: 'cbti' | 'sleep_hygiene' | 'relaxation' | 'schedule' | 'nutrition' | 'wellness';
  evidenceLabel: 'CBT-I' | '睡眠卫生' | '放松训练' | '饮食作息' | '养生参考';
  estimatedMinutes: number;
  rationale: string;
  action: string;
  fallbackAction: string;
  safetyNote: string | null;
}

interface DailyTaskLog {
  id: string;
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
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

Storage should follow the existing `localStore` pattern:

- Browser `localStorage` as the primary store.
- In-memory fallback when localStorage is unavailable.
- Reset clears program and task-log records with the rest of local data.

## Domain Modules

Add `src/domain/program.ts`.

Public responsibilities:

- Return the 14-day task template.
- Create an initial program object from profile, assessment, and diary summary inputs.
- Resolve an existing program with current safety status and task logs.
- Determine whether the program should be `active`, `completed`, `paused`, or `needs_care`.
- Resolve today's task and task status.
- Calculate streak, completion rate, recent trend summary, and review-card data.
- Recommend fallback actions when users repeatedly skip or mark tasks as hard.

The module may reuse:

- `buildPersonalizationProfile`.
- `AssessmentResult`.
- `DiarySummary`.
- Existing safety and profile signals.

It should not call the AI provider or directly read and write storage. `localStore` remains responsible for persistence, while `program.ts` stays focused on deterministic rules and derived state.

Program completion is explicit: after the day 14 task is completed or skipped and the review card data is available, status can become `completed`. A completed program remains readable in `方案` and `趋势`.

## Trusted Content System

Create an internal trusted content layer for program tasks and core knowledge cards.

Content categories:

- CBT-I basics: fixed wake time, stimulus control, worry writing, sleep efficiency observation.
- Sleep hygiene: phone boundary, bedroom environment, light exposure, nap boundary.
- Relaxation: 4-7-8 breathing, progressive muscle relaxation, mindfulness.
- Diet and schedule: caffeine boundary, late meal boundary, alcohol caution, exercise timing.
- Wellness reference: foot soak, gentle stretching, food direction, emotional regulation.

Each content item should include:

- Applicable signals.
- Caution or exclusion signals.
- Evidence label.
- User action.
- Fallback action.
- Safety note.
- Disclaimer level.

Knowledge pages should prefer this internal content for core cards. AI-generated knowledge remains optional and should be visually labeled as AI supplemental reference.

## AI Boundary

AI is responsible for:

- Explaining today's task in a personalized way.
- Helping the user simplify a task.
- Responding to failure or skipped days without shame language.
- Translating conservative trend summaries into natural language.
- Answering task-related follow-up questions.

AI is not responsible for:

- Deciding whether a high-risk user can enter ordinary behavior plans.
- Diagnosing a disease.
- Providing medication or supplement dosing.
- Recommending medication changes.
- Promising treatment effects.
- Presenting TCM body tendency as a diagnosis.
- Replacing professional evaluation for red flags.

Prompt context should include summaries, not full diary history:

- Current program day.
- Today's task.
- Recent completion count and skipped count.
- Recent sleep quality, latency, awakenings, and daytime energy summary.
- Current safety status.
- Allowed and prohibited recommendation boundaries.

## Error Handling

- If no program exists, create one from the current profile unless safety rules require `needs_care`.
- If optional profile fields are missing, use neutral defaults.
- If assessment or diary data is missing, keep the program usable and label trend confidence as limited.
- If task logs contain duplicate records for the same date and program day, use the most recently updated record.
- If localStorage fails, fall back to the existing memory store behavior.
- If AI task explanation fails, show deterministic task rationale and fallback action.

## Testing

Add focused tests for:

- Program creation for normal profiles.
- `needs_care` status for self-harm, suspected apnea, severe ISI, medication dependence, and chronic insomnia with daytime impairment.
- Today's task resolution.
- Completing and skipping a task.
- Refresh-safe local persistence.
- Streak and completion-rate calculation.
- Day 7 and day 14 review-card data.
- Fallback action recommendation after repeated hard or skipped logs.
- Trend copy when data is insufficient.
- Knowledge cards using trusted internal content before AI supplement.
- AI prompt including program context and safety boundaries without full diary history.
- Existing chat, plan, diary, trend, profile, and reset flows continuing to pass.

## Acceptance Criteria

- A user with a normal-risk profile sees day 1 of the 14-day program after onboarding.
- `今日` clearly answers “what should I do today?”.
- Completing or skipping a task updates local state and remains after refresh.
- `方案` shows the 14-day timeline and each task's evidence label.
- `趋势` shows completion metrics and conservative sleep feedback.
- High-risk users see professional evaluation guidance before ordinary improvement tasks.
- AI can explain and adapt today's task, but cannot override deterministic safety gates.
- Every task has an evidence label, fallback action, and safety note where relevant.
- Core knowledge and task recommendations are available without relying on AI generation.
- The product remains local-first and does not add account, cloud, payment, notification, or clinical diagnosis scope.

## Implementation Phases

### Phase 1: Program Loop Foundation

Build the 14-day task template, program state, task logs, `今日` task card, `方案` timeline, lightweight feedback, and `needs_care` safety gate.

### Phase 2: Feedback and Adjustment

Add streak, completion rate, trend integration, repeated-difficulty fallback actions, and day 7/day 14 review cards.

### Phase 3: Trusted Content and AI Context

Add the trusted content layer, make knowledge cards prefer internal content, and enrich AI prompt context with current program state and safety boundaries.
