# Sleep Wellness H5 MVP

Mobile-first H5 MVP for a sleep wellness AI consultant.

## Features

- Local sleep profile setup.
- AI consultation through `POST /api/chat`.
- High-risk safety triage.
- Structured AI response rendering.
- Useful/not useful local feedback.
- Browser-only local persistence.
- Sleep assessment (ISI + PSQI-Lite) with risk flags.
- AI-powered sleep knowledge cards with caching.
- Scene-based consultation with scenario prompts.
- Bilingual Chinese/English interface (Chinese UI).
- 14-day sleep improvement program with one daily task.
- Deterministic safety gate before ordinary behavior tasks.
- Lightweight daily task feedback with local progress tracking.
- Trusted built-in sleep knowledge content before optional AI supplements.

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

## Sleep Enhancement Data

The enhanced diary, trend, reminder, relaxation, and plan recommendation features are local-first. Data is stored in this browser through localStorage with sync-ready IDs and timestamps, but this version does not include accounts, backend storage, browser notifications, or audio playback.

The 14-day program, task logs, completion metrics, and trusted knowledge content are local-first. They are designed to work without accounts or cloud sync, and high-risk profiles are routed to professional evaluation guidance before ordinary behavior tasks.

Verification:

```bash
npm test
npm run build
npm run e2e
```