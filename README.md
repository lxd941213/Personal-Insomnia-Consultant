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