import { useState, useEffect } from 'react';
import type { AssessmentResult, SleepProfile, SleepScenario } from '../domain/types';
import { buildDefaultReminderSettings, buildTodayReminderTasks } from '../domain/reminders';
import { getReminderSettings, saveReminderSettings } from '../storage/localStore';
import { ScenarioLauncher } from './ScenarioLauncher';

interface TodayPageProps {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  onOpenChat: (scenario?: SleepScenario) => void;
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

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

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
