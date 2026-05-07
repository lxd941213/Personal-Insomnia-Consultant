# Sleep Wellness H5 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first H5 MVP where users create a local sleep profile, chat with an AI sleep consultant, receive safety-triaged structured advice, and mark responses useful or not useful.

**Architecture:** Use a Vite React TypeScript frontend with local browser persistence and a thin Vercel-style serverless endpoint at `api/chat.ts`. Keep health profile data out of server-side storage; the API validates requests, applies safety guardrails, calls a configurable AI provider, and returns normalized JSON.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, Playwright, Vercel serverless function shape, OpenAI-compatible AI API configured by environment variables.

---

## Scope Check

This plan implements one subsystem: the H5 MVP described in `docs/superpowers/specs/2026-05-07-sleep-wellness-h5-mvp-design.md`. It intentionally excludes accounts, database storage, clinical assessments, sleep diary, trend charts, reminders, payments, affiliate links, and medical referral monetization.

## Target File Structure

- Create: `package.json` - scripts and dependencies.
- Create: `index.html` - Vite app shell.
- Create: `vite.config.ts` - Vite and Vitest config.
- Create: `tsconfig.json`, `tsconfig.node.json` - TypeScript config.
- Create: `playwright.config.ts` - mobile and desktop browser test config.
- Create: `.env.example` - required AI provider environment variables.
- Create: `src/main.tsx` - React entry.
- Create: `src/App.tsx` - route-level app state and page switching.
- Create: `src/styles.css` - mobile-first UI styling.
- Create: `src/domain/types.ts` - profile, chat, feedback, and AI response types.
- Create: `src/domain/profileQuestions.ts` - profile wizard question definitions.
- Create: `src/domain/safety.ts` - deterministic high-risk keyword screening and fallback notices.
- Create: `src/domain/aiResponse.ts` - response normalization and validation.
- Create: `src/storage/localStore.ts` - localStorage wrapper with in-memory fallback.
- Create: `src/api/chatClient.ts` - frontend `POST /api/chat` client.
- Create: `src/components/EntryPage.tsx` - value proposition and disclaimer.
- Create: `src/components/ProfileWizard.tsx` - profile setup flow.
- Create: `src/components/ChatPage.tsx` - chat page container.
- Create: `src/components/MessageList.tsx` - message rendering.
- Create: `src/components/AiResponseCard.tsx` - structured AI answer rendering.
- Create: `src/components/SafetyNotice.tsx` - high-risk and disclaimer display.
- Create: `src/components/FeedbackControl.tsx` - useful/not useful controls.
- Create: `api/chat.ts` - serverless AI proxy endpoint.
- Create: `api/prompt.ts` - sleep advisor prompt assembly.
- Create: `api/provider.ts` - AI provider call wrapper.
- Create: `api/response.ts` - server response helpers.
- Create: tests next to modules as `*.test.ts` or `*.test.tsx`.
- Create: `e2e/mvp.spec.ts` - Playwright acceptance tests.

---

### Task 1: Scaffold Vite React TypeScript App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create the Vite project skeleton**

Run:

```bash
npm create vite@latest . -- --template react-ts
```

Expected: Vite creates `package.json`, `index.html`, `src/`, `tsconfig*.json`, and `vite.config.ts`.

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```bash
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom playwright @playwright/test @vercel/node
```

Expected: dependencies install without errors and `package-lock.json` is created.

- [ ] **Step 3: Replace `package.json` scripts**

Edit `package.json` so the scripts block is:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

Keep the dependency versions installed by npm.

- [ ] **Step 4: Configure Vitest in `vite.config.ts`**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 5: Create test setup**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Create `.env.example`**

Create `.env.example`:

```bash
AI_BASE_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=replace-with-provider-key
AI_MODEL=gpt-4o-mini
```

- [ ] **Step 7: Verify scaffold**

Run:

```bash
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 8: Commit scaffold**

Run:

```bash
git add .gitignore package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src .env.example
git commit -m "chore: scaffold h5 sleep wellness app"
```

Expected: commit succeeds.

---

### Task 2: Define Domain Types, Profile Questions, And AI Response Validation

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/profileQuestions.ts`
- Create: `src/domain/safety.ts`
- Create: `src/domain/aiResponse.ts`
- Test: `src/domain/aiResponse.test.ts`
- Test: `src/domain/safety.test.ts`

- [ ] **Step 1: Write failing AI response validation tests**

Create `src/domain/aiResponse.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeAiResponse } from './aiResponse';

describe('normalizeAiResponse', () => {
  it('keeps a valid normal response', () => {
    const response = normalizeAiResponse({
      riskLevel: 'normal',
      summary: 'You have a delayed schedule and stress-related difficulty falling asleep.',
      possibleFactors: ['Late phone use', 'Work stress'],
      suggestions: [{ title: 'Move phone cutoff earlier', detail: 'Stop screen use 30 minutes before bed tonight.' }],
      nextQuestions: ['How long does it usually take you to fall asleep?'],
      seekCareNotice: null,
      disclaimer: 'For health management reference only, not medical diagnosis.',
    });

    expect(response.riskLevel).toBe('normal');
    expect(response.suggestions[0].title).toBe('Move phone cutoff earlier');
  });

  it('adds a care notice for high risk responses', () => {
    const response = normalizeAiResponse({
      riskLevel: 'high_risk',
      summary: 'This may need professional support.',
      possibleFactors: [],
      suggestions: [],
      nextQuestions: [],
      seekCareNotice: '',
      disclaimer: '',
    });

    expect(response.seekCareNotice).toContain('professional');
    expect(response.disclaimer).toContain('not medical diagnosis');
  });

  it('returns a safe fallback for invalid payloads', () => {
    const response = normalizeAiResponse({ riskLevel: 'normal' });

    expect(response.riskLevel).toBe('high_risk');
    expect(response.summary).toContain('unable to generate');
    expect(response.seekCareNotice).toContain('professional');
  });
});
```

- [ ] **Step 2: Write failing safety screening tests**

Create `src/domain/safety.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { detectHighRiskSignal } from './safety';

describe('detectHighRiskSignal', () => {
  it('flags self-harm language', () => {
    expect(detectHighRiskSignal('I cannot sleep and I want to hurt myself')).toBe(true);
  });

  it('flags suspected sleep apnea language', () => {
    expect(detectHighRiskSignal('I wake up gasping and my partner says I stop breathing')).toBe(true);
  });

  it('does not flag ordinary sleep trouble', () => {
    expect(detectHighRiskSignal('I scroll my phone until 1am and need help sleeping earlier')).toBe(false);
  });
});
```

- [ ] **Step 3: Run domain tests and confirm failure**

Run:

```bash
npm test -- src/domain/aiResponse.test.ts src/domain/safety.test.ts
```

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 4: Create domain types**

Create `src/domain/types.ts`:

```ts
export type RiskLevel = 'normal' | 'high_risk';

export type MainConcern =
  | 'hard_to_fall_asleep'
  | 'early_waking'
  | 'frequent_waking'
  | 'vivid_dreams'
  | 'daytime_sleepiness'
  | 'late_night_habit'
  | 'other';

export interface SleepProfile {
  ageRange: string;
  bedtime: string;
  wakeTime: string;
  mainConcern: MainConcern;
  concernDuration: string;
  stressLevel: string;
  habits: string[];
  daytimeImpact: string;
  safetySignals: string[];
  optionalContext: string;
}

export interface Suggestion {
  title: string;
  detail: string;
}

export interface AiResponse {
  riskLevel: RiskLevel;
  summary: string;
  possibleFactors: string[];
  suggestions: Suggestion[];
  nextQuestions: string[];
  seekCareNotice: string | null;
  disclaimer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AiResponse;
  createdAt: string;
}

export interface FeedbackEvent {
  messageId: string;
  value: 'useful' | 'not_useful';
  createdAt: string;
}
```

- [ ] **Step 5: Create profile question definitions**

Create `src/domain/profileQuestions.ts`:

```ts
export const profileQuestions = [
  {
    key: 'ageRange',
    label: 'Your age range',
    options: ['Under 18', '18-24', '25-34', '35-44', '45-59', '60+'],
  },
  {
    key: 'mainConcern',
    label: 'Main sleep concern',
    options: [
      'Hard to fall asleep',
      'Waking too early',
      'Waking often',
      'Vivid dreams',
      'Daytime sleepiness',
      'Late-night habit',
      'Other',
    ],
  },
  {
    key: 'concernDuration',
    label: 'How long has this been happening?',
    options: ['Less than 1 week', '1-4 weeks', '1-3 months', 'More than 3 months'],
  },
  {
    key: 'stressLevel',
    label: 'Current stress level',
    options: ['Low', 'Medium', 'High', 'Very high'],
  },
] as const;
```

- [ ] **Step 6: Create deterministic safety screening**

Create `src/domain/safety.ts`:

```ts
const highRiskPatterns = [
  /hurt myself/i,
  /kill myself/i,
  /suicide/i,
  /self[- ]?harm/i,
  /stop breathing/i,
  /gasping/i,
  /chest pain/i,
  /pregnant/i,
  /postpartum/i,
  /sleeping pills every night/i,
  /cannot function/i,
];

export const defaultCareNotice =
  'Your message includes signs that may need professional support. Please consider contacting a licensed clinician or mental health professional promptly. If you may harm yourself or someone else, contact emergency services now.';

export const defaultDisclaimer =
  'This is for health management reference only and is not medical diagnosis.';

export function detectHighRiskSignal(text: string): boolean {
  return highRiskPatterns.some((pattern) => pattern.test(text));
}
```

- [ ] **Step 7: Create AI response normalization**

Create `src/domain/aiResponse.ts`:

```ts
import type { AiResponse, Suggestion } from './types';
import { defaultCareNotice, defaultDisclaimer } from './safety';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSuggestionArray(value: unknown): value is Suggestion[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Suggestion).title === 'string' &&
        typeof (item as Suggestion).detail === 'string',
    )
  );
}

export function safeFallbackResponse(): AiResponse {
  return {
    riskLevel: 'high_risk',
    summary: 'We were unable to generate a reliable personalized response.',
    possibleFactors: [],
    suggestions: [],
    nextQuestions: [],
    seekCareNotice: defaultCareNotice,
    disclaimer: defaultDisclaimer,
  };
}

export function normalizeAiResponse(payload: unknown): AiResponse {
  if (!payload || typeof payload !== 'object') {
    return safeFallbackResponse();
  }

  const input = payload as Partial<AiResponse>;
  if (
    (input.riskLevel !== 'normal' && input.riskLevel !== 'high_risk') ||
    typeof input.summary !== 'string' ||
    !isStringArray(input.possibleFactors) ||
    !isSuggestionArray(input.suggestions) ||
    !isStringArray(input.nextQuestions)
  ) {
    return safeFallbackResponse();
  }

  return {
    riskLevel: input.riskLevel,
    summary: input.summary,
    possibleFactors: input.possibleFactors,
    suggestions: input.suggestions,
    nextQuestions: input.nextQuestions,
    seekCareNotice: input.riskLevel === 'high_risk' ? input.seekCareNotice || defaultCareNotice : input.seekCareNotice ?? null,
    disclaimer: input.disclaimer || defaultDisclaimer,
  };
}
```

- [ ] **Step 8: Run tests and commit**

Run:

```bash
npm test -- src/domain/aiResponse.test.ts src/domain/safety.test.ts
git add src/domain
git commit -m "feat: define sleep consultation domain"
```

Expected: tests pass and commit succeeds.

---

### Task 3: Implement Local Browser Persistence

**Files:**
- Create: `src/storage/localStore.ts`
- Test: `src/storage/localStore.test.ts`

- [ ] **Step 1: Write failing local storage tests**

Create `src/storage/localStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllLocalData, getChatHistory, getFeedbackEvents, getSleepProfile, saveChatHistory, saveFeedbackEvents, saveSleepProfile } from './localStore';
import type { SleepProfile } from '../domain/types';

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'High',
  habits: ['Phone use before bed'],
  daytimeImpact: 'Tired at work',
  safetySignals: [],
  optionalContext: 'Mind keeps racing.',
};

describe('localStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and reads a sleep profile', () => {
    saveSleepProfile(profile);
    expect(getSleepProfile()).toEqual(profile);
  });

  it('saves chat history and feedback events', () => {
    saveChatHistory([{ id: 'm1', role: 'user', content: 'Help me sleep', createdAt: '2026-05-07T00:00:00.000Z' }]);
    saveFeedbackEvents([{ messageId: 'm2', value: 'useful', createdAt: '2026-05-07T00:01:00.000Z' }]);

    expect(getChatHistory()).toHaveLength(1);
    expect(getFeedbackEvents()[0].value).toBe('useful');
  });

  it('clears all MVP data', () => {
    saveSleepProfile(profile);
    clearAllLocalData();
    expect(getSleepProfile()).toBeNull();
    expect(getChatHistory()).toEqual([]);
    expect(getFeedbackEvents()).toEqual([]);
  });

  it('falls back to memory when localStorage is unavailable', () => {
    const original = window.localStorage.setItem;
    Object.defineProperty(window.localStorage, 'setItem', {
      value: () => {
        throw new Error('storage unavailable');
      },
      configurable: true,
    });

    saveSleepProfile(profile);
    expect(getSleepProfile()).toEqual(profile);

    Object.defineProperty(window.localStorage, 'setItem', { value: original, configurable: true });
  });
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
npm test -- src/storage/localStore.test.ts
```

Expected: FAIL because `localStore.ts` does not exist.

- [ ] **Step 3: Implement local storage wrapper**

Create `src/storage/localStore.ts`:

```ts
import type { ChatMessage, FeedbackEvent, SleepProfile } from '../domain/types';

const keys = {
  profile: 'sleepProfile',
  chatHistory: 'chatHistory',
  feedbackEvents: 'feedbackEvents',
} as const;

const memoryStore = new Map<string, string>();

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key) ?? memoryStore.get(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    const value = memoryStore.get(key);
    return value ? (JSON.parse(value) as T) : fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  memoryStore.set(key, serialized);
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    return;
  }
}

function removeKey(key: string): void {
  memoryStore.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

export function getSleepProfile(): SleepProfile | null {
  return readJson<SleepProfile | null>(keys.profile, null);
}

export function saveSleepProfile(profile: SleepProfile): void {
  writeJson(keys.profile, profile);
}

export function getChatHistory(): ChatMessage[] {
  return readJson<ChatMessage[]>(keys.chatHistory, []);
}

export function saveChatHistory(messages: ChatMessage[]): void {
  writeJson(keys.chatHistory, messages);
}

export function getFeedbackEvents(): FeedbackEvent[] {
  return readJson<FeedbackEvent[]>(keys.feedbackEvents, []);
}

export function saveFeedbackEvents(events: FeedbackEvent[]): void {
  writeJson(keys.feedbackEvents, events);
}

export function clearAllLocalData(): void {
  removeKey(keys.profile);
  removeKey(keys.chatHistory);
  removeKey(keys.feedbackEvents);
}
```

- [ ] **Step 4: Run tests and commit**

Run:

```bash
npm test -- src/storage/localStore.test.ts
git add src/storage
git commit -m "feat: persist sleep consultation locally"
```

Expected: tests pass and commit succeeds.

---

### Task 4: Build Entry Page And Profile Wizard

**Files:**
- Create: `src/components/EntryPage.tsx`
- Create: `src/components/ProfileWizard.tsx`
- Test: `src/components/ProfileWizard.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing profile wizard test**

Create `src/components/ProfileWizard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileWizard } from './ProfileWizard';

describe('ProfileWizard', () => {
  it('collects required profile fields, habits, and safety signals', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ProfileWizard onComplete={onComplete} />);

    await user.selectOptions(screen.getByLabelText('Age range'), '25-34');
    await user.type(screen.getByLabelText('Usual bedtime'), '01:00');
    await user.type(screen.getByLabelText('Usual wake time'), '08:00');
    await user.selectOptions(screen.getByLabelText('Main sleep concern'), 'hard_to_fall_asleep');
    await user.selectOptions(screen.getByLabelText('Concern duration'), '1-3 months');
    await user.selectOptions(screen.getByLabelText('Stress level'), 'High');
    await user.click(screen.getByLabelText('Phone use before bed'));
    await user.click(screen.getByLabelText('Suspected sleep apnea'));
    await user.type(screen.getByLabelText('Daytime impact'), 'Tired at work');
    await user.type(screen.getByLabelText('Optional context'), 'I use my phone in bed.');
    await user.click(screen.getByRole('button', { name: 'Start consultation' }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      ageRange: '25-34',
      mainConcern: 'hard_to_fall_asleep',
      habits: ['Phone use before bed'],
      safetySignals: ['Suspected sleep apnea'],
      optionalContext: 'I use my phone in bed.',
    }));
  });
});
```

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
npm test -- src/components/ProfileWizard.test.tsx
```

Expected: FAIL because `ProfileWizard` does not exist.

- [ ] **Step 3: Implement `EntryPage`**

Create `src/components/EntryPage.tsx`:

```tsx
interface EntryPageProps {
  onStart: () => void;
}

export function EntryPage({ onStart }: EntryPageProps) {
  return (
    <main className="page entry-page">
      <section className="hero">
        <p className="eyebrow">Sleep wellness AI consultant</p>
        <h1>Get personal sleep guidance in a few minutes.</h1>
        <p className="hero-copy">
          Create a short sleep profile, then ask about falling asleep, late-night habits, stress, and sleep quality.
        </p>
        <button className="primary-button" onClick={onStart}>Create sleep profile</button>
      </section>
      <section className="notice">
        This tool provides health management reference only. It is not medical diagnosis and does not replace professional care.
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Implement `ProfileWizard`**

Create `src/components/ProfileWizard.tsx`:

```tsx
import { FormEvent, useState } from 'react';
import type { MainConcern, SleepProfile } from '../domain/types';

interface ProfileWizardProps {
  onComplete: (profile: SleepProfile) => void;
}

const concernOptions: Array<{ value: MainConcern; label: string }> = [
  { value: 'hard_to_fall_asleep', label: 'Hard to fall asleep' },
  { value: 'early_waking', label: 'Waking too early' },
  { value: 'frequent_waking', label: 'Waking often' },
  { value: 'vivid_dreams', label: 'Vivid dreams' },
  { value: 'daytime_sleepiness', label: 'Daytime sleepiness' },
  { value: 'late_night_habit', label: 'Late-night habit' },
  { value: 'other', label: 'Other' },
];

const habitOptions = ['Phone use before bed', 'Caffeine after lunch', 'Alcohol at night', 'Late exercise'];
const safetySignalOptions = ['Severe symptoms', 'Suspected sleep apnea', 'Self-harm thoughts', 'Medication dependence', 'Major underlying disease', 'Pregnancy or postpartum'];

export function ProfileWizard({ onComplete }: ProfileWizardProps) {
  const [profile, setProfile] = useState<SleepProfile>({
    ageRange: '',
    bedtime: '',
    wakeTime: '',
    mainConcern: 'hard_to_fall_asleep',
    concernDuration: '',
    stressLevel: '',
    habits: [],
    daytimeImpact: '',
    safetySignals: [],
    optionalContext: '',
  });

  function update<K extends keyof SleepProfile>(key: K, value: SleepProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function toggleListValue(key: 'habits' | 'safetySignals', value: string) {
    setProfile((current) => {
      const values = current[key];
      return {
        ...current,
        [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onComplete(profile);
  }

  return (
    <main className="page">
      <form className="panel form-grid" onSubmit={submit}>
        <h1>Build your sleep profile</h1>
        <label>
          Age range
          <select required value={profile.ageRange} onChange={(event) => update('ageRange', event.target.value)}>
            <option value="">Select</option>
            {['Under 18', '18-24', '25-34', '35-44', '45-59', '60+'].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Usual bedtime
          <input required type="time" value={profile.bedtime} onChange={(event) => update('bedtime', event.target.value)} />
        </label>
        <label>
          Usual wake time
          <input required type="time" value={profile.wakeTime} onChange={(event) => update('wakeTime', event.target.value)} />
        </label>
        <label>
          Main sleep concern
          <select required value={profile.mainConcern} onChange={(event) => update('mainConcern', event.target.value as MainConcern)}>
            {concernOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>
          Concern duration
          <select required value={profile.concernDuration} onChange={(event) => update('concernDuration', event.target.value)}>
            <option value="">Select</option>
            {['Less than 1 week', '1-4 weeks', '1-3 months', 'More than 3 months'].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Stress level
          <select required value={profile.stressLevel} onChange={(event) => update('stressLevel', event.target.value)}>
            <option value="">Select</option>
            {['Low', 'Medium', 'High', 'Very high'].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>Sleep-related habits</legend>
          {habitOptions.map((option) => (
            <label className="checkbox-row" key={option}>
              <input type="checkbox" checked={profile.habits.includes(option)} onChange={() => toggleListValue('habits', option)} />
              {option}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Safety signals</legend>
          {safetySignalOptions.map((option) => (
            <label className="checkbox-row" key={option}>
              <input type="checkbox" checked={profile.safetySignals.includes(option)} onChange={() => toggleListValue('safetySignals', option)} />
              {option}
            </label>
          ))}
        </fieldset>
        <label>
          Daytime impact
          <input required value={profile.daytimeImpact} onChange={(event) => update('daytimeImpact', event.target.value)} />
        </label>
        <label>
          Optional context
          <textarea value={profile.optionalContext} onChange={(event) => update('optionalContext', event.target.value)} />
        </label>
        <button className="primary-button" type="submit">Start consultation</button>
        <p className="fine-print">Your profile is stored only in this browser on this device.</p>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Wire page switching in `App.tsx`**

Replace `src/App.tsx` with:

```tsx
import { useState } from 'react';
import './styles.css';
import { EntryPage } from './components/EntryPage';
import { ProfileWizard } from './components/ProfileWizard';
import type { SleepProfile } from './domain/types';
import { getSleepProfile, saveSleepProfile } from './storage/localStore';

type View = 'entry' | 'profile' | 'chat';

export default function App() {
  const [profile, setProfile] = useState<SleepProfile | null>(() => getSleepProfile());
  const [view, setView] = useState<View>(() => (getSleepProfile() ? 'chat' : 'entry'));

  function completeProfile(nextProfile: SleepProfile) {
    saveSleepProfile(nextProfile);
    setProfile(nextProfile);
    setView('chat');
  }

  if (view === 'entry') {
    return <EntryPage onStart={() => setView('profile')} />;
  }

  if (view === 'profile' || !profile) {
    return <ProfileWizard onComplete={completeProfile} />;
  }

  return (
    <main className="page">
      <section className="panel">
        <h1>Profile saved</h1>
        <p>The chat interface is implemented in Task 6. Profile saved for {profile.ageRange}.</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Add base styles**

Replace `src/styles.css` with:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #17202a;
  background: #f6f7f4;
}

button,
input,
select,
textarea {
  font: inherit;
}

.page {
  min-height: 100vh;
  padding: 24px 16px;
}

.entry-page {
  display: grid;
  align-content: center;
  gap: 18px;
}

.hero,
.panel,
.notice {
  width: min(100%, 720px);
  margin: 0 auto;
}

.hero h1,
.panel h1 {
  margin: 0 0 12px;
  font-size: 32px;
  line-height: 1.1;
}

.eyebrow {
  margin: 0 0 10px;
  color: #3f6b5b;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
}

.hero-copy {
  margin: 0 0 22px;
  color: #51605a;
  line-height: 1.6;
}

.panel,
.notice {
  background: #ffffff;
  border: 1px solid #d9dfd8;
  border-radius: 8px;
  padding: 20px;
}

.notice,
.fine-print {
  color: #66726d;
  font-size: 13px;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  gap: 14px;
}

label,
fieldset {
  display: grid;
  gap: 6px;
  font-weight: 650;
}

fieldset {
  border: 1px solid #d9dfd8;
  border-radius: 8px;
  padding: 12px;
}

legend {
  padding: 0 6px;
}

.checkbox-row {
  grid-template-columns: 20px 1fr;
  align-items: center;
  font-weight: 500;
}

.checkbox-row input {
  width: 16px;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cfd7d2;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  color: #17202a;
}

textarea {
  min-height: 92px;
  resize: vertical;
}

.primary-button {
  border: 0;
  border-radius: 8px;
  padding: 13px 16px;
  background: #235c4a;
  color: #fff;
  font-weight: 750;
  cursor: pointer;
}

@media (max-width: 520px) {
  .hero h1,
  .panel h1 {
    font-size: 26px;
  }
}
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
npm test -- src/components/ProfileWizard.test.tsx
npm run build
git add src package.json package-lock.json vite.config.ts
git commit -m "feat: add entry and profile setup"
```

Expected: test and build pass, commit succeeds.

---

### Task 5: Implement Serverless Chat API

**Files:**
- Create: `api/prompt.ts`
- Create: `api/provider.ts`
- Create: `api/response.ts`
- Create: `api/chat.ts`
- Test: `api/prompt.test.ts`
- Test: `api/chat.test.ts`

- [ ] **Step 1: Write failing prompt test**

Create `api/prompt.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSleepAdvisorPrompt } from './prompt';
import type { SleepProfile } from '../src/domain/types';

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'High',
  habits: ['Phone use before bed'],
  daytimeImpact: 'Tired at work',
  safetySignals: [],
  optionalContext: 'Mind keeps racing.',
};

describe('buildSleepAdvisorPrompt', () => {
  it('includes profile details and safety boundaries', () => {
    const prompt = buildSleepAdvisorPrompt(profile, 'How can I sleep earlier?');

    expect(prompt).toContain('25-34');
    expect(prompt).toContain('01:00');
    expect(prompt).toContain('not medical diagnosis');
    expect(prompt).toContain('JSON');
  });
});
```

- [ ] **Step 2: Run prompt test and confirm failure**

Run:

```bash
npm test -- api/prompt.test.ts
```

Expected: FAIL because `api/prompt.ts` does not exist.

- [ ] **Step 3: Implement prompt assembly**

Create `api/prompt.ts`:

```ts
import type { ChatMessage, SleepProfile } from '../src/domain/types';

export function buildSleepAdvisorPrompt(profile: SleepProfile, message: string, history: ChatMessage[] = []): string {
  const recentHistory = history
    .slice(-6)
    .map((item) => `${item.role}: ${item.content}`)
    .join('\n');

  return `
You are a sleep wellness AI consultant for health management reference only.
You are not a doctor. Your answer is not medical diagnosis.

Classify the user's risk as "normal" or "high_risk" before answering.
High-risk signals include severe or prolonged insomnia, self-harm thoughts, suspected sleep apnea, chest pain, medication dependence, pregnancy/postpartum severe sleep issues, or major underlying disease.
For high_risk, prioritize professional care and do not provide diagnosis, prescription, medication dosage, or intensive intervention instructions.

Return only JSON matching this shape:
{
  "riskLevel": "normal",
  "summary": "short summary",
  "possibleFactors": ["factor"],
  "suggestions": [{"title": "action", "detail": "concrete detail"}],
  "nextQuestions": ["follow-up question"],
  "seekCareNotice": null,
  "disclaimer": "This is for health management reference only and is not medical diagnosis."
}

Sleep profile:
- Age range: ${profile.ageRange}
- Bedtime: ${profile.bedtime}
- Wake time: ${profile.wakeTime}
- Main concern: ${profile.mainConcern}
- Duration: ${profile.concernDuration}
- Stress: ${profile.stressLevel}
- Habits: ${profile.habits.join(', ') || 'not provided'}
- Daytime impact: ${profile.daytimeImpact}
- Safety signals: ${profile.safetySignals.join(', ') || 'none selected'}
- Optional context: ${profile.optionalContext || 'not provided'}

Recent chat:
${recentHistory || 'No prior messages.'}

Current user message:
${message}
`;
}
```

- [ ] **Step 4: Create AI provider wrapper**

Create `api/provider.ts`:

```ts
export interface AiProviderResult {
  content: string;
}

export async function callAiProvider(prompt: string): Promise<AiProviderResult> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('AI_API_KEY is required');
  }

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider failed with ${response.status}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('AI provider returned no text content');
  }

  return { content };
}
```

- [ ] **Step 5: Create server response helpers**

Create `api/response.ts`:

```ts
import type { VercelResponse } from '@vercel/node';

export function sendJson(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).json(body);
}
```

- [ ] **Step 6: Implement serverless endpoint**

Create `api/chat.ts`:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { normalizeAiResponse, safeFallbackResponse } from '../src/domain/aiResponse';
import { detectHighRiskSignal } from '../src/domain/safety';
import type { ChatMessage, SleepProfile } from '../src/domain/types';
import { buildSleepAdvisorPrompt } from './prompt';
import { callAiProvider } from './provider';
import { sendJson } from './response';

interface ChatRequestBody {
  profile?: SleepProfile;
  message?: string;
  history?: ChatMessage[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const body = req.body as ChatRequestBody;
  if (!body.profile || typeof body.message !== 'string' || body.message.trim().length === 0) {
    return sendJson(res, 400, { error: 'Profile and message are required' });
  }

  if (detectHighRiskSignal(body.message) || body.profile.safetySignals.length > 0) {
    return sendJson(res, 200, safeFallbackResponse());
  }

  try {
    const prompt = buildSleepAdvisorPrompt(body.profile, body.message, body.history || []);
    const providerResult = await callAiProvider(prompt);
    const parsed = JSON.parse(providerResult.content);
    return sendJson(res, 200, normalizeAiResponse(parsed));
  } catch {
    return sendJson(res, 200, safeFallbackResponse());
  }
}
```

- [ ] **Step 7: Write endpoint behavior tests**

Create `api/chat.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import handler from './chat';
import type { SleepProfile } from '../src/domain/types';

vi.mock('./provider', () => ({
  callAiProvider: vi.fn(async () => ({
    content: JSON.stringify({
      riskLevel: 'normal',
      summary: 'Your late bedtime and stress may be contributing.',
      possibleFactors: ['Late bedtime', 'High stress'],
      suggestions: [{ title: 'Set a wind-down alarm', detail: 'Start winding down at 00:15 tonight.' }],
      nextQuestions: ['How much caffeine do you drink after lunch?'],
      seekCareNotice: null,
      disclaimer: 'This is for health management reference only and is not medical diagnosis.',
    }),
  })),
}));

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'High',
  habits: [],
  daytimeImpact: 'Tired at work',
  safetySignals: [],
  optionalContext: '',
};

function mockRes() {
  return {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

describe('chat api', () => {
  it('returns normalized AI response for normal requests', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, message: 'How can I sleep earlier?', history: [] } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ riskLevel: 'normal' });
  });

  it('returns safe high-risk response without provider call', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, message: 'I want to hurt myself', history: [] } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ riskLevel: 'high_risk' });
  });
});
```

- [ ] **Step 8: Run API tests and commit**

Run:

```bash
npm test -- api/prompt.test.ts api/chat.test.ts
npm run build
git add api src/domain package.json package-lock.json
git commit -m "feat: add guarded sleep advisor api"
```

Expected: tests and build pass, commit succeeds.

---

### Task 6: Build Chat UI And Frontend API Client

**Files:**
- Create: `src/api/chatClient.ts`
- Create: `src/components/ChatPage.tsx`
- Create: `src/components/MessageList.tsx`
- Create: `src/components/AiResponseCard.tsx`
- Create: `src/components/SafetyNotice.tsx`
- Create: `src/components/FeedbackControl.tsx`
- Test: `src/api/chatClient.test.ts`
- Test: `src/components/AiResponseCard.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing API client test**

Create `src/api/chatClient.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendChatMessage } from './chatClient';
import type { SleepProfile } from '../domain/types';

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'High',
  habits: [],
  daytimeImpact: 'Tired at work',
  safetySignals: [],
  optionalContext: '',
};

describe('sendChatMessage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('posts profile and message to the chat API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        riskLevel: 'normal',
        summary: 'Summary',
        possibleFactors: [],
        suggestions: [],
        nextQuestions: [],
        seekCareNotice: null,
        disclaimer: 'This is for health management reference only and is not medical diagnosis.',
      }),
    })));

    const response = await sendChatMessage({ profile, message: 'Help', history: [] });

    expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }));
    expect(response.riskLevel).toBe('normal');
  });
});
```

- [ ] **Step 2: Write failing AI response rendering test**

Create `src/components/AiResponseCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiResponseCard } from './AiResponseCard';

describe('AiResponseCard', () => {
  it('renders high-risk care notice prominently', () => {
    render(
      <AiResponseCard
        response={{
          riskLevel: 'high_risk',
          summary: 'This may need professional support.',
          possibleFactors: [],
          suggestions: [],
          nextQuestions: [],
          seekCareNotice: 'Please contact a licensed clinician.',
          disclaimer: 'This is for health management reference only and is not medical diagnosis.',
        }}
      />,
    );

    expect(screen.getByText('Please contact a licensed clinician.')).toBeVisible();
    expect(screen.getByText(/not medical diagnosis/i)).toBeVisible();
  });
});
```

- [ ] **Step 3: Run UI/client tests and confirm failure**

Run:

```bash
npm test -- src/api/chatClient.test.ts src/components/AiResponseCard.test.tsx
```

Expected: FAIL because `chatClient.ts` and `AiResponseCard.tsx` do not exist.

- [ ] **Step 4: Implement API client**

Create `src/api/chatClient.ts`:

```ts
import { normalizeAiResponse } from '../domain/aiResponse';
import type { AiResponse, ChatMessage, SleepProfile } from '../domain/types';

interface SendChatMessageInput {
  profile: SleepProfile;
  message: string;
  history: ChatMessage[];
}

export async function sendChatMessage(input: SendChatMessageInput): Promise<AiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Chat API failed with ${response.status}`);
  }

  return normalizeAiResponse(await response.json());
}
```

- [ ] **Step 5: Create rendering components**

Create `src/components/SafetyNotice.tsx`:

```tsx
interface SafetyNoticeProps {
  notice?: string | null;
  disclaimer: string;
}

export function SafetyNotice({ notice, disclaimer }: SafetyNoticeProps) {
  return (
    <div className={notice ? 'safety-notice high-risk' : 'safety-notice'} role={notice ? 'alert' : undefined}>
      {notice && <strong>{notice}</strong>}
      <span>{disclaimer}</span>
    </div>
  );
}
```

Create `src/components/AiResponseCard.tsx`:

```tsx
import type { AiResponse } from '../domain/types';
import { SafetyNotice } from './SafetyNotice';

export function AiResponseCard({ response }: { response: AiResponse }) {
  return (
    <article className="ai-card">
      <SafetyNotice notice={response.seekCareNotice} disclaimer={response.disclaimer} />
      <p>{response.summary}</p>
      {response.possibleFactors.length > 0 && (
        <section>
          <h3>Possible factors</h3>
          <ul>{response.possibleFactors.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      )}
      {response.suggestions.length > 0 && (
        <section>
          <h3>Try next</h3>
          <ul>{response.suggestions.map((item) => <li key={item.title}><strong>{item.title}</strong>: {item.detail}</li>)}</ul>
        </section>
      )}
      {response.nextQuestions.length > 0 && (
        <section>
          <h3>Helpful follow-ups</h3>
          <ul>{response.nextQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      )}
    </article>
  );
}
```

Create `src/components/FeedbackControl.tsx`:

```tsx
interface FeedbackControlProps {
  onFeedback: (value: 'useful' | 'not_useful') => void;
}

export function FeedbackControl({ onFeedback }: FeedbackControlProps) {
  return (
    <div className="feedback-row">
      <button type="button" onClick={() => onFeedback('useful')}>Useful</button>
      <button type="button" onClick={() => onFeedback('not_useful')}>Not useful</button>
    </div>
  );
}
```

Create `src/components/MessageList.tsx`:

```tsx
import type { ChatMessage } from '../domain/types';
import { AiResponseCard } from './AiResponseCard';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.role}`}>
          <p>{message.content}</p>
          {message.response && <AiResponseCard response={message.response} />}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Implement chat page**

Create `src/components/ChatPage.tsx`:

```tsx
import { FormEvent, useState } from 'react';
import { sendChatMessage } from '../api/chatClient';
import type { ChatMessage, FeedbackEvent, SleepProfile } from '../domain/types';
import { clearAllLocalData, getChatHistory, getFeedbackEvents, saveChatHistory, saveFeedbackEvents } from '../storage/localStore';
import { FeedbackControl } from './FeedbackControl';
import { MessageList } from './MessageList';

interface ChatPageProps {
  profile: SleepProfile;
  onReset: () => void;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatPage({ profile, onReset }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatHistory());
  const [feedback, setFeedback] = useState<FeedbackEvent[]>(() => getFeedbackEvents());
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || pending) return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content: input.trim(), createdAt: new Date().toISOString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    saveChatHistory(nextMessages);
    setInput('');
    setPending(true);
    setError('');

    try {
      const response = await sendChatMessage({ profile, message: userMessage.content, history: messages });
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: response.summary,
        response,
        createdAt: new Date().toISOString(),
      };
      const saved = [...nextMessages, assistantMessage];
      setMessages(saved);
      saveChatHistory(saved);
    } catch {
      setInput(userMessage.content);
      setError('We could not generate advice right now. Please retry in a moment.');
    } finally {
      setPending(false);
    }
  }

  function recordFeedback(value: 'useful' | 'not_useful') {
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    if (!lastAssistant) return;

    const next = [...feedback, { messageId: lastAssistant.id, value, createdAt: new Date().toISOString() }];
    setFeedback(next);
    saveFeedbackEvents(next);
  }

  function reset() {
    clearAllLocalData();
    onReset();
  }

  return (
    <main className="page chat-page">
      <header className="chat-header">
        <div>
          <h1>Sleep consultation</h1>
          <p>{profile.ageRange} · {profile.mainConcern} · usual sleep {profile.bedtime}-{profile.wakeTime}</p>
        </div>
        <button type="button" onClick={reset}>Reset profile</button>
      </header>
      <MessageList messages={messages} />
      {error && <p className="error">{error}</p>}
      {messages.some((message) => message.role === 'assistant') && <FeedbackControl onFeedback={recordFeedback} />}
      <form className="chat-input" onSubmit={submit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your sleep..." />
        <button className="primary-button" disabled={pending} type="submit">{pending ? 'Sending...' : 'Send'}</button>
      </form>
      <p className="fine-print">Records are stored only in this browser. Advice is not medical diagnosis.</p>
    </main>
  );
}
```

- [ ] **Step 7: Wire `ChatPage` into `App.tsx`**

Replace the placeholder chat section in `src/App.tsx` with:

```tsx
import { useState } from 'react';
import './styles.css';
import { ChatPage } from './components/ChatPage';
import { EntryPage } from './components/EntryPage';
import { ProfileWizard } from './components/ProfileWizard';
import type { SleepProfile } from './domain/types';
import { getSleepProfile, saveSleepProfile } from './storage/localStore';

type View = 'entry' | 'profile' | 'chat';

export default function App() {
  const [profile, setProfile] = useState<SleepProfile | null>(() => getSleepProfile());
  const [view, setView] = useState<View>(() => (getSleepProfile() ? 'chat' : 'entry'));

  function completeProfile(nextProfile: SleepProfile) {
    saveSleepProfile(nextProfile);
    setProfile(nextProfile);
    setView('chat');
  }

  function resetProfile() {
    setProfile(null);
    setView('profile');
  }

  if (view === 'entry') {
    return <EntryPage onStart={() => setView('profile')} />;
  }

  if (view === 'profile' || !profile) {
    return <ProfileWizard onComplete={completeProfile} />;
  }

  return <ChatPage profile={profile} onReset={resetProfile} />;
}
```

- [ ] **Step 8: Extend styles for chat**

Append to `src/styles.css`:

```css
.chat-page {
  display: grid;
  grid-template-rows: auto 1fr auto auto auto;
  gap: 14px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.chat-header h1 {
  margin: 0 0 6px;
}

.chat-header p {
  margin: 0;
  color: #66726d;
}

.message-list {
  display: grid;
  gap: 12px;
}

.message {
  max-width: 780px;
  padding: 12px;
  border-radius: 8px;
}

.message.user {
  justify-self: end;
  background: #dfeee8;
}

.message.assistant {
  justify-self: start;
  background: #ffffff;
  border: 1px solid #d9dfd8;
}

.ai-card {
  display: grid;
  gap: 12px;
}

.ai-card h3 {
  margin: 0 0 6px;
  font-size: 15px;
}

.safety-notice {
  display: grid;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  background: #eef5f1;
  color: #33443d;
  font-size: 13px;
}

.safety-notice.high-risk {
  background: #fff1ed;
  color: #7a2d1f;
}

.feedback-row,
.chat-input {
  display: flex;
  gap: 8px;
}

.chat-input input {
  flex: 1;
}

.error {
  color: #9a3412;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  padding: 10px;
}

@media (max-width: 640px) {
  .chat-header,
  .feedback-row,
  .chat-input {
    flex-direction: column;
  }
}
```

- [ ] **Step 9: Run client tests and commit**

Run:

```bash
npm test -- src/api/chatClient.test.ts src/components/AiResponseCard.test.tsx src/components/ProfileWizard.test.tsx
npm run build
git add src
git commit -m "feat: add sleep consultation chat ui"
```

Expected: tests and build pass, commit succeeds.

---

### Task 7: Add Playwright Acceptance Coverage

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/mvp.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright browser**

Run:

```bash
npx playwright install chromium
```

Expected: Chromium browser downloads successfully.

- [ ] **Step 2: Create Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

- [ ] **Step 3: Create MVP e2e test**

Create `e2e/mvp.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('user can create profile and reach chat', async ({ page }) => {
  await page.route('/api/chat', async (route) => {
    await route.fulfill({
      json: {
        riskLevel: 'normal',
        summary: 'Your late bedtime and high stress likely make it harder to fall asleep.',
        possibleFactors: ['Late bedtime', 'High stress'],
        suggestions: [{ title: 'Set a wind-down start time', detail: 'Start a 30-minute phone-free wind-down at 00:30 tonight.' }],
        nextQuestions: ['Do you drink caffeine after lunch?'],
        seekCareNotice: null,
        disclaimer: 'This is for health management reference only and is not medical diagnosis.',
      },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Create sleep profile' }).click();
  await page.getByLabel('Age range').selectOption('25-34');
  await page.getByLabel('Usual bedtime').fill('01:00');
  await page.getByLabel('Usual wake time').fill('08:00');
  await page.getByLabel('Main sleep concern').selectOption('hard_to_fall_asleep');
  await page.getByLabel('Concern duration').selectOption('1-3 months');
  await page.getByLabel('Stress level').selectOption('High');
  await page.getByLabel('Daytime impact').fill('Tired at work');
  await page.getByLabel('Optional context').fill('I use my phone in bed.');
  await page.getByRole('button', { name: 'Start consultation' }).click();

  await page.getByPlaceholder('Ask about your sleep...').fill('How can I fall asleep earlier?');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText('Your late bedtime and high stress')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Useful' })).toBeVisible();
});
```

- [ ] **Step 4: Run e2e test and commit**

Run:

```bash
npm run e2e
git add playwright.config.ts e2e package.json package-lock.json
git commit -m "test: add mvp browser acceptance coverage"
```

Expected: Playwright passes on desktop and mobile projects, commit succeeds.

---

### Task 8: Final Verification And Documentation

**Files:**
- Create: `README.md`
- Modify: `docs/superpowers/specs/2026-05-07-sleep-wellness-h5-mvp-design.md` only if implementation revealed a required correction.

- [ ] **Step 1: Create README**

Create `README.md`:

````md
# Sleep Wellness H5 MVP

Mobile-first H5 MVP for a sleep wellness AI consultant.

## Features

- Local sleep profile setup.
- AI consultation through `POST /api/chat`.
- High-risk safety triage.
- Structured AI response rendering.
- Useful/not useful local feedback.
- Browser-only local persistence.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these variables in `.env.local`:

```bash
AI_BASE_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=replace-with-provider-key
AI_MODEL=gpt-4o-mini
```

## Verification

```bash
npm test
npm run build
npm run e2e
```

## Privacy Boundary

The MVP stores profile, chat history, and feedback only in the current browser. It does not implement accounts, databases, or server-side health profile storage.

The AI response is for health management reference only and is not medical diagnosis.
````

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run build
npm run e2e
```

Expected: all commands pass.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional changes are present. No `.DS_Store`, `.superpowers/`, `.env`, `node_modules/`, `dist/`, or test output directories are tracked.

- [ ] **Step 4: Commit final docs**

Run:

```bash
git add README.md docs/superpowers/specs/2026-05-07-sleep-wellness-h5-mvp-design.md docs/superpowers/plans/2026-05-07-sleep-wellness-h5-mvp.md .gitignore
git commit -m "docs: document sleep wellness mvp plan"
```

Expected: commit succeeds if these files have uncommitted changes.
