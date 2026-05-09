import { sleepPlans, recommendSleepPlans } from '../domain/sleepPlans';
import { summarizeRecentDiary } from '../domain/sleepDiary';
import { getDiaryEntries } from '../storage/localStore';
import { buildPersonalizationProfile } from '../domain/personalization';
import type { AssessmentResult, SleepProfile } from '../domain/types';

export function PlansPage({ profile, assessmentResult }: { profile: SleepProfile; assessmentResult: AssessmentResult | null }) {
  const diarySummary = summarizeRecentDiary(getDiaryEntries());
  const recommendations = recommendSleepPlans({ profile, assessmentResult, diarySummary });
  const personalization = buildPersonalizationProfile({ profile, assessmentResult, diarySummary });
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
      <section className="plan-card">
        <h2>7天改善计划</h2>
        {personalization.sevenDayPlan.map((item) => (
          <article key={item.day}>
            <h3>第{item.day}天：{item.title}</h3>
            <p>{item.task}</p>
            <p>{item.checkInPrompt}</p>
          </article>
        ))}
      </section>
      <h2>全部方案</h2>
      {sleepPlans.map((plan) => <article key={plan.id} className="plan-card"><h3>{plan.title}</h3><p>{plan.summary}</p></article>)}
    </main>
  );
}