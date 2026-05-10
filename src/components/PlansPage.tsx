import { useState } from 'react';
import { sleepPlans, recommendSleepPlans } from '../domain/sleepPlans';
import { summarizeRecentDiary } from '../domain/sleepDiary';
import { createSleepProgram, resolveProgramState } from '../domain/program';
import { getDailyTaskLogs, getDiaryEntries, getSleepProgram, saveSleepProgram } from '../storage/localStore';
import type { AssessmentResult, SleepPlan, SleepPlanCategory } from '../domain/types';
import type { SleepProfile } from '../domain/types';

const categoryLabels: Record<SleepPlanCategory, string> = {
  cbti: 'CBT-I 认知行为',
  schedule: '作息调整',
  relaxation: '放松训练',
  nutrition: '饮食营养',
  wellness: '健康调理',
  safety: '安全评估',
};

const categoryOrder: SleepPlanCategory[] = ['safety', 'cbti', 'schedule', 'relaxation', 'nutrition', 'wellness'];

function groupPlansByCategory(plans: SleepPlan[]) {
  const groups = new Map<SleepPlanCategory, SleepPlan[]>();
  for (const plan of plans) {
    const list = groups.get(plan.category) ?? [];
    list.push(plan);
    groups.set(plan.category, list);
  }
  return categoryOrder
    .map((cat) => ({ category: cat, label: categoryLabels[cat], plans: groups.get(cat) ?? [] }))
    .filter((g) => g.plans.length > 0);
}

export function PlansPage({ profile, assessmentResult }: { profile: SleepProfile; assessmentResult: AssessmentResult | null }) {
  const diarySummary = summarizeRecentDiary(getDiaryEntries());
  const recommendations = recommendSleepPlans({ profile, assessmentResult, diarySummary });
  const [expandedCategories, setExpandedCategories] = useState<Set<SleepPlanCategory>>(new Set());
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  const existingProgram = getSleepProgram();
  const program = existingProgram ?? createSleepProgram({ profile, assessmentResult, diarySummary });
  if (!existingProgram) {
    saveSleepProgram(program);
  }
  const programState = resolveProgramState({
    program,
    profile,
    assessmentResult,
    diarySummary,
    logs: getDailyTaskLogs(),
    today: new Date().toISOString().slice(0, 10),
  });

  function toggleCategory(cat: SleepPlanCategory) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function togglePlan(planId: string) {
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  }

  const allPlans = sleepPlans.filter((p) => p.id !== 'medical-evaluation' && p.id !== 'seven-day-personalized-plan');
  const grouped = groupPlansByCategory(allPlans);

  // Determine which categories to auto-expand based on profile
  const shouldAutoExpand = (cat: SleepPlanCategory) => {
    if (cat === 'safety') return true;
    if (cat === 'schedule') return true;
    if (cat === 'cbti' && profile.mainConcern === 'hard_to_fall_asleep') return true;
    if (cat === 'relaxation' && profile.stressLevel.includes('高')) return true;
    return false;
  };

  // Auto-expand on first render
  useState(() => {
    const toExpand = new Set<SleepPlanCategory>();
    for (const g of grouped) {
      if (shouldAutoExpand(g.category)) toExpand.add(g.category);
    }
    setExpandedCategories(toExpand);
  });

  return (
    <main className="page plans-page-refined page-enter">
      <h1>助眠方案</h1>

      {/* Recommended plans */}
      <section>
        <div className="section-header">
          <h2>推荐方案</h2>
          <span className="section-count">{recommendations.length} 个</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendations.map((recommendation) => {
            const plan = sleepPlans.find((item) => item.id === recommendation.planId);
            if (!plan) return null;
            const isExpanded = expandedPlans.has(plan.id);
            return (
              <article key={recommendation.planId} className="plan-card-featured">
                <h3>{plan.title}</h3>
                <p>{plan.summary}</p>
                <p>
                  <span style={{ color: 'var(--moonbeam)', fontSize: '12px', fontWeight: 600 }}>推荐理由：</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {recommendation.reasons.join('；')}
                  </span>
                </p>
                {recommendation.safetyNote && (
                  <p style={{ color: 'var(--high-risk-text)', fontSize: '12px', background: 'var(--high-risk-bg)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--high-risk-border)' }}>
                    {recommendation.safetyNote}
                  </p>
                )}
                {plan.steps.length > 0 && (
                  <button
                    type="button"
                    className="collapse-toggle"
                    onClick={() => togglePlan(plan.id)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? '收起步骤' : '查看步骤'}
                  </button>
                )}
                {plan.steps.length > 0 && (
                  <div className={`collapse-content${isExpanded ? ' open' : ''}`}>
                    <div className="collapse-inner">
                      <ol style={{ margin: '8px 0 0', paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.8' }}>
                        {plan.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* 14-day program timeline */}
      {programState.program.status === 'needs_care' ? (
        <section>
          <div className="section-header">
            <h2>14天改善计划</h2>
          </div>
          <article className="plan-card-featured">
            <h3>优先进行专业评估</h3>
            <p>当前存在需要先排查的安全信号。建议先记录症状、准备问题，并咨询医生或睡眠门诊。</p>
            {programState.safetyReasons.length > 0 && (
              <p className="fine-print">原因：{programState.safetyReasons.join('；')}</p>
            )}
          </article>
        </section>
      ) : (
        <section>
          <div className="section-header">
            <h2>14天改善计划</h2>
            <span className="section-count">第 {programState.program.currentDay} 天 / 14 天</span>
          </div>
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
        </section>
      )}

      {/* All plans by category */}
      <section>
        <div className="section-header">
          <h2>全部方案</h2>
          <span className="section-count">{allPlans.length} 个</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {grouped.map(({ category, label, plans }) => {
            const isExpanded = expandedCategories.has(category);
            return (
              <div key={category} className="category-group">
                <div
                  className="category-header"
                  onClick={() => toggleCategory(category)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCategory(category); }}
                >
                  <div>
                    <h3>{label}</h3>
                    <span className="category-count">{plans.length} 个方案</span>
                  </div>
                  <span className="chevron">▼</span>
                </div>
                <div className={`collapse-content${isExpanded ? ' open' : ''}`}>
                  <div className="collapse-inner">
                    <div className="category-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
