import { useEffect, useState } from 'react';
import { sleepPlans, recommendSleepPlans } from '../domain/sleepPlans';
import { buildConsultationDiarySummary } from '../domain/sleepDiary';
import { buildDailyTaskLog, createSleepProgram, resolveProgramState, upsertDailyTaskLog } from '../domain/program';
import { getDailyTaskLogs, getDiaryEntries, getSleepProgram, saveDailyTaskLogs, saveSleepProgram } from '../storage/localStore';
import { buildSafetyDisplayCopy, triageSafety } from '../domain/safety';
import { SafetyCarePanel } from './SafetyCarePanel';
import type { AssessmentResult, DailyTaskLog, PlanRecommendation, ProgramTask, SleepPlan, SleepPlanCategory, TaskStatus } from '../domain/types';
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

interface RecommendedPlanView {
  recommendation: PlanRecommendation;
  plan: SleepPlan;
}

function resolveRecommendedPlans(recommendations: PlanRecommendation[]): RecommendedPlanView[] {
  return recommendations.flatMap((recommendation) => {
    const plan = sleepPlans.find((item) => item.id === recommendation.planId);
    return plan ? [{ recommendation, plan }] : [];
  });
}

function summarizeReasons(reasons: string[]): string {
  return reasons.join('；');
}

function previewSteps(steps: string[]): string[] {
  return steps.slice(0, 2);
}

function representativeTags(plans: SleepPlan[]): string[] {
  return Array.from(new Set(plans.flatMap((plan) => plan.tags))).slice(0, 3);
}

type ResolvedProgramTask = ProgramTask & { status: TaskStatus };

function nextUpcomingTask(tasks: ResolvedProgramTask[], currentDay: number) {
  return tasks.find((task) => task.day > currentDay && task.status === 'locked')
    ?? tasks.find((task) => task.day > currentDay);
}

type ProgramState = ReturnType<typeof resolveProgramState>;

function PlanStepList({ steps }: { steps: string[] }) {
  return (
    <ol className="plan-step-list">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

function SafetyNote({ children }: { children: string }) {
  return (
    <p className="plan-safety-note">
      {children}
    </p>
  );
}

function PriorityPlanCard({
  item,
  expanded,
  onToggle,
}: {
  item: RecommendedPlanView | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!item) {
    return (
      <article className="plan-card-featured">
        <h3>暂无优先方案</h3>
        <p>完成评估或记录睡眠后，这里会显示最适合当前状态的行动建议。</p>
      </article>
    );
  }

  const { recommendation, plan } = item;
  const hasMoreSteps = plan.steps.length > previewSteps(plan.steps).length;

  return (
    <article className="plan-card-featured">
      <p className="fine-print">当前最值得优先处理</p>
      <h3>{plan.title}</h3>
      <p>{plan.summary}</p>
      {recommendation.reasons.length > 0 && (
        <p className="plan-reason">
          <span className="plan-reason-label">推荐理由：</span>
          <span className="plan-reason-text">
            {summarizeReasons(recommendation.reasons)}
          </span>
        </p>
      )}
      {recommendation.safetyNote && <SafetyNote>{recommendation.safetyNote}</SafetyNote>}
      {plan.steps.length > 0 && (
        <>
          <h4>今晚先做</h4>
          <PlanStepList steps={expanded ? plan.steps : previewSteps(plan.steps)} />
        </>
      )}
      {hasMoreSteps && (
        <button
          type="button"
          className="collapse-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {expanded ? '收起完整步骤' : '查看完整步骤'}
        </button>
      )}
    </article>
  );
}

function CompactRecommendationList({
  items,
  expandedPlans,
  onToggle,
}: {
  items: RecommendedPlanView[];
  expandedPlans: Set<string>;
  onToggle: (planId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="section-header">
        <h2>其他推荐</h2>
        <span className="section-count">{items.length} 个</span>
      </div>
      <div className="compact-plan-list">
        {items.map(({ recommendation, plan }) => {
          const isExpanded = expandedPlans.has(plan.id);
          return (
            <article key={recommendation.planId} className="plan-card-plain">
              <h3>{plan.title}</h3>
              <p>{plan.summary}</p>
              {recommendation.reasons.length > 0 && (
                <p className="fine-print">推荐理由：{summarizeReasons(recommendation.reasons)}</p>
              )}
              {recommendation.safetyNote && <SafetyNote>{recommendation.safetyNote}</SafetyNote>}
              {plan.steps.length > 0 && (
                <button
                  type="button"
                  className="collapse-toggle"
                  onClick={() => onToggle(plan.id)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? '收起步骤' : '展开步骤'}
                </button>
              )}
              {isExpanded && <PlanStepList steps={plan.steps} />}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProgramOverview({
  programState,
  profile,
  assessmentResult,
  expanded,
  onToggle,
  onStartFeedback,
}: {
  programState: ProgramState;
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  expanded: boolean;
  onToggle: () => void;
  onStartFeedback: (status: 'completed' | 'skipped') => void;
}) {
  if (programState.program.status === 'needs_care') {
    const triage = triageSafety({
      profile,
      assessmentResult,
    });

    return (
      <section>
        <div className="section-header">
          <h2>14天改善计划</h2>
        </div>
        <SafetyCarePanel level={triage.level} copy={buildSafetyDisplayCopy(triage)} />
      </section>
    );
  }

  const todayTask = programState.tasks.find((task) => task.day === programState.program.currentDay)
    ?? programState.tasks[0];
  const nextTask = nextUpcomingTask(programState.tasks, programState.program.currentDay);

  return (
    <section>
      <div className="section-header">
        <h2>14天改善计划</h2>
        <span className="section-count">第 {programState.program.currentDay} 天 / 14 天</span>
      </div>
      <article className="plan-card-featured">
        <div className="program-summary-row">
          <h3>当前进度</h3>
          <p>已完成 {programState.stats.completedCount} 个任务，跳过 {programState.stats.skippedCount} 个任务，完成率 {programState.stats.completionRate}%。</p>
        </div>
        <div className="program-preview-list">
          {todayTask && (
            <div className={`program-preview-item ${todayTask.status}`}>
              <div className="program-task-meta">
                <span className="evidence-label">今日任务</span>
                <span className="task-status-label">{todayTask.status}</span>
              </div>
              <h4>第{todayTask.day}天：{todayTask.title}</h4>
              <p>{todayTask.rationale}</p>
              <p><strong>动作：</strong>{todayTask.action}</p>
            </div>
          )}
          {nextTask && (
            <div className="program-preview-item">
              <div className="program-task-meta">
                <span className="evidence-label">下一步</span>
                <span className="task-status-label">{nextTask.evidenceLabel}</span>
              </div>
              <h4>第{nextTask.day}天：{nextTask.title}</h4>
              <p>{nextTask.rationale}</p>
            </div>
          )}
        </div>
        {todayTask && todayTask.status === 'today' && (
          <div className="task-feedback-actions">
            <button type="button" className="primary-button" onClick={() => onStartFeedback('completed')}>
              完成今日任务
            </button>
            <button type="button" className="action-btn" onClick={() => onStartFeedback('skipped')}>
              跳过今日任务
            </button>
          </div>
        )}
        <button
          type="button"
          className="collapse-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {expanded ? '收起 14 天计划' : '查看全部 14 天'}
        </button>
      </article>
      {expanded && (
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
      )}
    </section>
  );
}

function PlanLibraryAccordion({
  grouped,
  expandedCategories,
  onToggle,
}: {
  grouped: ReturnType<typeof groupPlansByCategory>;
  expandedCategories: Set<SleepPlanCategory>;
  onToggle: (category: SleepPlanCategory) => void;
}) {
  const planCount = grouped.reduce((total, group) => total + group.plans.length, 0);

  return (
    <section>
      <div className="section-header">
        <h2>全部方案</h2>
        <span className="section-count">{planCount} 个</span>
      </div>
      <div className="plan-library-list">
        {grouped.map(({ category, label, plans }) => {
          const isExpanded = expandedCategories.has(category);
          return (
            <div key={category} className="category-group">
              <button
                type="button"
                className="category-header"
                onClick={() => onToggle(category)}
                aria-expanded={isExpanded}
              >
                <span className="category-label">{label}</span>
                <span className="category-count">{plans.length} 个方案</span>
                <span className="category-tag-preview">{representativeTags(plans).join(' / ')}</span>
                <span className="chevron">▼</span>
              </button>
              {isExpanded && (
                <div className="collapse-content open">
                  <div className="collapse-inner">
                    <div className="category-body">
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
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PlansPage({ profile, assessmentResult }: { profile: SleepProfile; assessmentResult: AssessmentResult | null }) {
  const diarySummary = buildConsultationDiarySummary(getDiaryEntries());
  const recommendations = recommendSleepPlans({ profile, assessmentResult, diarySummary });

  const existingProgram = getSleepProgram();
  const program = existingProgram ?? createSleepProgram({ profile, assessmentResult, diarySummary });
  const [taskLogs, setTaskLogs] = useState(() => getDailyTaskLogs());
  const programState = resolveProgramState({
    program,
    profile,
    assessmentResult,
    diarySummary,
    logs: taskLogs,
    today: new Date().toISOString().slice(0, 10),
  });

  const allPlans = sleepPlans.filter((p) => p.id !== 'medical-evaluation' && p.id !== 'seven-day-personalized-plan');
  const grouped = groupPlansByCategory(allPlans);
  const recommendedPlans = resolveRecommendedPlans(recommendations);
  const priorityRecommendation = recommendedPlans[0] ?? null;
  const otherRecommendations = recommendedPlans.slice(1);
  const [expandedCategories, setExpandedCategories] = useState<Set<SleepPlanCategory>>(new Set());
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [isPriorityExpanded, setIsPriorityExpanded] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'completed' | 'skipped' | null>(null);
  const [feedbackDifficulty, setFeedbackDifficulty] = useState<DailyTaskLog['difficulty']>(null);
  const [feedbackSleepQuality, setFeedbackSleepQuality] = useState<number | null>(null);
  const [feedbackLatency, setFeedbackLatency] = useState<number | null>(null);
  const [feedbackAwakenings, setFeedbackAwakenings] = useState<number | null>(null);
  const [feedbackEnergy, setFeedbackEnergy] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  useEffect(() => {
    if (!getSleepProgram()) {
      saveSleepProgram(program);
    }
  }, [program]);

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

  function saveTaskFeedback() {
    if (!feedbackStatus) return;
    if (!feedbackDifficulty) {
      setFeedbackError('请选择任务难度');
      return;
    }
    const todayTask = programState.tasks.find((task) => task.day === programState.program.currentDay) ?? programState.tasks[0];
    const nextLog = buildDailyTaskLog({
      programId: programState.program.id,
      day: todayTask.day,
      date: new Date().toISOString().slice(0, 10),
      status: feedbackStatus,
      difficulty: feedbackDifficulty,
      sleepQuality: feedbackSleepQuality,
      sleepLatencyMinutes: feedbackLatency,
      awakenings: feedbackAwakenings,
      daytimeEnergy: feedbackEnergy,
      note: feedbackNote,
    });
    const nextLogs = upsertDailyTaskLog(taskLogs, nextLog);
    setTaskLogs(nextLogs);
    saveDailyTaskLogs(nextLogs);
    setFeedbackStatus(null);
    setFeedbackError('');
  }

  return (
    <main className="page plans-page-refined page-enter">
      <header className="page-header-sticky">
        <div className="greeting-header">
          <div>
            <h1>助眠方案</h1>
            <p className="date-line">根据档案、自测和日记筛选当下最适合的行动。</p>
          </div>
        </div>
      </header>

      <section>
        <div className="section-header">
          <h2>当前优先方案</h2>
          <span className="section-count">{recommendations.length} 个推荐</span>
        </div>
        <PriorityPlanCard
          item={priorityRecommendation}
          expanded={isPriorityExpanded}
          onToggle={() => setIsPriorityExpanded((value) => !value)}
        />
      </section>

      <CompactRecommendationList
        items={otherRecommendations}
        expandedPlans={expandedPlans}
        onToggle={togglePlan}
      />

      {feedbackStatus && (
        <TaskFeedbackForm
          status={feedbackStatus}
          difficulty={feedbackDifficulty}
          sleepQuality={feedbackSleepQuality}
          latency={feedbackLatency}
          awakenings={feedbackAwakenings}
          energy={feedbackEnergy}
          note={feedbackNote}
          error={feedbackError}
          onDifficulty={setFeedbackDifficulty}
          onSleepQuality={setFeedbackSleepQuality}
          onLatency={setFeedbackLatency}
          onAwakenings={setFeedbackAwakenings}
          onEnergy={setFeedbackEnergy}
          onNote={setFeedbackNote}
          onCancel={() => { setFeedbackStatus(null); setFeedbackError(''); }}
          onSave={saveTaskFeedback}
        />
      )}

      <ProgramOverview
        programState={programState}
        profile={profile}
        assessmentResult={assessmentResult}
        expanded={isTimelineExpanded}
        onToggle={() => setIsTimelineExpanded((value) => !value)}
        onStartFeedback={setFeedbackStatus}
      />

      <PlanLibraryAccordion
        grouped={grouped}
        expandedCategories={expandedCategories}
        onToggle={toggleCategory}
      />
    </main>
  );
}

function TaskFeedbackForm({
  status,
  difficulty,
  sleepQuality,
  latency,
  awakenings,
  energy,
  note,
  error,
  onDifficulty,
  onSleepQuality,
  onLatency,
  onAwakenings,
  onEnergy,
  onNote,
  onCancel,
  onSave,
}: {
  status: 'completed' | 'skipped';
  difficulty: 'easy' | 'ok' | 'hard' | null;
  sleepQuality: number | null;
  latency: number | null;
  awakenings: number | null;
  energy: string;
  note: string;
  error: string;
  onDifficulty: (value: 'easy' | 'ok' | 'hard') => void;
  onSleepQuality: (value: number | null) => void;
  onLatency: (value: number | null) => void;
  onAwakenings: (value: number | null) => void;
  onEnergy: (value: string) => void;
  onNote: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <section className="task-feedback-panel" aria-label="今日任务反馈">
      <h2>{status === 'completed' ? '完成反馈' : '跳过反馈'}</h2>
      <div className="feedback-choice-row">
        <button type="button" className={difficulty === 'easy' ? 'selected' : ''} onClick={() => onDifficulty('easy')}>较容易</button>
        <button type="button" className={difficulty === 'ok' ? 'selected' : ''} onClick={() => onDifficulty('ok')}>一般</button>
        <button type="button" className={difficulty === 'hard' ? 'selected' : ''} onClick={() => onDifficulty('hard')}>较难</button>
      </div>
      {status === 'completed' && (
        <>
          <div className="feedback-choice-row">
            <button type="button" className={sleepQuality === 4 ? 'selected' : ''} onClick={() => onSleepQuality(4)}>较好</button>
            <button type="button" className={sleepQuality === 3 ? 'selected' : ''} onClick={() => onSleepQuality(3)}>一般</button>
            <button type="button" className={sleepQuality === 2 ? 'selected' : ''} onClick={() => onSleepQuality(2)}>较差</button>
          </div>
          <div className="feedback-choice-row">
            <button type="button" className={latency === 25 ? 'selected' : ''} onClick={() => onLatency(25)}>16-30分钟</button>
            <button type="button" className={latency === 45 ? 'selected' : ''} onClick={() => onLatency(45)}>31-60分钟</button>
            <button type="button" className={latency === 75 ? 'selected' : ''} onClick={() => onLatency(75)}>60分钟以上</button>
          </div>
          <div className="feedback-choice-row">
            <button type="button" className={awakenings === 0 ? 'selected' : ''} onClick={() => onAwakenings(0)}>0次</button>
            <button type="button" className={awakenings === 1 ? 'selected' : ''} onClick={() => onAwakenings(1)}>1次</button>
            <button type="button" className={awakenings === 2 ? 'selected' : ''} onClick={() => onAwakenings(2)}>2次</button>
          </div>
        </>
      )}
      <label className="diary-text-field">
        白天精力
        <input value={energy} onChange={(event) => onEnergy(event.target.value)} />
      </label>
      <label className="diary-text-field">
        任务备注
        <textarea value={note} onChange={(event) => onNote(event.target.value)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="task-feedback-actions">
        <button type="button" className="primary-button" onClick={onSave}>保存任务反馈</button>
        <button type="button" className="action-btn" onClick={onCancel}>取消</button>
      </div>
    </section>
  );
}
