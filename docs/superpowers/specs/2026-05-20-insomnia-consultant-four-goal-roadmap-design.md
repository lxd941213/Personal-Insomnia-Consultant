# Insomnia Consultant Four-Goal Roadmap Design

## Context

The product is a mobile-first H5 sleep assistant that may later move to a WeChat Mini Program. The current implementation already includes local sleep profile setup, ISI and PSQI-Lite assessment, AI consultation, safety triage, trusted knowledge cards, sleep diary, trend summaries, relaxation tools, a local 14-day sleep program, local feedback, and browser-local persistence.

Current verification is strong for an H5 MVP baseline:

- `npm test`: 36 test files and 213 tests passed.
- `npm run build`: passed.
- `npm run e2e`: 8 Playwright tests passed.

The user confirmed the product positioning: **sleep health management and science-education companionship tool**. It must not become a diagnosis, treatment, prescription, emergency, or medical decision platform.

## Product Boundary

The app can:

- Help users record sleep and daytime state.
- Help users understand possible sleep-influencing factors.
- Provide conservative sleep hygiene, relaxation, and CBT-I-inspired education.
- Guide a local 14-day self-management program.
- Let users discuss sleep-management questions with AI in a structured, non-diagnostic way.
- Encourage professional evaluation when risk signals appear.

The app must not:

- Diagnose insomnia, sleep apnea, psychiatric disorders, or other diseases.
- Claim treatment, cure, clinical efficacy, or guaranteed improvement.
- Provide prescriptions, medication dosage, supplement dosage, or medication-change instructions.
- Replace physicians, psychologists, psychotherapists, emergency services, or offline clinical evaluation.
- Present AI output as medical judgment.

## Reference Boundary

The product should keep claims conservative and aligned with public references:

- ACP states that cognitive behavioral therapy for insomnia should be the initial treatment for adults with chronic insomnia: https://www.acponline.org/acp-newsroom/acp-recommends-cognitive-behavioral-therapy-as-initial-treatment-forchronic-insomnia
- AASM describes CBT-I as first-line treatment and frames digital CBT-I platforms as self-guided, automated guidance, or auxiliary tools: https://aasm.org/digital-cognitive-behavioral-therapy-for-insomnia-platforms-and-characteristics/
- FDA digital-health materials distinguish general wellness software from device or medical-app functions: https://www.fda.gov/medical-devices/digital-health-center-excellence/device-software-functions-including-mobile-medical-applications
- China public health reporting indicates 12356 mental-health assistance hotline rollout, but urgent danger should still route to local emergency and offline professional help: https://english.www.gov.cn/english.www.gov.cn/news/202502/13/content_WS67aded38c6d0868f4e8ef9dd.html

## Recommended Approach

Use the **safety-trust-first roadmap**:

1. Safety and professional trust.
2. H5 launch readiness.
3. Long-term companionship and retention.
4. WeChat Mini Program migration readiness.

This order fits the product boundary. A health-management companion should first prevent unsafe or misleading behavior, then polish the H5 loop, then improve longitudinal engagement, and only then absorb platform migration work.

Rejected alternatives:

- Quick-launch first: useful for market feedback, but health-boundary and AI-output fixes would likely cause rework.
- Platform-migration first: useful if Mini Program is already the only target, but it delays product-value validation and may prematurely optimize platform abstractions.

## Architecture

Keep the existing layered structure:

- `src/domain/*`: deterministic safety, assessment, diary, trend, program, personalization, knowledge, and response rules.
- `src/components/*`: UI state, page composition, forms, and user interactions.
- `src/storage/localStore.ts`: local persistence and fallback storage.
- `src/api/*` and `api/*`: API client, serverless-compatible chat logic, prompt construction, provider calls, and server-side safety gate.

Do not rewrite the app shell. Instead, organize future work around five stable modules.

## Module Boundaries

### Safety Trust Core

Owns risk triage, `careNotice`, AI blocking, disclaimers, care-first page states, trusted-source labels, and prompt safety boundaries.

Rules:

- All pages and API code read the same structured triage result.
- `urgent` blocks ordinary AI consultation and ordinary behavior tasks.
- `needs_care` allows conservative education but prioritizes professional evaluation guidance.
- `normal` enters the ordinary diary, plan, trends, and AI companionship loop.

### User Sleep Context

Combines profile, assessment, diary summary, program state, task logs, recent notes, and safety status into one reusable context.

Consumers should not repeatedly assemble scattered storage data. H5 and Mini Program implementations should both depend on this context shape.

### Action Program Engine

Owns the 14-day program, today task, complete/skip feedback, fallback actions, stats, weekly review, and future task adjustment.

It answers:

- What should the user do today?
- Why is this task relevant?
- What lighter fallback is available?
- What changed after recent records and task feedback?

### Consultation Layer

Owns scenario chat, prompt construction, structured AI response normalization, history, feedback, stop/regenerate actions, and AI failure recovery.

It must not override Safety Trust Core. AI can explain tasks, reflect blockers, and provide conservative sleep-management education only inside the product boundary.

### Platform Adapter

Defines a thin future interface for platform-dependent capabilities:

- Storage.
- Navigation.
- Network request.
- Notification or reminder.
- Asset and icon fallback.
- Environment flags.

H5 can keep using the current browser implementation. Mini Program migration should replace adapters instead of rewriting domain logic.

## Data Flow

### Shared Flow

```text
SleepProfile
  + AssessmentResult
  + SleepDiaryEntry[]
  + SleepProgram
  + DailyTaskLog[]
  + ChatHistory
  -> User Sleep Context
  -> Safety Trust Core
  -> Program / Trends / Chat / Care-first UI
```

### Consultation Flow

```text
User message
  -> User Sleep Context
  -> SafetyTriage
  -> urgent: deterministic fallback, no provider call
  -> normal or needs_care: build bounded prompt
  -> AI provider
  -> normalizeAiResponse
  -> save scoped local chat history
```

### Program Flow

```text
User Sleep Context
  -> SafetyTriage
  -> active program or care-first program state
  -> today task
  -> completed/skipped feedback
  -> DailyTaskLog
  -> stats, review, trends, future fallback suggestion
```

### Trend Flow

```text
Diary entries + task logs
  -> record-quality check
  -> 7-day and 30-day summaries
  -> conservative insights
  -> task execution suggestion
```

## Functional Completeness Assessment

The current app is close to an H5 MVP-plus baseline. It is not yet a complete product.

Strong existing areas:

- Local-first profile and persistence.
- Sleep assessment with risk flags.
- AI consultation with structured response rendering.
- Chinese high-risk triage and server-side blocking.
- Diary, trend, relaxation, knowledge, and 14-day plan modules.
- Automated test coverage and passing build/E2E checks.

Remaining gaps:

- Trust consistency: safety, disclaimers, trusted references, care guidance, and AI boundaries need one visible product language.
- Loop depth: task completion, weekly review, plan fallback, and trend interpretation should better show "what I did, what changed, what next".
- Launch completeness: empty states, failure states, privacy wording, AI unavailable state, and local-data boundaries need product-level polish.
- Migration readiness: H5-specific storage, routing, resources, and component assumptions need adapter boundaries before Mini Program work.

## Four-Phase Roadmap

### Phase 1: Safety And Professional Trust

Goal: make the product clearly safe, conservative, and non-diagnostic before broader launch polish.

Scope:

- Centralize structured safety triage usage across API, prompt, assessment, plan, trends, and chat surfaces.
- Standardize `urgent`, `needs_care`, and `normal` UI language.
- Add care-first components for urgent and needs-care states.
- Make trusted-source labels visible for scientific and safety content.
- Ensure AI prompts forbid diagnosis, treatment claims, prescriptions, dosages, and safety-rule overrides.
- Add a sensitive-claim wording checklist for future content.

Acceptance:

- High-risk Chinese and mixed-language signals block provider calls.
- Needs-care cases show professional evaluation guidance before ordinary tasks.
- No page claims diagnosis, treatment, cure, prescription, or guaranteed efficacy.
- Unit, API, and UI tests cover high-risk and needs-care paths.

### Phase 2: H5 Launch Readiness

Goal: make the current H5 experience coherent and usable end to end.

Scope:

- Smooth new-user path: entry, profile, assessment, first recommendation, first diary record, first plan task, first chat.
- Improve home task entry and plan-page task execution.
- Strengthen diary validation, date switching, sparse-data states, and trend copy.
- Provide AI unavailable fallback that preserves user input and offers local guidance.
- Clarify local-only privacy boundary and reset behavior.
- Update documentation and E2E selectors around current UI.

Acceptance:

- New user can complete the core path without dead ends.
- Empty, sparse, loading, AI failure, and local-storage fallback states are understandable.
- `npm test`, `npm run build`, and `npm run e2e` pass.

### Phase 3: Long-Term Companionship And Retention

Goal: make the app useful beyond the first few sessions without overstating clinical effect.

Scope:

- Add week 1 and week 2 review experiences.
- Convert recent task difficulty and diary trends into conservative fallback suggestions.
- Add local streaks or continuity signals that encourage recording without promising improvement.
- Add reminder preferences as local planning cues, not guaranteed push delivery unless platform support exists.
- Improve chat continuity with recent diary and task context.
- Add retention-oriented metrics that remain local-first unless a backend is later approved.

Acceptance:

- Users who record several days receive a conservative review and next-step suggestion.
- Repeated skipped or hard tasks trigger lighter alternatives.
- Sparse data still avoids improvement claims.
- Tests cover review, fallback, and continuity behavior.

### Phase 4: WeChat Mini Program Migration Readiness

Goal: prepare for migration without prematurely rewriting the H5.

Scope:

- Define platform adapter interfaces for storage, navigation, request, notification, and assets.
- Move H5 localStorage usage behind adapter functions.
- Identify browser-only assumptions in components and styles.
- Create Mini Program sensitive wording checklist.
- Create migration mapping from H5 pages to Mini Program pages.
- Keep domain logic platform-independent.

Acceptance:

- Domain tests run without browser APIs.
- Storage/request/navigation calls can be swapped by adapter.
- A migration checklist identifies page mapping, storage keys, platform APIs, resource handling, and review-sensitive wording.

## Error Handling

High risk:

- Block ordinary AI provider calls.
- Show deterministic care-first guidance.
- Mention local emergency services, nearest emergency or psychiatric emergency care, and trusted nearby support where appropriate.
- Do not show ordinary behavior tasks as the primary action.

Needs care:

- Allow conservative education only.
- Place professional evaluation guidance above ordinary tasks.
- Avoid task language that implies treatment.

Data insufficient:

- Do not judge improvement.
- Ask for more records and explain what data is needed.

AI unavailable:

- Preserve user input.
- Show retry.
- Offer local conservative suggestions or relevant knowledge/task entry.

Local storage unavailable:

- Fall back to memory storage.
- Warn that data may not persist on the current device.

External resource failure:

- Font and icon failures must not break layout or primary actions.
- Knowledge enhancement failure must not block trusted built-in content.

Mini Program migration risk:

- Avoid sensitive wording such as diagnosis, treatment, cure, prescription, efficacy guarantee, and emergency replacement.
- Keep health advice framed as science education and self-management reference.

## Testing Strategy

Phase 1:

- Safety triage unit tests.
- API high-risk blocking tests.
- Prompt boundary tests.
- Care-first UI state tests.

Phase 2:

- Profile-to-assessment E2E.
- Diary-to-trend E2E.
- Plan complete/skip E2E.
- Chat fallback and AI failure tests.
- Privacy/reset flow tests.

Phase 3:

- Weekly review tests.
- Fallback suggestion tests.
- Continuous-recording tests.
- Sparse-data non-claim tests.

Phase 4:

- Platform adapter unit tests.
- H5 adapter regression tests.
- Browser-independent domain tests.
- Migration checklist and sensitive-copy scan.

Overall verification remains:

```bash
npm test
npm run build
npm run e2e
```

## Implementation Guidance

This is a roadmap-level design. Implementation should be split into separate plans by phase. Phase 1 should be planned and implemented first because it sets the product boundary used by all later work.

Do not broaden scope into accounts, cloud sync, medical-platform integration, real clinical triage, paid referral, or backend health records unless a new design explicitly approves those changes.
