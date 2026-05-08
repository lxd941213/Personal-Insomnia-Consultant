import { sleepPlans, recommendSleepPlans } from '../domain/sleepPlans';
import { summarizeRecentDiary } from '../domain/sleepDiary';
import { getDiaryEntries } from '../storage/localStore';
import type { AssessmentResult, SleepProfile } from '../domain/types';

export function PlansPage({ profile, assessmentResult }: { profile: SleepProfile; assessmentResult: AssessmentResult | null }) {
  const diarySummary = summarizeRecentDiary(getDiaryEntries());
  const recommendations = recommendSleepPlans({ profile, assessmentResult, diarySummary });
  return (
    <main className="page plans-page">
      <h1>助眠方案</h1>
      <h2>推荐方案</h2>
      {recommendations.map((recommendation) => {
        const plan = sleepPlans.find((item) => item.id === recommendation.planId);
        if (!plan) return null;
        return (
          <article key={recommendation.planId} className="plan-card">
            <h3>{plan.title}</h3>
            <p>{plan.summary}</p>
            <p>推荐理由：{recommendation.reasons.join('；')}</p>
            {recommendation.safetyNote && <p>{recommendation.safetyNote}</p>}
          </article>
        );
      })}
      <h2>全部方案</h2>
      {sleepPlans.map((plan) => <article key={plan.id} className="plan-card"><h3>{plan.title}</h3><p>{plan.summary}</p></article>)}
    </main>
  );
}