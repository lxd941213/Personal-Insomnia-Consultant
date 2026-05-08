# MVP Required Capabilities Design

Date: 2026-05-08

## Context

The current H5 MVP already supports local profile setup, AI consultation, high-risk safety fallback, structured AI response rendering, local feedback, and browser-only persistence. The product requirements describe additional MVP capabilities that are not yet implemented: scene-based navigation, sleep assessment, and a knowledge card library.

This design covers the next product increment only:

- Scene entry navigation.
- Full ISI assessment plus simplified PSQI-style sleep quality screening.
- AI-generated knowledge cards by scene.

Sleep diary, trend charts, reminders, check-ins, subscriptions, product recommendations, and medical referral monetization remain out of scope for this increment.

## Product Goal

Move the app from a single chat-first MVP to a guided sleep wellness experience where users can:

1. Choose a sleep scene without deciding how to phrase a question.
2. Complete a standard sleep self-assessment and receive a clear report.
3. Generate structured knowledge cards for their current scene.
4. Continue AI consultation with profile and assessment context.

The main success criteria are:

- A returning profiled user lands on a clear dashboard instead of being dropped directly into chat.
- A user can complete ISI and simplified PSQI screening without an AI call.
- The assessment report is understandable, actionable, and clearly not a diagnosis.
- A user can generate AI knowledge cards for a selected scene.
- Chat prompts can use the latest assessment result as additional context.
- All user-facing frontend text is written in Chinese.

## User-Facing Language Requirement

All frontend interface text for this increment must be Chinese, including:

- Navigation labels.
- Page titles.
- Button text.
- Form labels.
- Assessment questions and answer options.
- Assessment report labels, level names, explanations, and safety notices.
- Knowledge card headings and field labels.
- Loading, empty, error, retry, and fallback messages.
- Fine print and health disclaimers.

Type names, function names, tests, and internal code comments may remain English. User-facing strings returned by serverless APIs must also be Chinese because the frontend renders them directly.

## Product Scope

### In Scope

- New dashboard after profile setup.
- Fixed scene navigation:
  - 入睡困难
  - 熬夜习惯
  - 压力焦虑
  - 睡眠质量差
  - 养生调理
- Scene launch into chat with a prefilled or generated Chinese prompt.
- Full ISI self-assessment with scoring and level interpretation.
- Simplified PSQI-style screening with product-level scoring and clear labeling as a simplified screen.
- Local assessment result persistence.
- Assessment summary added to AI chat prompt context.
- AI-generated knowledge cards by selected scene.
- Local cache of the latest generated knowledge result per scene.
- Retry and fallback states for knowledge generation.
- Local data reset that clears profile, chat history, feedback, assessment result, and knowledge cache.

### Out Of Scope

- Account login.
- Server-side user profile or assessment storage.
- Full clinical PSQI scoring.
- Sleep diary.
- Trend charts.
- Reminder notifications.
- Check-in streaks.
- Static article library.
- Admin content management.
- Payments or member limits.
- Product affiliate recommendations.
- Medical referral monetization.
- WeChat mini program adaptation.

## User Flow

### First-Time User

1. User opens the H5 app.
2. `EntryPage` introduces the AI sleep consultant and health disclaimer in Chinese.
3. User creates a sleep profile in `ProfileWizard`.
4. App saves the profile locally.
5. User enters `DashboardPage`.
6. User chooses scene consultation, standard self-assessment, AI knowledge cards, or continued chat.

### Returning User

1. App reads local profile.
2. User lands on `DashboardPage`.
3. Dashboard shows:
   - Profile summary.
   - Scene entry navigation.
   - Latest assessment summary if available.
   - Primary actions for self-assessment, knowledge cards, and chat.

### Assessment Flow

1. User opens standard self-assessment.
2. User answers all ISI questions and simplified PSQI questions.
3. Frontend computes the result locally.
4. App saves `AssessmentResult` locally.
5. User sees `AssessmentReport` with:
   - ISI score and level.
   - Simplified PSQI score and level.
   - Key interpretation.
   - Risk flags if present.
   - Next suggested actions.
   - Health disclaimer.
6. User can return to dashboard or continue consulting with the report context.

### Knowledge Card Flow

1. User opens knowledge cards from dashboard or a scene entry.
2. User selects one scene.
3. Frontend checks local cache for that scene.
4. If cached content exists, render it and show a Chinese “重新生成” action.
5. If no cache exists, call `POST /api/knowledge`.
6. API returns normalized structured cards.
7. Frontend renders cards in Chinese and stores the response in local cache.
8. If generation fails, the selected scene remains visible and the page offers retry.

## Frontend Architecture

### `DashboardPage`

`DashboardPage` becomes the default page after a profile exists. It should not replace the profile wizard or chat page; it coordinates access to the new capabilities.

Responsibilities:

- Render Chinese profile summary.
- Render fixed scene navigation.
- Show latest assessment summary when available.
- Link to assessment, knowledge cards, and chat.
- Provide reset action.

### `ScenarioLauncher`

Shared component for fixed scene options.

Responsibilities:

- Render scene labels and short Chinese descriptions.
- Support launch modes:
  - Chat mode: route to `ChatPage` with a scene prompt.
  - Knowledge mode: route to `KnowledgePage` with a selected scene.
- Keep scene definitions centralized so chat and knowledge use the same labels.

### `AssessmentPage`

Assessment answering surface.

Responsibilities:

- Render all ISI and simplified PSQI questions in Chinese.
- Require all questions before report generation.
- Keep answer controls simple and mobile-friendly.
- Call domain scoring functions on submit.
- Save result locally.

### `AssessmentReport`

Assessment result display.

Responsibilities:

- Render score, level, interpretation, risk flags, next actions, and disclaimer.
- Use neutral health-management language.
- Avoid diagnostic wording.
- Highlight professional-help guidance when score or answers indicate elevated risk.

### `KnowledgePage`

Knowledge generation and display surface.

Responsibilities:

- Render scene selection or selected scene state.
- Call `POST /api/knowledge`.
- Render loading, error, retry, cached, and regenerated states in Chinese.
- Save and read latest result per scene from local storage.
- Keep high-risk fallback cards prominent and conservative.

### Existing Components

`ChatPage` remains the consultation page, with these changes:

- Add a Chinese “返回首页” action.
- Accept optional scene prompt or prefilled input.
- Include latest assessment summary in API request context.
- Show latest assessment summary near the top when available.

`ProfileWizard` remains the profile setup surface. User-facing text must stay Chinese.

## Domain Model

Recommended core types:

```ts
export type SleepScenario =
  | 'hard_to_fall_asleep'
  | 'late_night_habit'
  | 'stress_anxiety'
  | 'poor_sleep_quality'
  | 'wellness_regulation';

export interface AssessmentResult {
  completedAt: string;
  isi: {
    answers: number[];
    score: number;
    level: 'none' | 'mild' | 'moderate' | 'severe';
    summary: string;
  };
  psqiLite: {
    answers: number[];
    score: number;
    level: 'good' | 'fair' | 'poor';
    summary: string;
  };
  riskFlags: string[];
}

export interface KnowledgeCard {
  title: string;
  summary: string;
  keyPoints: string[];
  misconceptions: string[];
  actions: Array<{ title: string; detail: string }>;
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

Internal enum values may remain English. Every label mapped from those values must be Chinese.

## Assessment Scoring

### ISI

Use the complete 7-item Insomnia Severity Index structure. Each item is scored from 0 to 4, total score 0 to 28.

Level interpretation:

- `none`: 0-7, 无明显失眠。
- `mild`: 8-14, 轻度失眠倾向。
- `moderate`: 15-21, 中度失眠倾向。
- `severe`: 22-28, 较重失眠倾向，建议寻求专业评估。

The report must describe ISI as a self-assessment reference and not a diagnosis.

### Simplified PSQI-Style Screening

Implement a simplified product screening rather than full clinical PSQI scoring. The frontend label should be “简化睡眠质量筛查”, not “完整 PSQI 诊断”.

Suggested dimensions:

- 主观睡眠质量。
- 入睡耗时。
- 实际睡眠时长。
- 夜间醒来或睡眠中断。
- 白天精神和功能影响。
- 助眠药物或酒精依赖信号。

Level interpretation:

- `good`: 睡眠质量整体较好。
- `fair`: 睡眠质量有波动，建议先做习惯调整。
- `poor`: 睡眠质量较差，若持续存在建议寻求专业评估。

### Risk Flags

Assessment scoring should produce risk flags for:

- ISI severe range.
- Very short sleep duration.
- Strong daytime impairment.
- Frequent medication or alcohol reliance for sleep.
- Any existing profile safety signal.

Risk flags affect report wording and are included in later AI prompt context.

## API Design

### Existing `POST /api/chat`

Request body should add optional assessment context:

```json
{
  "profile": {},
  "message": "最近总是睡不着，怎么办？",
  "history": [],
  "assessmentResult": {}
}
```

Prompt changes:

- Summarize the latest assessment result in Chinese.
- Include ISI score, simplified sleep quality level, and risk flags.
- Instruct the AI to reference assessment data only as self-assessment context.
- Continue prohibiting diagnosis, prescriptions, drug dosages, and high-risk intervention guidance.

### New `POST /api/knowledge`

Request body:

```json
{
  "profile": {},
  "scenario": "hard_to_fall_asleep",
  "assessmentResult": {}
}
```

Response body:

```json
{
  "scenario": "hard_to_fall_asleep",
  "cards": [
    {
      "title": "为什么越想睡越睡不着",
      "summary": "结合你的作息和压力状态，解释入睡困难的常见机制。",
      "keyPoints": ["要点"],
      "misconceptions": ["误区"],
      "actions": [{ "title": "今晚先做一件事", "detail": "具体行动" }],
      "safetyNote": null,
      "followUpQuestions": ["可以继续问的问题"]
    }
  ],
  "disclaimer": "本内容仅提供健康管理参考，不作为医疗诊断。",
  "generatedAt": "2026-05-08T00:00:00.000Z"
}
```

API responsibilities:

- Validate `profile` and `scenario`.
- Accept optional `assessmentResult`.
- Detect high-risk profile or assessment context before provider call.
- Build a strict Chinese JSON prompt.
- Call the provider through server-side credentials only.
- Parse and normalize JSON.
- Return a conservative fallback knowledge response when provider output is invalid or unsafe.

## Knowledge Generation Policy

Use controlled AI generation rather than free-form article generation.

The prompt should require:

- Chinese output only.
- Structured JSON only.
- 2-4 cards per response.
- Practical health-management education.
- No medical diagnosis.
- No prescriptions.
- No drug dose recommendations.
- No claims that supplements, foods, or techniques cure insomnia.
- Clear professional-help guidance when risk is elevated.

Frontend caches the latest `KnowledgeResponse` per scene in local storage. The cache should be transparent through UI labels such as “上次生成” and “重新生成”.

## Local Persistence

Existing keys:

- `sleepProfile`
- `chatHistory`
- `feedbackEvents`

New keys:

- `assessmentResult`
- `knowledgeCache`

`knowledgeCache` should be an object keyed by `SleepScenario`, storing the latest `KnowledgeResponse` for each scene.

`clearAllLocalData()` must remove all five keys.

If local storage is unavailable, the app can continue in memory using the existing storage fallback. User-facing persistence warnings must be Chinese.

## Safety And Compliance

The increment keeps the same health boundary as the MVP:

- The app is a health-management reference tool, not a medical diagnosis system.
- High-risk signals must lead to professional-help guidance.
- The system must not prescribe, recommend medication dosage, or replace clinician evaluation.
- Assessment reports must avoid diagnostic claims.
- Simplified PSQI-style screening must be labeled as simplified.
- AI knowledge cards must include a Chinese disclaimer.
- No server-side health profile or assessment storage is introduced.

## Error Handling

- Assessment scoring is local and should work without AI availability.
- Incomplete assessment answers block report generation with Chinese validation text.
- Knowledge generation failure preserves selected scene and shows Chinese retry text.
- Invalid AI JSON returns a safe fallback response rather than raw provider content.
- High-risk assessment context returns conservative cards focused on professional evaluation and low-risk self-care.
- Chat failures continue preserving the user input for retry.
- Reset clears all local health data created by this increment.

## Testing And Acceptance Criteria

### Unit Tests

- ISI scoring returns correct score and level boundaries.
- Simplified PSQI-style screening returns correct level boundaries.
- Assessment risk flags are produced for severe score, short sleep, strong daytime impact, medication or alcohol reliance, and profile safety signals.
- Knowledge response normalization accepts valid structured JSON.
- Knowledge response normalization falls back on missing or malformed fields.
- Knowledge fallback response is Chinese and includes disclaimer.

### Component Tests

- Dashboard renders Chinese scene navigation after a profile exists.
- Dashboard links to assessment, knowledge cards, and chat.
- Assessment page requires all answers.
- Assessment report renders Chinese score labels, level names, summaries, and disclaimer.
- Knowledge page renders loading, success, cached, regeneration, error, and retry states in Chinese.
- Chat page shows a Chinese return-to-dashboard action and can include latest assessment context.

### API Tests

- `POST /api/knowledge` rejects missing profile or invalid scene.
- `POST /api/knowledge` returns normalized cards for valid provider JSON.
- `POST /api/knowledge` returns safe fallback cards on provider failure.
- `POST /api/chat` prompt includes assessment context when provided.
- High-risk profile or assessment context produces conservative output.

### E2E Tests

- First-time user completes profile and lands on dashboard.
- Returning user lands on dashboard.
- User completes assessment and sees report.
- User returns to dashboard and sees latest assessment summary.
- User generates scene knowledge cards.
- User uses cached cards and can regenerate.
- User launches chat from a scene.
- Reset clears profile, assessment, chat, feedback, and knowledge cache.

## Implementation Notes

- Keep scoring logic in domain modules, not React components.
- Keep AI JSON normalization in domain/API helper modules.
- Prefer fixed scene definitions and Chinese label maps over duplicated literals.
- Reuse existing local storage fallback pattern.
- Keep frontend controls mobile-first and text-safe.
- Avoid adding new charting or content-management dependencies in this increment.

