# Comprehensive Insomnia Consultant Optimization Design

## Context

The current app is already beyond the original H5 MVP. It includes local sleep profile setup, sleep assessment, sleep diary, trend summaries, relaxation tools, trusted knowledge cards, scenario-based AI chat, and a local 14-day sleep program.

The remaining product risk is not missing isolated features. The larger issue is that safety, execution, feedback, and tests are not yet one dependable loop:

- Chinese high-risk messages can bypass the current English-heavy `detectHighRiskSignal` patterns.
- The 14-day program has domain types, stats, and timeline display, but no clear user-facing complete or skip flow.
- Diary form state can become stale when the user switches dates.
- The current E2E suite fails because expectations no longer match the implemented UI.
- The app depends on remote font and icon resources that can degrade first-screen reliability.
- The core user path does not yet strongly connect "what should I do today" to "I did it" to "what changed".

The approved direction is a comprehensive layered optimization for China mainland users while preserving the current local-first H5 boundary.

## Goals

1. Make safety triage reliable for Chinese sleep and mental-health risk language.
2. Complete the local 14-day program execution loop with task feedback and progress stats.
3. Fix diary state reliability so saved data matches the selected date.
4. Strengthen the home, plan, trend, and chat path into a coherent daily workflow.
5. Update tests and E2E coverage so the current behavior is verified end to end.
6. Improve resilience when external fonts or icon CDN resources fail.
7. Update documentation to match the optimized behavior and product boundaries.

## Non-Goals

- No account system.
- No backend database.
- No cloud sync.
- No real system push notifications.
- No real medical platform integration or commercial referral flow.
- No medical diagnosis, prescription, medication dosage, supplement dosage, or treatment claim.
- No broad rewrite of the app shell or design system.

## Product Boundary

The app remains a local-first health-management and education tool. It can help users record sleep, understand patterns, follow conservative behavioral tasks, and discuss sleep-management ideas with AI.

It must not present itself as a clinician, diagnostic tool, prescription tool, emergency service, or replacement for professional evaluation. All safety and high-risk flows must make this boundary visible.

The safety resource language is China-mainland oriented. It should avoid US-specific resources such as 988. For self-harm or acute danger, the app should direct users to local emergency services, nearby emergency care or psychiatric emergency care, local psychological assistance or crisis intervention hotlines where available, and trusted people nearby. Because hotline availability differs by region, the app should not promise that a single number is universally available.

## Reference Boundary

Implementation should keep health claims conservative and aligned with these public references:

- ACP guidance identifies cognitive behavioral therapy for insomnia as initial treatment for chronic insomnia in adults: https://www.acponline.org/acp-newsroom/acp-recommends-cognitive-behavioral-therapy-as-initial-treatment-forchronic-insomnia
- AASM materials describe CBT-I as first-line treatment and note limitations of digital CBT-I programs: https://aasm.org/digital-cognitive-behavioral-therapy-for-insomnia-platforms-and-characteristics/
- FDA digital-health materials distinguish general wellness tools from regulated medical-device functions: https://www.fda.gov/medical-devices/digital-health-center-excellence/device-software-functions-including-mobile-medical-applications
- Beijing Psychological Crisis Research and Intervention Center describes psychological assistance and suicide-risk support services: https://www.crisis.org.cn/lists/5.html
- Public China-mainland 12356 psychological assistance hotline announcements show region-operated mental-health support services, but availability should still be treated as location-dependent: https://www.suzhou.gov.cn/szsrmzf/mszx/202503/0253e04bdf4e4d23a4750d0fa15a12ff.shtml
- China Medical Association sleep-apnea education describes snoring, breathing pauses, choking awakenings, daytime sleepiness, and cardiometabolic risk as reasons for attention: https://www.cma.org.cn/art/2023/6/20/art_4584_51430.html

## Architecture

Keep the existing layered structure:

- `src/domain/*`: deterministic sleep, safety, program, diary, trend, and normalization rules.
- `src/storage/localStore.ts`: browser-local persistence with memory fallback.
- `src/components/*`: UI state, forms, and view composition.
- `src/api/*`: Serverless-compatible API logic, provider calls, prompt construction, and server-side safety gate.

The key architectural change is to make safety triage a shared structured domain result instead of a boolean helper.

Suggested model:

```ts
type SafetyTriageLevel = 'normal' | 'needs_care' | 'urgent';

interface SafetyTriageResult {
  level: SafetyTriageLevel;
  reasons: string[];
  categories: Array<
    | 'self_harm'
    | 'sleep_apnea'
    | 'chest_pain_or_breathing'
    | 'medication_or_alcohol_dependence'
    | 'pregnancy_or_postpartum'
    | 'severe_insomnia_impairment'
    | 'major_medical_condition'
  >;
  shouldBlockAi: boolean;
  careNotice: string | null;
}
```

Consumers should not duplicate high-risk rules. Chat API, personalized program logic, assessment report, plan page, trend page, and prompt context should read the same triage result or equivalent domain function.

## Safety Triage

The safety module should analyze:

- Current chat message text.
- Profile safety signals.
- Profile medical conditions.
- Profile medication status.
- Profile daytime impact and optional context.
- Assessment result.
- Recent diary notes where available.

It should support Chinese and common mixed Chinese-English wording. Required categories include:

- Self-harm or suicidal language: "轻生", "不想活", "想死", "自杀", "伤害自己", "结束生命".
- Suspected sleep apnea or choking awakenings: "憋醒", "呼吸暂停", "睡觉喘不上气", "打鼾很严重", "鼾声很大还白天嗜睡".
- Chest pain or breathing difficulty: "胸痛", "胸口痛", "胸闷", "呼吸困难".
- Sedative, sleeping-pill, or alcohol dependence signals: "每天吃安眠药", "每晚靠药", "长期吃助眠药", "靠酒才能睡".
- Pregnancy or postpartum severe sleep issues: "孕期严重睡不着", "产后严重失眠".
- Severe insomnia with impaired daytime function: severe ISI, chronic duration, short sleep, and phrases such as "无法工作", "无法学习", "撑不住".
- Major medical condition signals.

`urgent` cases should block AI provider calls and return a deterministic fallback response. Treat these as urgent:

- Any self-harm or suicidal language.
- Chest pain, marked chest tightness, or breathing difficulty.
- Sleep choking, breathing pauses, or severe snoring when paired with daytime sleepiness, morning headache, or impaired function.
- Nightly dependence on sleeping pills, sedatives, or alcohol to sleep.
- Pregnancy or postpartum severe insomnia.
- Severe ISI or chronic insomnia paired with phrases indicating inability to work, study, care for self, or remain safe.

`needs_care` cases may still allow conservative guidance only when the immediate risk does not require blocking. Treat these as needs-care:

- Profile safety signals without acute wording.
- Suspected sleep apnea without acute distress wording.
- Chronic insomnia with meaningful daytime impairment.
- Ongoing medication use, chronic illness, pain, pregnancy, or postpartum status where ordinary behavioral suggestions need clinician-aware framing.

Ordinary behavioral plans must visibly yield to professional evaluation guidance for both `urgent` and `needs_care` states.

China-mainland crisis language should say:

- If there is immediate danger or possible self-harm, contact local emergency services immediately, go to the nearest emergency department or psychiatric emergency service, and ask a trusted person to stay nearby.
- If not in immediate danger but distressed, contact a local psychological assistance or crisis intervention hotline where available, or seek professional mental-health care.
- For suspected sleep apnea, chest pain, breathing difficulty, medication dependence, pregnancy or postpartum severe sleep issues, or major disease, seek an appropriate clinical department such as sleep clinic, respiratory medicine, cardiology, psychiatry or psychology, obstetrics, or emergency care depending on symptoms.

## 14-Day Program Loop

The 14-day program becomes an executable local loop:

```text
SleepProfile + AssessmentResult + DiarySummary + SafetyTriage
  -> SleepProgram
  -> ProgramTask[]
  -> DailyTaskLog[]
  -> ProgramStats / Trends / ChatContext
```

`PlansPage` is the main execution surface. The current task card should show:

- Day number and title.
- Evidence label.
- Estimated minutes.
- Rationale.
- Primary action.
- Fallback action.
- Safety note.
- Current completion status.

The page should provide two primary task actions:

- `完成今日任务`
- `跳过今日任务`

Both open a lightweight feedback form. The form records:

- Status: completed or skipped.
- Difficulty: easy, ok, hard, or null.
- Sleep quality when available.
- Sleep latency minutes when available.
- Awakenings when available.
- Daytime energy.
- Optional note.

Saving feedback writes to `dailyTaskLogs`. A repeated save for the same `programId + day` should update or supersede the latest log for that day without double-counting stats.

Required domain helpers:

- Create a task log from form input.
- Upsert a task log by `programId + day`.
- Resolve latest logs by task day.
- Compute completion rate, skipped count, current streak, and fallback-needed status.
- Generate a conservative review summary for week 1 and week 2.

High-risk or `needs_care` program states should not emphasize ordinary behavior tasks. They should show professional evaluation guidance and preparation steps.

## Home, Plan, Trend, Chat Flow

`TodayPage` should show a lightweight "今日助眠任务" entry when the program is active. It should show task title, status, and a button that navigates to the plan page. It should not host the full feedback form or full timeline.

`PlansPage` handles task execution, status updates, full timeline expansion, and care-first states.

`TrendsPage` reads both diary entries and task logs. It should:

- Avoid judging improvement when fewer than 3 wake records exist.
- Show conservative early feedback when 3-7 records exist.
- Show 7-day and 30-day summaries when available.
- Explain completion rate, skipped count, and streak.
- Suggest fallback actions when recent tasks are skipped or marked hard.
- Prioritize care guidance when safety triage escalates.

`ChatPage` should keep sending structured context to the API:

- Profile.
- Assessment result.
- Recent 7-day diary summary.
- Program current day and today task.
- Task stats and safety status.

The server-side API still runs safety triage before building a provider prompt. AI can explain tasks, suggest lighter alternatives, and help users reflect on blockers only when triage allows it.

## Diary Reliability

`DiaryPage` must reload form state when `activeDate` changes. The selected date is the source of truth for the current entry. Saving bedtime or wake data must only update that selected date.

Basic validation should prevent invalid trend inputs:

- Wake record requires sleep start, wake time, latency, awakenings, and sleep quality.
- Numeric values must stay in reasonable ranges.
- Missing or invalid wake data should not be used in trend summaries.

The UI should preserve the current quick-choice interaction, but tests should target the actual buttons and labels instead of old text input behavior.

## External Resource Resilience

The current app loads fonts and Lucide icons from external URLs. This should degrade gracefully:

- Use a robust local font stack if Google Fonts fail.
- Ensure icon placeholders or CSS fallback do not break button layout when Lucide fails.
- Prefer package-based icons in future work if dependency policy allows it, but this increment may use graceful fallback rather than a migration.

## Component Scope

Likely touched files:

- `src/domain/safety.ts`
- `src/domain/safety.test.ts`
- `src/domain/program.ts`
- `src/domain/program.test.ts`
- `src/domain/sleepDiary.ts`
- `src/domain/sleepDiary.test.ts`
- `src/domain/trends.ts`
- `src/domain/trends.test.ts`
- `src/domain/types.ts`
- `src/storage/localStore.ts` if a small persistence helper is needed
- `api/chatLogic.ts`
- `api/prompt.ts`
- `api/chat.test.ts`
- `api/prompt.test.ts`
- `src/components/TodayPage.tsx`
- `src/components/TodayPage.test.tsx`
- `src/components/PlansPage.tsx`
- `src/components/PlansPage.test.tsx`
- `src/components/DiaryPage.tsx`
- `src/components/DiaryPage.test.tsx`
- `src/components/TrendsPage.tsx`
- `src/components/TrendsPage.test.tsx`
- `src/components/ChatPage.tsx`
- `src/components/ChatPage.test.tsx`
- `src/styles.css`
- `e2e/app.spec.ts`
- `e2e/mvp.spec.ts`
- `README.md`
- `docs_cn/使用文档.md`

Implementation should preserve unrelated user changes in the dirty worktree.

## Error Handling

- Invalid chat payloads still return 400.
- High-risk chat payloads return 200 with deterministic safety fallback and no provider call.
- Provider errors still return a normalized fallback.
- Invalid task feedback should show a form error and avoid writing bad logs.
- Invalid diary wake data should show a form error and avoid corrupting trend summaries.
- `localStorage` failures keep using the existing memory fallback.
- Missing program or task data should recreate or resolve from deterministic templates rather than crashing.

## Accessibility

- Task actions and feedback controls use native buttons and form fields.
- Safety notices use visible, high-contrast treatment and appropriate alert semantics when urgent.
- Expand/collapse controls use `aria-expanded`.
- Touch targets remain suitable for mobile.
- Button labels must be descriptive without relying only on icons.

## Testing

### Domain Tests

Add or update tests for:

- Chinese safety triage phrases and mixed Chinese-English phrases.
- Safety categories, care notices, and AI blocking thresholds.
- Program log upsert by `programId + day`.
- Completion rate, skipped count, current streak, and fallback-needed status.
- Diary selected-date behavior through pure helpers where possible.
- Trend behavior with insufficient, sufficient, and invalid data.

### Component Tests

Add or update tests for:

- `PlansPage` renders today's task and feedback actions.
- Completed and skipped feedback is saved and reflected in stats.
- `TodayPage` shows the current task entry and opens the plan tab through existing app navigation.
- `DiaryPage` reloads fields after switching dates.
- `TrendsPage` renders insufficient-data, enough-data, hard-task, and care-first states.
- `ChatPage` sends latest diary and program context.

### E2E Tests

Fix current E2E failures and cover the complete path:

1. Create profile.
2. Complete assessment.
3. Add diary data.
4. Complete or skip today's plan task.
5. View trends with task feedback.
6. Open chat with program and diary context.
7. Confirm Chinese high-risk input receives deterministic safety fallback.

Known failures to address:

- Quick consultation E2E expects 9 cards while the current `TodayPage` excludes `sound_meditation`, yielding 8.
- Diary E2E still looks for old text inputs such as `getByLabel('睡前情绪').fill('平静')`, but the current UI uses choice buttons.

## Verification

Run:

```bash
npm test
npm run build
npm run e2e
```

Acceptance requires all three to pass.

## Documentation

Update `README.md` and `docs_cn/使用文档.md` to describe:

- Local-first scope.
- China-mainland safety wording.
- 14-day task completion and skip flow.
- Trend feedback based on diary and task logs.
- AI context and safety gate.
- No account, cloud sync, system notifications, medical diagnosis, prescription, dosage, or real medical platform integration.

## Acceptance Criteria

- Ordinary-risk users can complete the loop: home task entry -> plan task feedback -> trend feedback -> AI task explanation.
- Chinese high-risk inputs are reliably triaged before provider calls.
- Safety guidance is China-mainland oriented and avoids US-specific resources.
- Diary date switching cannot save stale values into the wrong date.
- Program stats are based on real local `DailyTaskLog` entries.
- Trend insights remain conservative with sparse data.
- CDN font or icon failure does not break layout or primary actions.
- `npm test`, `npm run build`, and `npm run e2e` pass.
- Documentation matches implemented behavior.
