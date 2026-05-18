# Plans Page Action Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the `方案` page from three dense content blocks into an action-center layout led by the current highest-priority recommendation.

**Architecture:** Keep all domain and storage logic unchanged. Refactor `src/components/PlansPage.tsx` into small local render units that derive priority recommendation, other recommendations, compact program overview, and collapsed plan library from existing data. Move visual hierarchy from inline styles into semantic CSS classes in `src/styles.css`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, existing CSS custom properties.

---

## File Structure

- Modify `src/components/PlansPage.tsx`: reorganize rendering into local helper components and remove profile-based auto-expansion for plan categories.
- Modify `src/styles.css`: add action-center classes for priority card, compact recommendation rows, program overview, collapsed timeline, and plan library tags.
- Modify `src/components/PlansPage.test.tsx`: add behavior tests for collapsed defaults and expansion flows.

No files are created for new components. Keeping helpers local avoids a premature component split while the page remains one ownership boundary.

---

### Task 1: Add Failing Tests For Action-Center Behavior

**Files:**
- Modify: `src/components/PlansPage.test.tsx`

- [ ] **Step 1: Update the test imports**

Change the imports at the top of `src/components/PlansPage.test.tsx` to include `userEvent`:

```ts
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlansPage } from './PlansPage';
import type { AssessmentResult, SleepDiaryEntry, SleepProfile } from '../domain/types';
```

- [ ] **Step 2: Replace the existing test cases with action-center expectations**

Replace the current `describe('PlansPage', () => { ... })` body with this complete block:

```tsx
describe('PlansPage', () => {
  it('renders a current priority recommendation with visible reasons', () => {
    render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

    expect(screen.getByText('当前优先方案')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '固定起床时间' })).toBeInTheDocument();
    expect(screen.getAllByText(/推荐理由/).length).toBeGreaterThan(0);
    expect(screen.getByText(/今晚先做/)).toBeInTheDocument();
  });

  it('keeps the full 14-day timeline collapsed until requested', async () => {
    const user = userEvent.setup();
    render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

    expect(screen.getByText('14天改善计划')).toBeInTheDocument();
    expect(screen.getByText(/第 1 天 \/ 14 天/)).toBeInTheDocument();
    expect(screen.getByText(/今日任务/)).toBeInTheDocument();
    expect(screen.queryByText(/第14天：第 2 周复盘和下一步/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '查看全部 14 天' }));

    expect(screen.getByText(/第14天：第 2 周复盘和下一步/)).toBeInTheDocument();
    expect(screen.getAllByText('CBT-I').length).toBeGreaterThan(0);
    expect(screen.getAllByText('睡眠卫生').length).toBeGreaterThan(0);
  });

  it('keeps plan library categories collapsed until opened', async () => {
    const user = userEvent.setup();
    render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

    expect(screen.getByText('全部方案')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '咖啡因边界' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /饮食营养/ }));

    expect(screen.getByRole('heading', { name: '咖啡因边界' })).toBeInTheDocument();
  });

  it('shows professional evaluation guidance instead of ordinary timeline actions when care should come first', () => {
    render(
      <PlansPage
        profile={{ ...profile, safetySignals: ['疑似睡眠呼吸暂停'] }}
        assessmentResult={assessmentResult}
      />,
    );

    expect(screen.getAllByText('优先进行专业评估').length).toBeGreaterThan(0);
    expect(screen.getByText('当前优先方案')).toBeInTheDocument();
    expect(screen.queryByText(/第1天：睡眠环境重置/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the targeted tests and verify they fail**

Run:

```bash
npm test -- src/components/PlansPage.test.tsx
```

Expected result: FAIL. The failures should mention missing `当前优先方案`, missing `今晚先做`, or visible day 14 content before expansion.

- [ ] **Step 4: Commit the failing tests**

```bash
git add src/components/PlansPage.test.tsx
git commit -m "test: cover plans action center behavior"
```

---

### Task 2: Refactor PlansPage Into Action-Center Sections

**Files:**
- Modify: `src/components/PlansPage.tsx`
- Test: `src/components/PlansPage.test.tsx`

- [ ] **Step 1: Update type imports**

Change the type imports in `src/components/PlansPage.tsx` to include recommendation and program task types:

```ts
import type { AssessmentResult, PlanRecommendation, ProgramTask, SleepPlan, SleepPlanCategory } from '../domain/types';
import type { SleepProfile } from '../domain/types';
```

- [ ] **Step 2: Add local view-model helpers above `PlansPage`**

Add this block after `groupPlansByCategory`:

```tsx
interface RecommendedPlanView {
  recommendation: PlanRecommendation;
  plan: SleepPlan;
}

function resolveRecommendedPlans(recommendations: PlanRecommendation[]): RecommendedPlanView[] {
  return recommendations.flatMap((recommendation) => {
    const plan = sleepPlans.find((item) => item.id === recommendation.planId);
    return plan ? [{ recommendation, plan }] : [];
  });
}

function summarizeReasons(reasons: string[]): string {
  return reasons.join('；');
}

function previewSteps(steps: string[]): string[] {
  return steps.slice(0, 2);
}

function representativeTags(plans: SleepPlan[]): string[] {
  return Array.from(new Set(plans.flatMap((plan) => plan.tags))).slice(0, 3);
}

function nextUpcomingTask(tasks: Array<ProgramTask & { status: string }>, currentDay: number) {
  return tasks.find((task) => task.day > currentDay && task.status === 'locked')
    ?? tasks.find((task) => task.day > currentDay);
}
```

- [ ] **Step 3: Add local render components above `PlansPage`**

Add this block after the helpers from Step 2:

```tsx
function PlanStepList({ steps }: { steps: string[] }) {
  return (
    <ol className="plan-step-list">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

function PriorityPlanCard({
  item,
  expanded,
  onToggle,
}: {
  item: RecommendedPlanView | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!item) {
    return (
      <article className="priority-plan-card">
        <h3>先完善睡眠信息</h3>
        <p>完成画像和评估后，系统会把最适合当前状态的方案放在这里。</p>
      </article>
    );
  }

  const { plan, recommendation } = item;
  const stepsPreview = previewSteps(plan.steps);

  return (
    <article className="priority-plan-card">
      <div className="priority-plan-heading">
        <span className="section-kicker">当前最值得优先处理</span>
        <h3>{plan.title}</h3>
        <p>{plan.summary}</p>
      </div>

      <div className="plan-reason-block">
        <span>推荐理由：</span>
        <p>{summarizeReasons(recommendation.reasons)}</p>
      </div>

      {recommendation.safetyNote && (
        <p className="plan-safety-note">{recommendation.safetyNote}</p>
      )}

      {stepsPreview.length > 0 && (
        <div className="plan-action-preview">
          <span>今晚先做</span>
          <PlanStepList steps={expanded ? plan.steps : stepsPreview} />
        </div>
      )}

      {plan.steps.length > stepsPreview.length && (
        <button
          type="button"
          className="collapse-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {expanded ? '收起完整步骤' : '查看完整步骤'}
        </button>
      )}
    </article>
  );
}

function CompactRecommendationList({
  items,
  expandedPlans,
  onToggle,
}: {
  items: RecommendedPlanView[];
  expandedPlans: Set<string>;
  onToggle: (planId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="section-header">
        <h2>其他推荐</h2>
        <span className="section-count">{items.length} 个</span>
      </div>
      <div className="compact-plan-list">
        {items.map(({ recommendation, plan }) => {
          const isExpanded = expandedPlans.has(plan.id);
          return (
            <article key={plan.id} className="compact-plan-card">
              <div>
                <h3>{plan.title}</h3>
                <p>{plan.summary}</p>
              </div>
              <p className="compact-reason">推荐理由：{summarizeReasons(recommendation.reasons)}</p>
              {recommendation.safetyNote && (
                <p className="plan-safety-note">{recommendation.safetyNote}</p>
              )}
              {plan.steps.length > 0 && (
                <button
                  type="button"
                  className="collapse-toggle"
                  onClick={() => onToggle(plan.id)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? '收起步骤' : '展开步骤'}
                </button>
              )}
              {isExpanded && <PlanStepList steps={plan.steps} />}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProgramOverview({
  programState,
  expanded,
  onToggle,
}: {
  programState: ReturnType<typeof resolveProgramState>;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (programState.program.status === 'needs_care') {
    return (
      <section>
        <div className="section-header">
          <h2>14天改善计划</h2>
        </div>
        <article className="program-overview-card high-risk">
          <h3>优先进行专业评估</h3>
          <p>当前存在需要先排查的安全信号。建议先记录症状、准备问题，并咨询医生或睡眠门诊。</p>
          {programState.safetyReasons.length > 0 && (
            <p className="fine-print">原因：{programState.safetyReasons.join('；')}</p>
          )}
        </article>
      </section>
    );
  }

  const todayTask = programState.tasks.find((task) => task.day === programState.program.currentDay);
  const nextTask = nextUpcomingTask(programState.tasks, programState.program.currentDay);

  return (
    <section>
      <div className="section-header">
        <h2>14天改善计划</h2>
        <span className="section-count">第 {programState.program.currentDay} 天 / 14 天</span>
      </div>
      <article className="program-overview-card">
        <div className="program-summary-row">
          <div>
            <span className="section-kicker">当前进度</span>
            <h3>第 {programState.program.currentDay} 天 / 14 天</h3>
          </div>
          <p>{programState.stats.completionRate}% 完成率</p>
        </div>

        <div className="program-preview-list">
          {todayTask && (
            <div className="program-preview-item today">
              <span>今日任务</span>
              <h4>第{todayTask.day}天：{todayTask.title}</h4>
              <p>{todayTask.action}</p>
            </div>
          )}
          {nextTask && (
            <div className="program-preview-item">
              <span>下一步</span>
              <h4>第{nextTask.day}天：{nextTask.title}</h4>
              <p>{nextTask.rationale}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          className="collapse-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {expanded ? '收起 14 天计划' : '查看全部 14 天'}
        </button>

        {expanded && (
          <div className="program-timeline">
            {programState.tasks.map((item) => (
              <article key={item.day} className={`timeline-item ${item.status}`}>
                <div className="program-task-meta">
                  <span className="evidence-label">{item.evidenceLabel}</span>
                  <span className="task-status-label">{item.status}</span>
                </div>
                <h4>第{item.day}天：{item.title}</h4>
                <p>{item.rationale}</p>
                <p><strong>动作：</strong>{item.action}</p>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function PlanLibraryAccordion({
  grouped,
  expandedCategories,
  onToggle,
}: {
  grouped: ReturnType<typeof groupPlansByCategory>;
  expandedCategories: Set<SleepPlanCategory>;
  onToggle: (category: SleepPlanCategory) => void;
}) {
  return (
    <section>
      <div className="section-header">
        <h2>全部方案</h2>
        <span className="section-count">{grouped.reduce((sum, group) => sum + group.plans.length, 0)} 个</span>
      </div>
      <div className="plan-library-list">
        {grouped.map(({ category, label, plans }) => {
          const isExpanded = expandedCategories.has(category);
          return (
            <div key={category} className="category-group">
              <button
                type="button"
                className="category-header"
                onClick={() => onToggle(category)}
                aria-expanded={isExpanded}
              >
                <div>
                  <h3>{label}</h3>
                  <span className="category-count">{plans.length} 个方案</span>
                  <div className="category-tag-preview">
                    {representativeTags(plans).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <span className="chevron">▼</span>
              </button>
              {isExpanded && (
                <div className="category-body">
                  {plans.map((plan) => (
                    <div key={plan.id} className="plan-card-plain">
                      <h4>{plan.title}</h4>
                      <p>{plan.summary}</p>
                      {plan.tags.length > 0 && (
                        <div className="card-tags">
                          {plan.tags.map((tag) => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Replace PlansPage state setup**

Inside `PlansPage`, keep diary, recommendation, program, and grouping logic, then use these state values:

```tsx
const recommendedPlans = resolveRecommendedPlans(recommendations);
const priorityRecommendation = recommendedPlans[0] ?? null;
const otherRecommendations = recommendedPlans.slice(1);
const [expandedCategories, setExpandedCategories] = useState<Set<SleepPlanCategory>>(new Set());
const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
const [isPriorityExpanded, setIsPriorityExpanded] = useState(false);
const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
```

Remove the `shouldAutoExpand` function and the `useState(() => { ... setExpandedCategories(...) })` block. Categories now start collapsed.

- [ ] **Step 5: Replace the return markup**

Replace the body returned from `PlansPage` with this structure:

```tsx
return (
  <main className="page plans-page-refined page-enter">
    <h1>助眠方案</h1>

    <section>
      <div className="section-header">
        <h2>当前优先方案</h2>
        <span className="section-count">{recommendations.length} 个推荐</span>
      </div>
      <PriorityPlanCard
        item={priorityRecommendation}
        expanded={isPriorityExpanded}
        onToggle={() => setIsPriorityExpanded((value) => !value)}
      />
    </section>

    <CompactRecommendationList
      items={otherRecommendations}
      expandedPlans={expandedPlans}
      onToggle={togglePlan}
    />

    <ProgramOverview
      programState={programState}
      expanded={isTimelineExpanded}
      onToggle={() => setIsTimelineExpanded((value) => !value)}
    />

    <PlanLibraryAccordion
      grouped={grouped}
      expandedCategories={expandedCategories}
      onToggle={toggleCategory}
    />
  </main>
);
```

- [ ] **Step 6: Run targeted tests**

Run:

```bash
npm test -- src/components/PlansPage.test.tsx
```

Expected result: PASS or only CSS-independent accessibility/name failures. Fix any failures in `PlansPage.tsx` before moving on.

- [ ] **Step 7: Commit the component refactor**

```bash
git add src/components/PlansPage.tsx src/components/PlansPage.test.tsx
git commit -m "feat: refactor plans page into action center"
```

---

### Task 3: Add Action-Center Styling

**Files:**
- Modify: `src/styles.css`
- Test: `src/components/PlansPage.test.tsx`

- [ ] **Step 1: Add CSS classes near the existing Plans page styles**

In `src/styles.css`, add these classes near the `/* ─── Plans page refined ─── */` section:

```css
.priority-plan-card,
.program-overview-card {
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(145deg, rgba(19, 21, 37, 0.96), rgba(22, 28, 42, 0.92)),
    radial-gradient(circle at 90% 0%, rgba(201, 184, 122, 0.10), transparent 38%);
  box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.program-overview-card.high-risk {
  border-color: var(--high-risk-border);
  background: var(--high-risk-bg);
}

.priority-plan-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.priority-plan-heading h3,
.program-overview-card h3 {
  margin: 0;
  color: var(--mist);
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  line-height: 1.35;
}

.priority-plan-heading p,
.program-overview-card p,
.compact-plan-card p,
.program-preview-item p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.section-kicker {
  color: var(--moonbeam);
  font-size: 12px;
  font-weight: 700;
}

.plan-reason-block,
.plan-action-preview {
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.035);
  padding: 12px;
}

.plan-reason-block span,
.plan-action-preview > span,
.program-preview-item span {
  display: block;
  margin-bottom: 6px;
  color: var(--moonbeam);
  font-size: 12px;
  font-weight: 700;
}

.plan-step-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.75;
}

.plan-safety-note {
  border: 1px solid var(--high-risk-border);
  border-radius: var(--radius-sm);
  background: var(--high-risk-bg);
  color: var(--high-risk-text);
  padding: 9px 10px;
  font-size: 12px;
}

.compact-plan-list,
.plan-library-list,
.category-body,
.program-preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compact-plan-card {
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.035);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compact-plan-card h3 {
  margin: 0 0 4px;
  color: var(--text-primary);
  font-size: 15px;
}

.compact-reason {
  font-size: 13px;
}

.program-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.program-summary-row > p {
  flex: 0 0 auto;
  color: var(--moonbeam);
  font-weight: 700;
}

.program-preview-item {
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.035);
  padding: 12px;
}

.program-preview-item.today {
  border-color: var(--card-border-strong);
  background: rgba(201, 184, 122, 0.08);
}

.program-preview-item h4,
.program-timeline .timeline-item h4 {
  margin: 0 0 6px;
  color: var(--text-primary);
  font-size: 14px;
}

.category-header {
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.category-tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.category-body {
  padding-top: 10px;
}
```

- [ ] **Step 2: Remove obsolete decorative plan-card behavior**

In `src/styles.css`, delete or neutralize the old `.plan-card-featured::before` display behavior for the plans page by keeping the existing later rule:

```css
.highlight-card::before,
.plan-card-featured::before,
.scenario-card::before {
  display: none;
}
```

Do not add new left-edge decoration for `.priority-plan-card`.

- [ ] **Step 3: Run targeted tests**

Run:

```bash
npm test -- src/components/PlansPage.test.tsx
```

Expected result: PASS.

- [ ] **Step 4: Commit the styling**

```bash
git add src/styles.css src/components/PlansPage.test.tsx
git commit -m "style: simplify plans action center hierarchy"
```

---

### Task 4: Final Verification

**Files:**
- Verify: `src/components/PlansPage.tsx`
- Verify: `src/styles.css`
- Verify: `src/components/PlansPage.test.tsx`

- [ ] **Step 1: Run the targeted component test**

```bash
npm test -- src/components/PlansPage.test.tsx
```

Expected result: PASS with all `PlansPage` tests passing.

- [ ] **Step 2: Run the production build**

```bash
npm run build
```

Expected result: TypeScript and Vite build complete without errors.

- [ ] **Step 3: Check changed files**

```bash
git status --short
```

Expected result: no uncommitted changes, or only intentionally uncommitted files that the executor clearly reports.

- [ ] **Step 4: Manual browser check**

Start the app:

```bash
npm run dev
```

Open the local Vite URL and check the `方案` tab:

- First screen shows `当前优先方案`.
- `14天改善计划` shows current progress and does not show all 14 tasks before expansion.
- Clicking `查看全部 14 天` reveals day 14.
- `全部方案` categories are collapsed before interaction.
- Opening `饮食营养` reveals `咖啡因边界`.
- No text overlaps on a 390px-wide mobile viewport.

Stop the dev server after the visual check.

- [ ] **Step 5: Final implementation commit if needed**

If Task 4 revealed a small verification fix, commit it:

```bash
git add src/components/PlansPage.tsx src/styles.css src/components/PlansPage.test.tsx
git commit -m "fix: polish plans action center verification"
```

If no files changed during Task 4, skip this commit.

---

## Self-Review Notes

- Spec coverage: priority recommendation, other recommendations, compact 14-day overview, collapsed full timeline, collapsed plan library, care-first behavior, accessibility, and CSS cleanup are covered by Tasks 1-4.
- Domain logic remains unchanged: the plan only modifies `PlansPage.tsx`, `src/styles.css`, and `PlansPage.test.tsx`.
- Test-first flow is explicit: Task 1 creates failing behavior tests before implementation.
- Type names used in the plan match existing exported types: `PlanRecommendation`, `ProgramTask`, `SleepPlan`, and `SleepPlanCategory`.
