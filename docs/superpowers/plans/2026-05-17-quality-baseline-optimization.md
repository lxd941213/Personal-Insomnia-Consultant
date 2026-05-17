# Quality Baseline Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore passing tests and TypeScript build while preserving the current simplified homepage behavior.

**Architecture:** Treat current product behavior as source of truth. Update stale callers, tests, unused imports, and docs to match existing component contracts.

**Tech Stack:** React, TypeScript, Vitest, Vite.

---

### Task 1: Sync App and Tests With Current Labels and Props

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/components/ChatPage.test.tsx`

- [x] Confirm current failures with `npm test` and `npm run build`.
- [x] In `src/App.tsx`, remove the stale `onOpenDiary={() => setActiveTab('diary')}` prop from `TodayPage`.
- [x] In `src/App.test.tsx`, replace `通常就寝时间` with `就寝时间` and `通常起床时间` with `起床时间`.
- [x] In `src/components/ChatPage.test.tsx`, replace all `onReset={vi.fn()}` props with `onOpenResetDrawer={vi.fn()}`.

### Task 2: Clear TypeScript Build Errors

**Files:**
- Modify: `src/components/ChatPage.tsx`
- Modify: `src/components/ResetConfirmDrawer.tsx`

- [x] Remove unused `clearAllLocalData` import from `src/components/ChatPage.tsx`.
- [x] Remove unused default `React` import from `src/components/ResetConfirmDrawer.tsx`.
- [x] Run `npm run build` and confirm TypeScript errors are gone.

### Task 3: Align Docs With Current Product Shape

**Files:**
- Modify: `README.md`
- Modify: `docs_cn/使用文档.md`

- [x] Update feature bullets to say the 14-day program lives in the plan page.
- [x] Update bottom navigation documentation from 今日 to 首页.
- [x] Update Today/Home page section to list only current homepage modules.
- [x] Keep existing plan-page documentation for the 14-day program.

### Task 4: Final Verification

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Run `npm run e2e`.
- [x] Review `git diff` to ensure only targeted files changed.
