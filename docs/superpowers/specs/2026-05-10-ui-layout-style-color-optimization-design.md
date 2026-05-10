# UI Layout, Style, and Color Optimization Design

## Context

The app is a React/Vite mobile-first sleep wellness H5 experience. The current visual system already uses a strong night theme: near-black blues, moon-gold accents, serif Chinese headings, rounded cards, soft glow, sticky headers, horizontal scenario cards, and fixed bottom tabs.

The optimization should refine the existing product rather than replace it. The user approved the recommended direction: use a quiet tool-like baseline globally, add a stronger night ritual feeling on entry and relaxation surfaces, and reserve warm health semantics for trends, completion, reminders, and risk states.

## Goals

1. Improve scanability on daily-use pages such as Today, Diary, Plans, Trends, Chat, and My.
2. Make the visual hierarchy calmer and more intentional by reducing repeated glow, left-edge accents, and heavy card styling.
3. Keep the sleep product mood: dark, warm, quiet, and trustworthy.
4. Add clearer semantic colors for completion, warning, and safety risk without turning the app into a generic dashboard.
5. Preserve existing behavior and user flows.

## Non-Goals

- No new product features.
- No copy rewrite beyond small UI labels if required for layout fit.
- No change to storage, AI provider behavior, assessment logic, or program logic.
- No full design-system package or component library extraction.

## Design Direction

### Primary Direction: Quiet Tool

Daily-use pages should feel like a focused health utility:

- Lower contrast between stacked surfaces.
- Cleaner card spacing.
- Stronger section headers and task hierarchy.
- Fewer decorative glows.
- More consistent button and input states.

### Local Accent: Night Ritual

Entry and relaxation pages can keep a more immersive, emotional tone:

- More generous empty space.
- Subtle moon or breathing-like motion.
- Warmer moon-gold emphasis.
- A premium nighttime feel without marketing-page composition.

### Semantic Accent: Warm Health

Trend, completion, skipped, warning, and safety states should use restrained semantic colors:

- Completion: low-saturation green.
- Reminder or skipped state: warm amber.
- Safety/medical risk: muted red.
- Gold remains the primary brand accent, not the only status color.

## Design System

### Color Palette

- Base: `--night-deep`, `--night-mid`, `--night-surface`, `--night-elevated`.
- Text: warm white for primary, translucent warm white for secondary and muted.
- Brand accent: `--moonbeam` and derived translucent variants.
- Semantic success: muted green for completion and positive trends.
- Semantic warning: warm amber for reminders and skipped tasks.
- Semantic risk: existing muted red for high-risk and error states.

All new colors must be expressed as CSS custom properties and reused. Avoid ad hoc inline hues.

### Typography

- Keep `Noto Serif SC` for page titles and important card titles.
- Use a more readable body stack for dense tool surfaces while retaining the current Chinese-friendly tone.
- Body text should stay at 14-16px on mobile with 1.6-1.8 line-height.
- Labels should use clear weight and size instead of excessive letter spacing.

### Spacing

- Base spacing unit: 8px.
- Page gap: 20-28px.
- Card padding: 14-20px depending on density.
- Control height: at least 44px for touch targets.
- Horizontal scroll strips should preserve edge breathing room and avoid clipping the final item.

### Radius

- Small controls: 10-12px.
- Cards: 12-16px.
- Pills and bottom nav indicators: 999px where appropriate.
- Avoid using large rounded cards everywhere.

### Shadow and Elevation

- Replace heavy glow with subtle borders, inset highlights, and one restrained shadow level.
- Reserve stronger elevation for selected bottom tabs, sticky input areas, and primary task cards.
- Entry and relaxation pages may use atmospheric glow sparingly.

### Motion

- Tool surfaces: 150-260ms ease-out transitions.
- Entry/relaxation: 500-700ms slow motion where it supports calmness.
- Respect reduced-motion preferences by disabling long ambient animations.

## Component-Level Changes

### Global CSS Tokens

Add semantic tokens for surface, border, success, warning, and risk states. Normalize card background and border usage so components do not depend on undefined variables such as `--card-bg` or `--card-border`.

### Page Shell

Keep the 640px mobile shell. Improve body background with a quieter layered night surface that works outside the entry page. Ensure every page has enough bottom padding for the fixed tab bar and safe area.

### Bottom Tabs

Keep icon + label. Make active state quieter than the current full gold fill, with a soft gold wash and clear icon emphasis. Add focus-visible and active states.

### Today Page

Make Today the strongest optimized screen:

- Sticky header should read as a compact status bar, not a large hero.
- Program card should become the primary visual anchor.
- Task status and progress should be more legible.
- Quick consultation and relaxation tiles should be compact and consistent.
- Completion/skipped states should use green/amber semantic borders.

### Diary Page

Improve form density and input rhythm:

- Date strip stays horizontal but gets clearer selected and recorded states.
- Tab switcher should feel like a segmented control.
- Form cards should use consistent label, input, focus, and textarea styling.

### Plans Page

Reduce repeated card heaviness:

- Featured recommendations get one clear elevated style.
- Timeline items use semantic status color and cleaner spacing.
- Category accordions should be easier to scan.

### Trends Page

Use semantic health accents:

- Metric cards should show important numbers first.
- Completion and trend data can use muted green/amber.
- Insight text should sit in a readable callout rather than loose paragraphs.

### Chat Page

Keep the conversational layout but improve the header and input:

- Back/reset controls should align cleanly.
- Message bubbles should have clearer sender contrast without excessive glow.
- Input should remain sticky-feeling and comfortable on mobile.

### Entry and Relaxation Pages

Keep the ritual feeling:

- Entry page can retain the moon motif but reduce decorative orbs and improve first-screen composition.
- Relaxation timer should feel calmer and more focused, with breathing-progress treatment and clearer step states.

## Accessibility and Responsiveness

- All interactive controls must have visible hover/focus/active states.
- Touch targets must be at least 44px where practical.
- Apply `text-wrap: pretty` to headings and key text blocks.
- Prevent text overflow in bottom tabs, chips, buttons, and horizontal cards.
- Add `prefers-reduced-motion` handling for long ambient animations.
- Check mobile widths around 360px, 390px, and desktop-width centered shell.

## Implementation Scope

Primary files:

- `src/styles.css`
- Small markup/class adjustments in page components only if CSS alone cannot achieve the layout.

Potential component files:

- `src/components/TodayPage.tsx`
- `src/components/DiaryPage.tsx`
- `src/components/PlansPage.tsx`
- `src/components/TrendsPage.tsx`
- `src/components/ChatPage.tsx`
- `src/components/RelaxationPage.tsx`
- `src/components/EntryPage.tsx`
- `src/components/BottomTabs.tsx`

Avoid modifying domain logic, API code, tests unrelated to class names, or storage behavior.

## Verification

Run:

- `npm run build`
- Relevant unit tests if component markup changes affect existing tests.
- Browser visual check on the local app for entry, Today, Diary, Plans, Trends, Chat, and Relaxation.
- Check browser console for errors and warnings.

Manual visual checklist:

- No undefined CSS custom properties.
- No one-note palette or overuse of gold.
- No text overlap or clipped bottom navigation labels.
- Horizontal scroll strips show the final card cleanly.
- Cards are not visually nested inside heavier cards.
- Motion is calm and disabled under reduced-motion preference.
