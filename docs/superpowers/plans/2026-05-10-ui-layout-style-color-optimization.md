# UI Layout, Style, and Color Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the app into a calmer, more readable sleep-health tool while keeping night ritual atmosphere on entry and relaxation surfaces.

**Architecture:** Keep the existing Vite/React component structure. Centralize the visual system in `src/styles.css` with reusable tokens and component styles; make only minimal JSX class additions where CSS needs clearer hooks.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright, CSS custom properties, lucide icons already loaded from `index.html`.

---

## File Structure

- Modify `src/styles.css`: global tokens, base shell, cards, controls, bottom tabs, Today, Diary, Plans, Trends, Chat, Entry, Relaxation, responsive and reduced-motion rules.
- Modify `src/components/TrendsPage.tsx`: add semantic class hooks and wrappers for metric values and insight callouts.
- Modify `src/components/RelaxationPage.tsx`: add progress percentage CSS variable and structure for a calm timer/progress surface.
- Modify `src/components/TodayPage.tsx`: remove inline style on the diary CTA by adding a reusable class hook.
- Test existing component tests only if markup changes break assertions. No domain logic tests should need updates.

## Task 1: Visual Tokens and Global Shell

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add visual-system tokens near `:root`**

Add tokens below the existing color variables in `:root`:

```css
  --surface-soft: rgba(255, 255, 255, 0.035);
  --surface-card: rgba(19, 21, 37, 0.92);
  --surface-card-strong: rgba(26, 30, 53, 0.92);
  --card-bg: linear-gradient(145deg, var(--surface-card), rgba(18, 24, 38, 0.86));
  --card-border: rgba(168, 180, 214, 0.10);
  --card-border-strong: rgba(201, 184, 122, 0.24);
  --success: #8fc79a;
  --success-bg: rgba(143, 199, 154, 0.10);
  --success-border: rgba(143, 199, 154, 0.28);
  --warning: #d8aa64;
  --warning-bg: rgba(216, 170, 100, 0.10);
  --warning-border: rgba(216, 170, 100, 0.28);
  --shadow-soft: 0 10px 32px rgba(0, 0, 0, 0.24);
  --shadow-raised: 0 16px 44px rgba(0, 0, 0, 0.32);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
```

- [ ] **Step 2: Normalize base text and background**

Update `body` and add shared text wrapping/focus rules:

```css
body {
  min-height: 100%;
  margin: 0;
  font-family: 'LXGW WenKai', 'Noto Serif SC', serif;
  background:
    radial-gradient(circle at 50% -20%, rgba(61, 46, 92, 0.28), transparent 42%),
    linear-gradient(180deg, var(--night-deep) 0%, #090a12 54%, var(--night-deep) 100%);
  color: var(--text-primary);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, p, li, button, input, textarea, select {
  text-wrap: pretty;
}

button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
[role="button"]:focus-visible {
  outline: 2px solid rgba(201, 184, 122, 0.72);
  outline-offset: 3px;
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: TypeScript and Vite build pass. CSS warnings are not expected.

## Task 2: Shared Controls, Cards, and Bottom Tabs

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Refine primary and secondary actions**

Update `.primary-button`, `.action-btn`, `.back-btn`, `.reset-btn`, `.chip`, `.tag`, and form input rules to use the new tokens. Keep class names unchanged.

Core styles:

```css
.primary-button {
  min-height: 44px;
  background: linear-gradient(135deg, #d7c27f 0%, var(--moonbeam) 52%, #b99755 100%);
  color: var(--night-deep);
  border: none;
  border-radius: 999px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out), filter 0.22s var(--ease-out);
}

.action-btn,
.back-btn,
.chat-header .reset-btn,
.dashboard-header .reset-btn {
  min-height: 40px;
  border: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.035);
  color: var(--text-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}
```

- [ ] **Step 2: Refine bottom tabs**

Replace duplicate `.bottom-tabs` and `.bottom-tab` rules with one final block near the bottom of the stylesheet:

```css
.bottom-tabs {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(640px, 100%);
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  padding: 8px 14px calc(12px + env(safe-area-inset-bottom));
  background: rgba(7, 8, 16, 0.78);
  border-top: 1px solid rgba(168, 180, 214, 0.08);
  box-sizing: border-box;
  z-index: 10;
  backdrop-filter: blur(22px) saturate(1.15);
  -webkit-backdrop-filter: blur(22px) saturate(1.15);
}
```

- [ ] **Step 3: Run focused tests**

Run: `npm run test -- src/components/BottomTabs.test.tsx`

Expected: PASS.

## Task 3: Today, Scenario, Diary, and Plans Layout Polish

**Files:**
- Modify: `src/styles.css`
- Modify: `src/components/TodayPage.tsx`

- [ ] **Step 1: Remove Today inline margin**

In `src/components/TodayPage.tsx`, replace:

```tsx
<button type="button" className="primary-button" onClick={onOpenDiary} style={{ marginTop: '8px' }}>
```

with:

```tsx
<button type="button" className="primary-button todo-diary-button" onClick={onOpenDiary}>
```

- [ ] **Step 2: Add Today and card polish**

Update these CSS blocks: `.page-header-sticky`, `.program-card`, `.program-task-card`, `.program-feedback`, `.highlight-card`, `.task-check`, `.quick-tile`, `.scenario-card-compact`, `.date-chip`, `.tab-switcher`, `.plan-card-featured`, `.category-group`, `.program-timeline .timeline-item`.

Required semantic status examples:

```css
.task-check.completed,
.program-timeline .timeline-item.completed {
  border-color: var(--success-border);
  background: var(--success-bg);
}

.program-timeline .timeline-item.skipped {
  border-color: var(--warning-border);
  background: var(--warning-bg);
}

.todo-diary-button {
  margin-top: 8px;
}
```

- [ ] **Step 3: Run focused tests**

Run: `npm run test -- src/components/TodayPage.test.tsx src/components/DiaryPage.test.tsx src/components/PlansPage.test.tsx`

Expected: PASS.

## Task 4: Trends and Relaxation Semantic Surfaces

**Files:**
- Modify: `src/components/TrendsPage.tsx`
- Modify: `src/components/RelaxationPage.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add Trends wrappers**

Change the metric cards in `src/components/TrendsPage.tsx` to use value/meta hooks:

```tsx
<section className="metric-grid trend-metrics">
  <article className="metric-card trend-card">
    <h2>近 7 天</h2>
    <p className="metric-value">{trends.last7Days.entryCount} 天</p>
    <p className="metric-meta">平均入睡耗时 {trends.last7Days.averageSleepLatencyMinutes ?? '--'} 分钟</p>
  </article>
  ...
</section>
<section className="trend-insights">
  {trends.insights.map((insight) => <p key={insight}>{insight}</p>)}
  <p>{programInsight}</p>
</section>
```

- [ ] **Step 2: Add Relaxation progress variable**

In `src/components/RelaxationPage.tsx`, compute:

```tsx
const progressPercent = totalSeconds > 0 ? Math.min((elapsedSeconds / totalSeconds) * 100, 100) : 0;
```

Then update the progress container:

```tsx
<div
  className="relaxation-progress"
  style={{ '--relaxation-progress': `${progressPercent}%` } as React.CSSProperties}
>
```

- [ ] **Step 3: Add Trends and Relaxation CSS**

Add:

```css
.trend-card .metric-value {
  margin: 4px 0 2px;
  font-size: 30px;
  font-weight: 700;
  color: var(--mist);
  line-height: 1;
}

.trend-card:nth-child(3) .metric-value,
.trend-card:nth-child(4) .metric-value {
  color: var(--success);
}

.trend-insights {
  display: grid;
  gap: 10px;
}

.trend-insights p {
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  color: var(--text-secondary);
  line-height: 1.7;
}

.relaxation-progress::after {
  content: '';
  display: block;
  width: var(--relaxation-progress);
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--moonbeam), var(--success));
  transition: width 0.35s var(--ease-out);
}
```

- [ ] **Step 4: Run focused tests**

Run: `npm run test -- src/components/TrendsPage.test.tsx src/components/RelaxationPage.test.tsx`

Expected: PASS.

## Task 5: Reduced Motion, Build, and Browser Verification

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add reduced-motion support**

Add near the end of `src/styles.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Run full build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Run component test sweep**

Run: `npm run test -- src/components/BottomTabs.test.tsx src/components/TodayPage.test.tsx src/components/DiaryPage.test.tsx src/components/PlansPage.test.tsx src/components/TrendsPage.test.tsx src/components/RelaxationPage.test.tsx`

Expected: PASS.

- [ ] **Step 4: Browser visual check**

Run: `npm run dev -- --host 127.0.0.1`

Open the app and check:

- Entry page retains the night ritual feel without excessive decoration.
- Today page has a clear primary program card, compact sticky header, readable task and quick actions.
- Diary form controls fit on mobile and have visible focus states.
- Plans recommendation and timeline cards use clean hierarchy and semantic status colors.
- Trends metric values are prominent and insight text is grouped.
- Relaxation timer shows progress and step state clearly.
- Bottom tabs do not clip labels at narrow mobile widths.
- Browser console shows no errors or warnings.

- [ ] **Step 5: Commit implementation**

Commit only the UI files touched by this plan:

```bash
git add src/styles.css src/components/TodayPage.tsx src/components/TrendsPage.tsx src/components/RelaxationPage.tsx
git commit -m "style: refine sleep app visual system"
```
