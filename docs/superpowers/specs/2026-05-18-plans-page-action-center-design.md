# Plans Page Action Center Design

## Context

The current `方案` page contains three large content areas:

- `推荐方案`
- `14天改善计划`
- `全部方案`

Each area can contain many cards or task entries. The content is useful, but the page reads like a dense library because recommendations, the full 14-day timeline, and the full plan catalog compete for attention at the same level.

The approved direction is to make the page an action center. The first screen should answer one question:

> What should the user prioritize now?

The full plan library and full 14-day timeline remain available, but they become progressive detail rather than default page weight.

## Goals

1. Improve readability and scanability on the `方案` page.
2. Make the highest-priority recommendation the first-screen focus.
3. Keep the 14-day plan and all plan categories available without showing every detail by default.
4. Preserve existing domain logic, storage behavior, safety gating, and recommendation rules.
5. Reduce inline styling in `PlansPage.tsx` by moving display concerns into semantic CSS classes.

## Non-Goals

- No changes to `recommendSleepPlans`, `createSleepProgram`, or `resolveProgramState`.
- No new plan content or medical/safety rules.
- No new navigation tab or separate page.
- No account, cloud sync, push notification, or AI behavior change.
- No broad visual redesign outside the `方案` page.

## Information Architecture

### Current Priority

The top section becomes `当前优先方案`.

It uses `recommendations[0]` as the primary card. The card shows:

- Plan title.
- Plan summary.
- Recommendation reasons.
- Safety note when present.
- A short action preview based on the first one or two plan steps.
- A toggle to reveal the full step list when steps exist.

When safety rules produce a care-first recommendation, this card becomes the main safety guidance surface. It should clearly show `优先进行专业评估`, the safety note, and practical preparation steps.

### Other Recommendations

The remaining recommendations use `recommendations.slice(1)`.

They appear as compact rows or lightweight cards under `其他推荐`. Each item shows:

- Title.
- One-line summary.
- Condensed reason text.
- Optional step expansion.

These items should not use the same visual weight as the priority card.

### 14-Day Program

The `14天改善计划` section becomes a compact overview by default.

For active programs, it shows:

- Current day, such as `第 3 天 / 14 天`.
- Completion summary from `programState.stats`.
- Today's task.
- The next upcoming task when available.
- A toggle labeled like `查看全部 14 天`.

The full timeline remains available inside the collapsed area. Evidence labels and task status are preserved.

For `needs_care`, this section should not show ordinary behavioral tasks as the main content. It should show the existing professional evaluation guidance and any safety reasons.

### Plan Library

The `全部方案` section becomes a secondary lookup area.

All categories are collapsed by default. Each category header shows:

- Category label.
- Plan count.
- Representative tags from plans in the category, limited to a small number.
- Chevron or equivalent affordance.

Opening a category reveals the existing plain plan cards. The implementation should remove the current profile-based auto-expansion behavior so the library starts as a directory, not another dense content block.

## Interaction Design

Use progressive disclosure throughout the page:

- The priority card shows only essential details until expanded.
- Other recommendations reveal steps only on demand.
- The 14-day timeline is collapsed by default.
- Plan categories are collapsed by default.

Each toggle must use a native `button` where possible and expose `aria-expanded`. Category headers should remain keyboard accessible.

The page should avoid hiding critical safety content. Safety notes and care-first guidance remain visible without requiring expansion.

## Visual Design

The page should follow the existing quiet night-themed design system, but reduce repeated card heaviness.

### Priority Card

The priority card is the strongest surface on the page. It should use:

- Clear title hierarchy.
- A concise reason block.
- A distinct action preview block.
- A restrained elevated background.

Remove the old decorative left-edge line from plan cards and rely on spacing, labels, borders, and typography for hierarchy.

### Compact Recommendation Items

Other recommendations should be visibly secondary:

- Smaller padding than the priority card.
- Lower contrast background.
- Clear title and reason summary.
- Optional expansion area for steps.

### Program Overview

The program overview should read as a status summary, not a full timeline:

- Current day and completion metrics at the top.
- Today and next task as compact preview rows.
- Full timeline inside a collapsed container.

Task statuses keep semantic treatment:

- `today`: brand accent border.
- `completed`: success border/background.
- `skipped`: warning border/background.
- `locked`: muted border/background.

### Plan Library

Category headers should feel like a table of contents:

- Strong category name.
- Small count text.
- Representative tags with muted styling.
- Stable chevron position.

Expanded plan cards stay plain and compact.

## Component Structure

Keep component ownership local to `PlansPage.tsx` unless the implementation becomes too large.

Suggested render units:

- `PriorityPlanCard`
- `CompactRecommendationList`
- `ProgramOverview`
- `PlanLibraryAccordion`

These can be local functions in `PlansPage.tsx` for the first implementation. Extracting separate files is only needed if the page becomes hard to scan after the change.

## Data Flow

Existing data sources stay unchanged:

- `recommendations[0]` feeds `当前优先方案`.
- `recommendations.slice(1)` feeds `其他推荐`.
- `programState.program`, `programState.tasks`, and `programState.stats` feed the 14-day overview and expandable timeline.
- Grouped `sleepPlans` feed the plan library.

The page still creates and saves a local sleep program when none exists.

## Error Handling and Edge Cases

- If `recommendations[0]` references a missing plan, skip it and use the first recommendation that resolves to a plan.
- If no recommendations resolve to plans, show a conservative empty state directing the user to complete profile or assessment data.
- If there is no next upcoming task, show only today's task and the completion summary.
- If the program status is `needs_care`, visible safety guidance takes precedence over ordinary program actions.
- If a category has no plans after filtering, do not render that category.

## Accessibility

- Use buttons for all expand/collapse controls.
- Set `aria-expanded` on toggles.
- Preserve keyboard access for category expansion.
- Keep touch targets near or above 44px where practical.
- Avoid text overflow in compact recommendation rows, category headers, tags, and toggles.

## Implementation Scope

Primary files:

- `src/components/PlansPage.tsx`
- `src/styles.css`
- `src/components/PlansPage.test.tsx`

Do not modify domain logic, API code, storage logic, or unrelated page styles.

The current worktree may contain unrelated edits in shared files. Implementation should preserve any user changes and avoid broad rewrites.

## Verification

Run:

- `npm run build`
- `npm test -- src/components/PlansPage.test.tsx` or the closest supported targeted Vitest command

Update or add tests to verify:

- The priority section renders the highest-priority recommendation.
- Recommendation reasons remain visible.
- The full 14-day timeline is not fully expanded by default.
- Expanding the 14-day timeline reveals day 14.
- Plan categories are collapsed by default.
- Expanding a category reveals its plan cards.
- Care-first users see professional evaluation guidance and do not see ordinary timeline actions as default content.

Manual visual check:

- First screen has one clear priority.
- 14-day plan no longer overwhelms the page by default.
- Plan library reads as a directory.
- No overlapping text or clipped controls on narrow mobile widths.
- The page still matches the existing dark sleep wellness visual system.
