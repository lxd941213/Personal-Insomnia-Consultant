# Sleep Enhancement Capabilities Design

## Goal

Add the next-stage sleep wellness capabilities shown in the product roadmap: sleep diary, sleep trend charts, lightweight smart reminders, guided relaxation tools, a sleep plan library, and enhanced user profile settings.

The implementation should turn the current consultation-focused MVP into a local-first daily-use product loop:

1. The user records sleep context and outcomes.
2. The app summarizes recent trends.
3. The app recommends safe, explainable plans.
4. The app surfaces tonight's tasks from reminders, plans, and relaxation tools.

## Scope

This iteration uses the "enhanced local loop" approach.

In scope:

- Bottom navigation with five tabs: `今日`, `日记`, `趋势`, `方案`, `我的`.
- Local-first data persistence with sync-ready data models.
- Sleep diary split into bedtime check-in and wake check-in.
- Trend charts for recent 7 and 30 day sleep signals.
- Lightweight in-app reminders, without browser or system notifications.
- Guided relaxation tools with step timers and placeholder audio entry points.
- Built-in sleep plan library with local rule-based recommendations.
- Enhanced profile/settings for reminder preferences, plan preferences, data explanation, and reset.

Out of scope:

- Accounts, login, cloud sync, or backend database persistence.
- Browser notification permission and system-level notifications.
- Real audio files or audio playback.
- AI-generated plan library content.
- Uploading full diary history to the AI chat API.

## Information Architecture

The main authenticated/app experience moves from a dashboard-only structure to five persistent bottom tabs.

### 今日

`今日` is the default home tab after profile setup. It keeps the current high-value entry points and adds daily action guidance.

It includes:

- Scene consultation entry points.
- Sleep self-assessment entry.
- Sleep knowledge entry.
- Tonight's in-app reminder tasks.
- Recommended relaxation tool.
- Recommended sleep plan action.
- Status of today's bedtime and wake diary entries.

Chat, assessment, knowledge, and relaxation detail pages open as child views with a top `返回` action.

### 日记

`日记` supports one diary entry per calendar date. The entry has two independently editable sections:

- `睡前记录`: bedtime mood, stress, behavior factors, and planned actions.
- `起床记录`: sleep result, wake time, sleep latency, awakenings, sleep quality, dream notes, and free notes.

The user can save each section separately. Re-opening the same date edits the existing entry.

### 趋势

`趋势` reads diary entries and displays recent 7 and 30 day windows.

Signals:

- Sleep duration.
- Sleep quality.
- Sleep latency.
- Number of awakenings.

When data is limited, the page shows a clear empty or partial-data state instead of treating the absence of data as an error. Local insights can be shown when simple thresholds are met, such as consistently long sleep latency or declining sleep quality.

### 方案

`方案` combines a built-in plan library with local rule-based recommendations.

Plan categories:

- CBT-I introduction.
- Stable schedule and fixed wake time.
- Stimulus control and sleep hygiene.
- Relaxation training.
- Caffeine and nutrition notes.
- Traditional Chinese wellness direction, framed conservatively.

Recommendations show:

- Plan title and category.
- Why this plan is recommended.
- Matched signals from profile, assessment, and recent diary.
- Suggested next step.
- Safety notes when relevant.

The plan library remains useful with no diary data. After at least three diary entries, recommendation copy can indicate that the matching is more reliable.

### 我的

`我的` manages:

- Existing sleep profile.
- Reminder settings.
- Plan preferences.
- Local data explanation.
- Reset local data.

Profile data should be extended carefully rather than replaced, preserving the current onboarding and chat context.

## Data Model

All new data is stored locally in this iteration, but models include fields that reduce future cloud-sync migration cost.

### Common Fields

Sync-ready user-owned records should include:

- `id`
- `createdAt`
- `updatedAt`
- `version`

Where relevant, records also include a date key or source field.

### SleepDiaryEntry

One entry per date:

- `id`
- `date`
- `bedtimeCheckin`
- `wakeCheckin`
- `createdAt`
- `updatedAt`
- `version`

`bedtimeCheckin` includes mood, stress level, behavior factors, planned action completion, bedtime intention, and notes.

`wakeCheckin` includes sleep start/end times, sleep latency, awakenings, sleep quality score, dream note, daytime feeling, and notes.

### ReminderSettings

Stores lightweight in-app reminder preferences:

- Bedtime reminder enabled/time/copy.
- Wake reminder enabled/time/copy.
- Last acknowledged dates.
- `createdAt`, `updatedAt`, `version`.

No notification permission is requested in this iteration.

### RelaxationTool and RelaxationSession

`RelaxationTool` is a static definition:

- 4-7-8 breathing.
- Progressive muscle relaxation.
- Mindfulness guidance.

Each tool has text steps, estimated duration, optional `audioUrl`, and an unavailable audio state.

`RelaxationSession` records:

- Tool ID.
- Start time.
- Completion time when finished.
- Duration.
- Status: started or completed.

Only completed sessions count as completed relaxation history.

### SleepPlan and PlanRecommendation

`SleepPlan` is an internal content definition with category, applicable scenarios, steps, recommended duration, contraindications or safety notes, and tags.

`PlanRecommendation` is generated locally from:

- Existing profile.
- Latest assessment result.
- Recent diary summary.
- Safety signals.

It includes plan ID, priority, recommendation reasons, matched signals, and any safety note.

## Data Flow

Diary input is saved to local storage. Trend calculations read diary entries and compute 7 and 30 day summaries. Recommendation rules read the profile, assessment result, recent diary summary, and safety signals to produce ranked plan recommendations.

`今日` reads from reminders, diary status, relaxation tools, and recommendations to produce a daily task view. It should not duplicate business logic; it should compose domain outputs.

The existing AI chat can continue to include the latest assessment result. This iteration does not send full diary history to the AI provider.

## Error Handling

Local storage follows the existing `localStore` pattern: try browser `localStorage`, fall back to in-memory storage when unavailable.

Trend pages handle insufficient data explicitly with empty and partial-data states.

Recommendation rules are conservative when safety signals exist. In those cases, high-risk behavior is not suggested, self-medication is avoided, and the UI prioritizes medical evaluation guidance where appropriate.

Relaxation sessions can be interrupted. Interrupted sessions remain `started`; they become `completed` only when the user reaches the finish action.

## Testing

Domain tests:

- Sleep diary date merge and section updates.
- 7 and 30 day trend windows.
- Sleep duration and latency calculations.
- Recommendation ranking and recommendation reasons.
- Safety signal downgrade behavior.
- Reminder task generation.

Storage tests:

- Diary, reminder settings, relaxation sessions, and plan preference save/read/clear.
- Existing profile, assessment, chat, and knowledge data remain compatible.
- Reset clears all local product data.

Component tests:

- Bottom tab navigation.
- Bedtime and wake diary saving.
- Trend empty state, partial-data state, and populated state.
- Plan library and recommendation reason rendering.
- Relaxation timer start, pause, resume, and completion state.
- My page settings and reset flow.

App tests:

- Completed profile lands on `今日`.
- Each tab opens the correct view.
- Child pages return to their parent flow.
- Existing chat, assessment, and knowledge paths remain reachable.

E2E smoke:

- New user creates profile.
- Lands on `今日`.
- Creates bedtime diary.
- Completes wake diary.
- Views trend summary.
- Opens recommended plan.

## Acceptance Criteria

- The app presents a Chinese bottom-tab experience with `今日 / 日记 / 趋势 / 方案 / 我的`.
- Diary data can be entered in bedtime and wake sections for the same date.
- Trend views are generated from local diary data and handle missing data gracefully.
- Reminder behavior is visible in-app and does not request notification permission.
- Relaxation tools provide timed text guidance and show audio as unavailable or upcoming.
- Plans are built-in and recommended by deterministic local rules with visible reasons.
- All new storage is local-first and includes sync-ready identifiers and timestamps.
- Existing MVP flows continue to work in Chinese.
