# Personalized Profile and Safety Design

## Context

The current app already has a usable sleep wellness MVP:

- `SleepProfile` collects age range, bedtime, wake time, main concern, duration, stress level, habits, daytime impact, safety signals, and optional context.
- `ProfileWizard` creates the profile and saves it locally.
- `buildAssessmentResult` scores simplified ISI and PSQI-Lite answers and produces risk flags.
- `detectHighRiskSignal` catches urgent message-level safety signals.
- `recommendSleepPlans` chooses a small set of behavioral plans from profile, assessment, and diary summary.
- Chat and knowledge prompts include profile and assessment context and enforce a non-diagnostic disclaimer.

The next increment should improve personalization without turning the app into a clinical diagnostic system.

## Product Scope

This phase focuses on:

- More complete user profile inputs.
- A deterministic personalization analysis layer.
- Safer, more targeted AI prompt context.
- Personalized behavior, relaxation, nutrition, exercise, non-diagnostic TCM-style wellness direction, and 7-day plan outputs.

This phase does not include:

- Continuous learning from thumbs feedback.
- Sleep diary model training or automatic AI quality tuning.
- Automatic knowledge-card generation from high-frequency questions.
- A/B testing different copy variants.
- Diagnosis, prescription, medication dosing, or supplement dosing.

## Profile Model

Extend `SleepProfile` with optional structured fields so existing saved profiles remain readable:

```ts
gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'unspecified';
sleepDurationHours?: string;
occupationStress?: 'low' | 'moderate' | 'high' | 'very_high' | 'unspecified';
emotionState?: string[];
exerciseHabit?: string;
dietHabit?: string[];
phoneUsageHabit?: string;
medicationStatus?: string[];
medicalConditions?: string[];
```

The existing fields stay in place for compatibility:

- `ageRange`
- `bedtime`
- `wakeTime`
- `mainConcern`
- `concernDuration`
- `stressLevel`
- `habits`
- `daytimeImpact`
- `safetySignals`
- `optionalContext`

`ProfileWizard` should add compact inputs for the new fields. It should default missing optional fields to neutral values when creating a new profile. Older stored profiles should not break rendering or prompt generation.

## Personalization Analysis

Add a new domain module, `src/domain/personalization.ts`, with a single public builder:

```ts
export function buildPersonalizationProfile(input: {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  diarySummary?: DiarySummary;
}): PersonalizedSleepProfile;
```

The output should be deterministic and testable:

```ts
export interface PersonalizedSleepProfile {
  severity: 'low' | 'mild' | 'moderate' | 'severe';
  careAdvice: {
    shouldSeekCare: boolean;
    reasons: string[];
    urgency: 'routine' | 'soon' | 'urgent';
  };
  behaviorTargets: string[];
  relaxationTargets: string[];
  nutritionTargets: string[];
  exerciseTargets: string[];
  tcmDirection: {
    pattern: 'qi_deficiency' | 'yin_deficiency' | 'liver_qi_stagnation' | 'phlegm_dampness' | 'balanced' | 'unclear';
    label: string;
    guidance: string[];
    disclaimer: string;
  };
  sevenDayPlan: Array<{
    day: number;
    title: string;
    task: string;
    checkInPrompt: string;
  }>;
  safetyBoundaries: string[];
}
```

### Severity Rules

Severity should combine profile, assessment, and diary evidence:

- `severe`: severe ISI, poor PSQI plus clear daytime impairment, safety signals, medication dependence signal, suspected apnea signal, self-harm signal, or major disease signal.
- `moderate`: moderate ISI, poor PSQI, chronic duration over 3 months with daily function impact, or persistent sleep duration under 5 hours.
- `mild`: mild ISI, short-term insomnia, elevated stress, phone/caffeine/alcohol habits, or occasional daytime impact.
- `low`: no strong risk signal and profile suggests stable function.

If evidence conflicts, safety should win. For example, a low ISI with selected self-harm or suspected apnea still becomes `severe`.

### Care Advice Rules

`careAdvice.shouldSeekCare` should be true for:

- Self-harm thoughts or severe emotional risk.
- Suspected sleep apnea.
- Chest pain or major disease signal.
- Pregnancy or postpartum severe sleep problem.
- Medication dependence or nightly sedative use.
- Severe ISI.
- Sleep problem lasting more than 3 months with obvious daytime impairment.

The app must keep its existing boundary: it can suggest professional evaluation, but must not diagnose or prescribe.

### Targeted Recommendation Rules

The analysis should produce concise target arrays:

- `behaviorTargets`: fixed wake time, stimulus control, sleep restriction education, phone boundary, CBT-I style basics.
- `relaxationTargets`: breathing, progressive muscle relaxation, meditation audio, wind-down ritual.
- `nutritionTargets`: caffeine boundary, alcohol caution, dinner timing, supplement caution.
- `exerciseTargets`: morning light movement, moderate aerobic exercise, avoid vigorous late-night exercise.
- `safetyBoundaries`: no prescription, no dosage, stop self-adjusting medication, seek care for red flags.

Supplement language must avoid specific dosages. It can say melatonin, magnesium, or tryptophan should be discussed with a clinician or qualified professional, especially for pregnancy, chronic disease, psychiatric medication, or existing medication use.

### TCM Wellness Direction

The TCM direction is wellness-oriented and non-diagnostic. It should use language such as “体质倾向” and “调养方向”, not “诊断”.

Initial heuristic examples:

- Long fatigue, low energy, daytime sleepiness -> `qi_deficiency`.
- Night sweats, hot sensations, frequent waking, vivid dreams -> `yin_deficiency`.
- High stress, anxiety, difficulty falling asleep -> `liver_qi_stagnation`.
- Heavy body feeling, diet irregularity, late-night eating -> `phlegm_dampness`.
- Insufficient evidence -> `unclear`.

Every TCM output includes a disclaimer that it is only a wellness reference and does not replace medical diagnosis.

## AI Prompt Integration

Update `api/prompt.ts` so `buildSleepAdvisorPrompt` includes a summarized personalization section when available. To keep the prompt builder easy to test, prefer passing the analysis result into the prompt builder rather than recomputing inside it.

The prompt should instruct the model to:

- Use the deterministic personalization analysis as the primary context.
- Keep `riskLevel` aligned with `careAdvice` and severity.
- Give targeted behavior, relaxation, nutrition, and exercise suggestions.
- Include a 7-day plan when the user asks for a plan or when the scenario is plan-related.
- Avoid medication or supplement dosage.
- Preserve the existing disclaimer.

## UI Experience

Profile creation should remain a single guided form. Add the new inputs without making onboarding feel clinical:

- `gender`: select.
- `sleepDurationHours`: select or number-like input.
- `occupationStress`: select.
- `emotionState`: chips such as 焦虑、情绪低落、烦躁、平稳.
- `exerciseHabit`: select.
- `dietHabit`: chips such as 午后咖啡因、夜间饮酒、晚餐过晚、辛辣高糖.
- `phoneUsageHabit`: select.
- `medicationStatus`: chips such as 未用药、偶尔使用助眠产品、长期使用助眠药、正在服用其他药物.
- `medicalConditions`: chips such as 无、慢性病、疼痛、孕期或产后、疑似呼吸暂停.

Dashboard or plan-related pages may surface the resulting 7-day plan through existing plan components. This phase should avoid a large new dashboard redesign unless tests show the current layout cannot accommodate the content.

## Data Flow

1. User completes the enhanced profile wizard.
2. The app saves the profile using the existing local storage key.
3. Assessment and diary summaries remain optional inputs.
4. `buildPersonalizationProfile` produces deterministic personalization context.
5. Chat prompt and plan recommendation logic receive the context.
6. AI response uses the context while safety rules remain enforceable outside the AI.

## Error Handling and Backward Compatibility

- Missing optional profile fields should be treated as `unspecified` or empty arrays.
- Old saved profiles should continue to load and should not require migration before rendering.
- Invalid or unexpected values should fall back to neutral recommendations.
- If personalization analysis cannot be built, chat and existing recommendations should continue using the basic profile and assessment context.

## Testing

Add focused tests for:

- New profile fields render and submit from `ProfileWizard`.
- Old profile objects without new fields still work.
- `buildPersonalizationProfile` classifies severe safety cases correctly.
- Chronic duration plus daytime impairment triggers care advice.
- Medication/supplement boundaries prohibit dosage guidance.
- TCM direction is non-diagnostic and includes a disclaimer.
- The 7-day plan has exactly seven daily tasks.
- `buildSleepAdvisorPrompt` includes personalization context and safety boundaries.
- Existing assessment, chat, plan, and storage tests still pass.

## Success Criteria

- Users can provide richer profile data during onboarding.
- AI prompts include structured personalization context.
- Severe symptoms consistently trigger professional-care guidance before generic tips.
- Suggestions become more specific across behavior, relaxation, nutrition, exercise, TCM-style wellness, and a 7-day plan.
- The app still clearly states that content is for reference only and not a medical diagnosis.
