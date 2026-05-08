# Scene Chat And Assessment Feedback Design

Date: 2026-05-08

## Context

After the MVP required capabilities implementation, three user-facing issues remain:

- Scene consultation exposes the default prompt in the input box.
- The assessment answering page has no return action, and the report is too thin.
- Scene consultation histories share one global chat history, so different scenes mix together.

## Approved Direction

Use a lightweight correction rather than a full session system.

## Requirements

### Hidden Scene Context

Scene entry should not prefill the input with a long generated prompt. The chat input should remain empty. The selected scene is still sent to the chat API as context, and the placeholder should be short Chinese text specific to the current scene.

### Assessment Navigation And Report

The assessment answering page must show a Chinese “返回首页” action. The report must include:

- A Chinese overall conclusion.
- ISI score, level, and explanation.
- Simplified sleep quality score, level, and explanation.
- Risk flags with clear user-facing context.
- Specific next-step actions.
- Existing disclaimer.

### Scene-Specific Chat History

Chat history should be stored and read by a chat scope:

- `general` for non-scene consultation.
- The selected `SleepScenario` for scene consultation.

When the user switches scenes, the chat page should display only that scene’s history. Other scene histories remain saved locally. Resetting the profile still clears all local chat histories.

## Acceptance Criteria

- Clicking a scene opens chat with an empty input, not a visible prompt.
- Sending the first scene message sends `scenario` to `/api/chat`.
- Switching scenes shows only the selected scene’s stored history.
- The assessment form has a visible return button.
- The assessment report shows a richer conclusion and actionable next steps.
- `npm test`, `npm run build`, and `npm run e2e` pass.

