import { useState, useEffect } from 'react';
import type { AssessmentResult, DailyTaskLog, SleepProfile, SleepScenario } from '../domain/types';
import {
  buildProgramStats,
  createSleepProgram,
  resolveProgramState,
  resolveTodayProgramTask,
} from '../domain/program';
import {
  getDailyTaskLogs,
  getReminderSettings,
  getSleepProgram,
  saveDailyTaskLogs,
  saveReminderSettings,
  saveSleepProgram,
} from '../storage/localStore';
import { buildDefaultReminderSettings, buildTodayReminderTasks } from '../domain/reminders';
import { ScenarioLauncher } from './ScenarioLauncher';

interface TodayPageProps {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  onOpenChat: (scenario?: SleepScenario, initialInput?: string) => void;
  onOpenAssessment: () => void;
  onOpenKnowledge: (scenario?: SleepScenario) => void;
  onOpenRelaxation: (toolId: string) => void;
  onOpenDiary: () => void;
  today?: string;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '早安，愿你精神饱满';
  if (hour < 18) return '午安，记得适当休息';
  if (hour < 22) return '晚安，祝你安眠';
  return '夜深了，好梦';
}

export function TodayPage({
  profile,
  assessmentResult,
  onOpenChat,
  onOpenAssessment,
  onOpenKnowledge,
  onOpenRelaxation,
  onOpenDiary,
  today = new Date().toISOString().slice(0, 10),
}: TodayPageProps) {
  const [settings, setSettings] = useState(() => getReminderSettings() ?? buildDefaultReminderSettings());
  const tasks = buildTodayReminderTasks(settings, today);

  const [program, setProgram] = useState(() => {
    const existing = getSleepProgram();
    if (existing) return existing;
    const created = createSleepProgram({ profile, assessmentResult, diarySummary: undefined });
    saveSleepProgram(created);
    return created;
  });
  const [taskLogs, setTaskLogs] = useState<DailyTaskLog[]>(() => getDailyTaskLogs());
  const [pendingTaskStatus, setPendingTaskStatus] = useState<'completed' | 'skipped' | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'ok' | 'hard' | null>('ok');
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [sleepLatencyMinutes, setSleepLatencyMinutes] = useState('');
  const [awakenings, setAwakenings] = useState('');
  const [daytimeEnergy, setDaytimeEnergy] = useState('一般');
  const [note, setNote] = useState('');

  const programState = resolveProgramState({
    program,
    profile,
    assessmentResult,
    diarySummary: undefined,
    logs: taskLogs,
    today,
  });
  const todayTask = resolveTodayProgramTask(programState);
  const programStats = buildProgramStats(taskLogs);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

  function saveTaskLog() {
    if (!pendingTaskStatus) return;
    const iso = new Date().toISOString();
    const log: DailyTaskLog = {
      id: `task-${todayTask.task.day}-${today}`,
      programId: program.id,
      day: todayTask.task.day,
      date: today,
      status: pendingTaskStatus,
      difficulty,
      sleepQuality,
      sleepLatencyMinutes: sleepLatencyMinutes ? Number(sleepLatencyMinutes) : null,
      awakenings: awakenings ? Number(awakenings) : null,
      daytimeEnergy,
      note,
      createdAt: iso,
      updatedAt: iso,
      version: 1,
    };
    const nextLogs = [
      ...taskLogs.filter((entry) => !(entry.programId === program.id && entry.day === log.day && entry.date === log.date)),
      log,
    ];
    setTaskLogs(nextLogs);
    saveDailyTaskLogs(nextLogs);

    const nextProgram = resolveProgramState({
      program,
      profile,
      assessmentResult,
      diarySummary: undefined,
      logs: nextLogs,
      today,
    }).program;
    setProgram(nextProgram);
    saveSleepProgram({ ...nextProgram, updatedAt: iso, version: nextProgram.version + 1 });
    setPendingTaskStatus(null);
  }

  function acknowledgeReminder(type: 'bedtime' | 'wake') {
    const nextSettings = {
      ...settings,
      lastBedtimeAckDate: type === 'bedtime' ? today : settings.lastBedtimeAckDate,
      lastWakeAckDate: type === 'wake' ? today : settings.lastWakeAckDate,
      updatedAt: new Date().toISOString(),
      version: settings.version + 1,
    };
    setSettings(nextSettings);
    saveReminderSettings(nextSettings);
  }

  const dateStr = new Date(today).toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <main className="page today-page page-enter">
      {/* Sticky greeting header */}
      <header className="page-header-sticky">
        <div className="greeting-header">
          <div>
            <h1>今日睡眠</h1>
            <p className="date-line">{getGreeting()} · {dateStr} · {profile.ageRange}</p>
          </div>
          <span className="sleep-badge">
            <i data-lucide="moon" style={{ width: '12px', height: '12px' }}></i>
            {profile.bedtime}-{profile.wakeTime}
          </span>
        </div>
        {assessmentResult && (
          <div className="pill-row">
            <span className="pill accent">ISI {assessmentResult.isi.score} · {assessmentResult.isi.level}</span>
            <span className="pill accent">PSQI {assessmentResult.psqiLite.score} · {assessmentResult.psqiLite.level}</span>
          </div>
        )}
      </header>

      {/* Daily program card */}
      <section className="program-card">
        <div className="section-header">
          <h2>14 天改善计划</h2>
          <span className="section-count">
            第 {programState.program.currentDay} 天 / 14 天
          </span>
        </div>

        {programState.program.status === 'needs_care' ? (
          <article className="program-task-card high-risk">
            <span className="evidence-label">安全优先</span>
            <h3>优先进行专业评估</h3>
            <p>你当前的档案包含需要优先排查的安全信号。建议先记录症状、准备问题，并咨询医生或睡眠门诊。</p>
            {programState.safetyReasons.length > 0 && (
              <p className="fine-print">原因：{programState.safetyReasons.join('；')}</p>
            )}
          </article>
        ) : (
          <article className="program-task-card">
            <div className="program-task-meta">
              <span className="evidence-label">{todayTask.task.evidenceLabel}</span>
              <span>{todayTask.task.estimatedMinutes} 分钟</span>
            </div>
            <h3>{todayTask.task.title}</h3>
            <p>{todayTask.task.rationale}</p>
            <p><strong>今日动作：</strong>{todayTask.task.action}</p>
            {programStats.needsFallback && (
              <p><strong>更轻量做法：</strong>{todayTask.task.fallbackAction}</p>
            )}
            {todayTask.task.safetyNote && <p className="fine-print">{todayTask.task.safetyNote}</p>}
            <div className="program-actions">
              <button type="button" className="primary-button" onClick={() => setPendingTaskStatus('completed')}>
                完成今日任务
              </button>
              <button type="button" className="action-btn" onClick={() => setPendingTaskStatus('skipped')}>
                今天跳过
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() => onOpenChat(
                  undefined,
                  `请解释今天的睡眠改善任务：${todayTask.task.title}，并告诉我如果做不到应该怎么简化。`,
                )}
              >
                问 AI
              </button>
            </div>
          </article>
        )}

        {pendingTaskStatus && (
          <div className="program-feedback">
            <h3>保存反馈</h3>
            <div className="segmented-row" aria-label="任务难度">
              {[
                ['easy', '轻松'],
                ['ok', '可以'],
                ['hard', '偏难'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={difficulty === value ? 'selected' : ''}
                  onClick={() => setDifficulty(value as 'easy' | 'ok' | 'hard')}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="quality-row">
              {[5, 6, 7, 8].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`睡眠质量 ${value} 分`}
                  className={sleepQuality === value ? 'selected' : ''}
                  onClick={() => setSleepQuality(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <label>
              入睡耗时
              <input value={sleepLatencyMinutes} onChange={(event) => setSleepLatencyMinutes(event.target.value)} inputMode="numeric" />
            </label>
            <label>
              夜醒次数
              <input value={awakenings} onChange={(event) => setAwakenings(event.target.value)} inputMode="numeric" />
            </label>
            <label>
              白天精神
              <input value={daytimeEnergy} onChange={(event) => setDaytimeEnergy(event.target.value)} />
            </label>
            <label>
              备注
              <textarea value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <button type="button" className="primary-button" onClick={saveTaskLog}>
              保存反馈
            </button>
          </div>
        )}
      </section>

      {/* Horizontal scenario launcher */}
      <section>
        <div className="section-header">
          <h2>快速咨询</h2>
        </div>
        <ScenarioLauncher mode="chat" onSelect={onOpenChat} variant="horizontal" />
      </section>

      {/* Tonight's todo highlight card */}
      <section className="highlight-card">
        <h2>今晚待办</h2>
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`task-check${settings.lastBedtimeAckDate === today && task.type === 'bedtime' ? ' completed' : settings.lastWakeAckDate === today && task.type === 'wake' ? ' completed' : ''}`}
          >
            <p>{task.label}</p>
            <button type="button" className="action-btn small" onClick={() => acknowledgeReminder(task.type)}>
              {task.type === 'bedtime' ? '完成睡前提醒' : '完成起床提醒'}
            </button>
          </div>
        ))}
        <button type="button" className="primary-button" onClick={onOpenDiary} style={{ marginTop: '8px' }}>
          记录睡眠
        </button>
      </section>

      {/* Quick action grid */}
      <section>
        <div className="section-header">
          <h2>推荐放松</h2>
        </div>
        <div className="quick-grid">
          <button type="button" className="quick-tile" onClick={() => onOpenRelaxation('breathing-478')}>
            <span className="tile-icon"><i data-lucide="wind" style={{ width: '24px', height: '24px' }}></i></span>
            <span className="tile-label">4-7-8 呼吸</span>
          </button>
          <button type="button" className="quick-tile" onClick={onOpenAssessment} aria-label="睡眠自测">
            <span className="tile-icon"><i data-lucide="clipboard-list" style={{ width: '24px', height: '24px' }}></i></span>
            <span className="tile-label">睡眠自测</span>
          </button>
          <button type="button" className="quick-tile" onClick={() => onOpenKnowledge()}>
            <span className="tile-icon"><i data-lucide="library" style={{ width: '24px', height: '24px' }}></i></span>
            <span className="tile-label">睡眠知识</span>
          </button>
          <button type="button" className="quick-tile" onClick={() => onOpenRelaxation('body-scan')}>
            <span className="tile-icon"><i data-lucide="sparkles" style={{ width: '24px', height: '24px' }}></i></span>
            <span className="tile-label">身体扫描</span>
          </button>
        </div>
      </section>
    </main>
  );
}
