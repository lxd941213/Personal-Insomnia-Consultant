# Add Feature Scenarios Design

## Context

The app already exposes sleep-related entry points through a shared scenario model:

- `src/domain/types.ts` defines `SleepScenario`.
- `src/domain/scenarios.ts` stores scenario labels, descriptions, keywords, and AI prompts.
- `ScenarioLauncher` renders the scenario cards for the dashboard, today page, and knowledge page.
- Chat and knowledge generation already accept an optional scenario and use the selected scenario as context.

The requested screenshot shows four additional capabilities:

- 睡前仪式助手
- 白噪音 / 冥想音频
- 在线问诊导流
- 饮食 x 睡眠关联

The selected product direction is to make these visible as homepage feature cards and clickable into the existing consultation or knowledge flow.

## Approach

Extend the existing scenario system instead of adding a separate feature-card subsystem. This keeps behavior consistent across the app and avoids duplicating card rendering, navigation, and knowledge selection logic.

Add four scenario IDs to `SleepScenario`:

- `bedtime_ritual`
- `sound_meditation`
- `medical_triage`
- `diet_sleep_link`

Add corresponding definitions to `sleepScenarios`. Each definition will include:

- Chinese label matching the screenshot.
- A concise Chinese description matching the screenshot intent.
- Keywords that help classify related user messages.
- A dedicated `chatPrompt` so AI responses are grounded in the capability.

## User Experience

The existing “选择场景” section will show the original five scenarios plus the four new capabilities. Because `ScenarioLauncher` is shared, the new cards appear in:

- Dashboard scene selection.
- Today page scene selection.
- Knowledge page scenario selector.

When the user clicks a new card from chat mode, the app opens chat with that scenario selected. When selected from knowledge mode, the app generates scenario-specific knowledge cards.

The four new capabilities are scoped as AI-guided flows:

- 睡前仪式助手: generate a personalized 30-minute pre-sleep routine from the user's profile and current concern.
- 白噪音 / 冥想音频: recommend compliant audio categories, embedded content ideas, or external resources without implementing an audio player in this change.
- 在线问诊导流: guide severe-insomnia users toward appropriate medical evaluation and platform handoff language without integrating a commercial partner.
- 饮食 x 睡眠关联: analyze common diet-sleep relationships and suggest practical dietary adjustments.

## Data Flow

No new persistence model is required. Existing paths continue to work:

1. User selects a scenario card.
2. App stores the selected `SleepScenario` in existing component state.
3. Chat calls include the scenario value.
4. Knowledge calls include the scenario value and cache the result by scenario key.
5. `buildScenePrompt` returns the new scenario prompt when called with the new ID.

## Error Handling

Existing fallback behavior remains unchanged:

- `isSleepScenario` validates IDs against `sleepScenarios`.
- Unknown or invalid knowledge scenarios fall back to `wellness_regulation`.
- `buildScenePrompt` keeps the generic fallback for impossible invalid values.

## Testing

Update domain tests to cover:

- `sleepScenarios` now has nine entries.
- The label order includes the four new Chinese feature labels after the existing five scenarios.
- The ID list includes the four new scenario IDs.
- Prompts for representative new scenarios contain the relevant feature context.

Existing component tests should continue to pass because `ScenarioLauncher` renders from the shared scenario list.

## Out Of Scope

This change will not add:

- A real audio player.
- Real embedded audio assets.
- Real external medical platform integration.
- A dedicated diet questionnaire or nutrition tracking store.
- A new homepage section separate from the existing scenario launcher.
