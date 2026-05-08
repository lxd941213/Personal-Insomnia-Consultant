# Scene Chat And Assessment Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide scene prompt text, improve the assessment flow/report, and isolate chat history by current scene.

**Architecture:** Keep the existing local-first React architecture. Add scoped chat history helpers to `localStore`, pass the current chat scope into `ChatPage`, keep scene context hidden in the API payload, and enrich assessment report rendering from the existing `AssessmentResult`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Playwright, browser `localStorage`.

---

### Task 1: Tests For Approved Feedback

**Files:**
- Modify: `src/storage/localStore.test.ts`
- Modify: `src/components/ChatPage.test.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/components/AssessmentPage.test.tsx`

- [ ] Add tests proving scoped chat history can save and read separate `general` and scene histories.
- [ ] Add a ChatPage test proving `initialInput` is not required to send `scenario`, and the input starts empty for a scene.
- [ ] Add an App test proving scene chat opens with an empty input.
- [ ] Add AssessmentPage tests proving the answering page has “返回首页” and the report contains “总体结论” and “下一步建议”.

### Task 2: Scoped Chat History

**Files:**
- Modify: `src/storage/localStore.ts`
- Modify: `src/components/ChatPage.tsx`
- Modify: `src/App.tsx`

- [ ] Add `ChatHistoryScope = 'general' | SleepScenario`.
- [ ] Add `getScopedChatHistory(scope)` and `saveScopedChatHistory(scope, messages)`.
- [ ] Keep `getChatHistory()` and `saveChatHistory()` as general-history wrappers for compatibility.
- [ ] Make `ChatPage` read and write the current scope only.
- [ ] Make `App.openChat(scenario)` set scene state but not visible prompt text.

### Task 3: Assessment UX

**Files:**
- Modify: `src/components/AssessmentPage.tsx`

- [ ] Add “返回首页” button to the answering page.
- [ ] Enrich report with “总体结论”, detailed score explanations, risk context, next-step actions, and disclaimer.
- [ ] Keep report visible after submit until user explicitly returns.

### Task 4: Verification

**Commands:**
- `npm test`
- `npm run build`
- `npm run e2e`

Expected: all pass.

