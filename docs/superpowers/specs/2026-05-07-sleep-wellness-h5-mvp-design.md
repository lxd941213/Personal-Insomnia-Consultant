# Sleep Wellness H5 MVP Design

Date: 2026-05-07

## Context

The source requirement describes an AI sleep and wellness consultant for users with insomnia, poor sleep quality, late-night habits, and general wellness needs. The full product vision includes AI Q&A, sleep assessments, knowledge cards, sleep diary, trend charts, reminders, subscriptions, product recommendations, and medical referral paths.

This MVP intentionally narrows the first release to validate one question: do users feel that profile-based AI sleep advice is useful?

## MVP Goal

Build a lightweight H5 web app that lets a user create a local sleep profile and then chat with an AI sleep consultant. The first release should validate perceived usefulness through completion, follow-up questions, and useful/not useful feedback.

Primary success signals:

- User completes the profile setup.
- User sends at least one consultation question.
- AI response is personalized to the profile rather than generic.
- User continues asking follow-up questions.
- User marks the response as useful or not useful.

## Platform And Delivery

The MVP will be an H5 web application, not a WeChat mini program. This keeps development and deployment fast while preserving a path to later mini program adaptation.

Recommended delivery model:

- Static H5 frontend.
- Serverless API for AI calls.
- Third-party AI provider behind the serverless API.
- Browser `localStorage` for profile, chat history, and feedback state.
- No account system and no database in the first version.

## Product Scope

### In Scope

- Entry page with concise value proposition and health disclaimer.
- Quick profile setup before AI chat.
- AI consultation based on the saved sleep profile.
- Safety triage for high-risk user messages.
- Local browser persistence for profile and chat history.
- Useful/not useful feedback for AI replies.
- Profile reset and rebuild.
- Mobile-first responsive H5 interface.

### Out Of Scope

- Account login.
- Server-side user profile storage.
- ISI or PSQI clinical assessment flow.
- Sleep diary.
- Sleep trend charts.
- Reminder notifications.
- Knowledge card library.
- Membership payment.
- Product affiliate recommendations.
- Medical referral monetization.
- Multi-device sync.

## User Flow

1. User opens the H5 app.
2. Entry page explains that the app provides personalized sleep suggestions after a short profile setup.
3. User completes quick profile setup.
4. App saves the profile to browser `localStorage`.
5. User enters the AI consultation page.
6. User asks a sleep-related question.
7. Frontend sends the current message, profile, and recent chat context to `POST /api/chat`.
8. Serverless API assembles the prompt, applies safety instructions, and calls the AI provider.
9. API returns a structured response.
10. Frontend renders the answer, safety notice, suggestions, and follow-up questions.
11. User can continue chatting or mark the response as useful/not useful.

## Profile Fields

The profile setup should collect only what is necessary for useful personalization:

- Age range.
- Usual bedtime.
- Usual wake time.
- Main sleep concern: hard to fall asleep, waking early, frequent waking, vivid dreams, daytime sleepiness, late-night habit, or other.
- Duration of the concern.
- Stress or emotional state.
- Caffeine, alcohol, exercise, and phone use habits.
- Whether sleep problems significantly affect daytime work or study.
- Safety signals: severe symptoms, suspected sleep apnea, self-harm thoughts, medication dependence, major underlying disease, pregnancy or postpartum status.
- Optional free-text context.

The UI should prefer selection controls over free text where possible, with one optional free-text field at the end.

## AI Safety Boundary

The AI consultant is a health management and education assistant, not a medical diagnosis system.

The system must distinguish at least two risk levels:

- `normal`: common sleep issues such as difficulty falling asleep, late-night phone use, mild stress, irregular schedule, or poor sleep environment.
- `high_risk`: severe or prolonged insomnia, suspected depression or self-harm, suspected sleep apnea, chest pain, medication dependence, pregnancy/postpartum severe sleep issues, or sleep problems linked to major underlying disease.

For `normal` cases, the AI may provide practical suggestions about sleep schedule, light exposure, caffeine timing, exercise timing, relaxation methods, sleep environment, and habit changes.

For `high_risk` cases, the AI must prioritize seeking medical or mental health support. It must not diagnose, prescribe, recommend medication dosage, or present itself as a replacement for professional care.

Every answer must include a concise disclaimer that the content is for health management reference only and is not medical diagnosis.

## AI Response Contract

The serverless API should request structured JSON from the AI provider, then validate and normalize it before returning it to the frontend.

Recommended response shape:

```json
{
  "riskLevel": "normal",
  "summary": "Short understanding of the user's situation.",
  "possibleFactors": ["Factor 1", "Factor 2"],
  "suggestions": [
    {
      "title": "Actionable suggestion",
      "detail": "Concrete, practical detail."
    }
  ],
  "nextQuestions": ["Question 1", "Question 2"],
  "seekCareNotice": null,
  "disclaimer": "This is for health management reference only and is not medical diagnosis."
}
```

For `high_risk`, `seekCareNotice` must be present and prominent in the frontend.

## Technical Architecture

### Frontend

The frontend owns:

- Route and page state.
- Profile wizard.
- Chat interface.
- Local persistence.
- Rendering structured AI responses.
- Feedback capture.
- Loading, retry, and error states.

Local storage keys:

- `sleepProfile`
- `chatHistory`
- `feedbackEvents`

The UI must state that records are stored only in the current browser on the current device.

### Serverless API

The first version needs one endpoint:

- `POST /api/chat`

Responsibilities:

- Accept user message, sleep profile, and recent chat history.
- Validate required inputs.
- Assemble system and user prompts.
- Instruct the AI to classify risk before answering.
- Call the AI provider with API key stored in server-side environment variables.
- Validate the AI response shape.
- Apply fallback safety templates when needed.
- Return normalized JSON to the frontend.

### AI Provider

The AI provider is accessed only from the serverless API. The browser must never receive the provider API key.

## Error Handling

- If the user profile is missing, redirect the user to profile setup before chat.
- If the AI call fails, preserve the user's input and show a retryable error.
- If the AI returns invalid JSON, retry normalization once.
- If normalization still fails, return a safe generic response.
- If high-risk signals are detected but the AI response lacks a care-seeking notice, replace or augment the response with a fixed safety template.
- If `localStorage` is unavailable, allow the current session to proceed in memory and warn that data may not persist.

## Privacy And Compliance

The MVP avoids account login and database storage to reduce sensitive health data handling in the first release.

Privacy requirements:

- Do not send analytics events containing detailed health profile text.
- Do not store user health profile data on the server.
- Keep AI API logs minimal where provider settings allow it.
- Explain local browser storage plainly in the UI.
- Provide a way to clear local data.

## Components

Recommended component boundaries:

- `EntryPage`: value proposition, disclaimer, start button.
- `ProfileWizard`: profile questions, validation, save action.
- `ChatPage`: chat layout, profile summary, message input.
- `MessageList`: renders user and AI messages.
- `AiResponseCard`: renders structured AI output.
- `SafetyNotice`: prominent high-risk and disclaimer display.
- `FeedbackControl`: useful/not useful buttons.
- `LocalStorageStore`: profile, chat history, and feedback persistence wrapper.
- `ChatApiClient`: typed client for `POST /api/chat`.

## Testing And Acceptance Criteria

The MVP is accepted when:

- A first-time user can complete profile setup and enter chat.
- Refreshing the page preserves profile and chat history.
- A normal sleep question returns personalized advice using profile details.
- A high-risk message triggers a professional-help notice.
- AI API failure shows a clear retry state and does not erase user input.
- Invalid AI output falls back to a safe response.
- Useful/not useful feedback is saved locally.
- User can clear local data and rebuild the profile.
- The app is usable on a mobile viewport without input controls covering key content.

## Future Expansion

If the MVP validates usefulness, likely next steps are:

- Anonymous server-side user ID.
- Server-side chat history and profile sync.
- Lightweight sleep score or simplified assessment.
- Sleep diary and trend chart.
- Reminder notifications.
- Account login.
- Subscription or paid advanced consultation.
- Knowledge card library.
- WeChat mini program adaptation.

These are intentionally excluded from the first implementation plan.

## Git Status Note

The project directory was not a git repository when this design was written, so no design-doc commit was created.
