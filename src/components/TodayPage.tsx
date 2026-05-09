import { useState } from 'react';
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

  return (
    <main className="page today-page">
      <header className="today-header">
        <h1>今日睡眠</h1>
        <p>{profile.ageRange} · 通常睡眠 {profile.bedtime}-{profile.wakeTime}</p>
      </header>
      <ScenarioLauncher mode="chat" onSelect={onOpenChat} />
      <section className="daily-card">
        <h2>今晚待办</h2>
        {tasks.map((task) => (
          <div key={task.id} className="task-row">
            <p>{task.label}</p>
            <button type="button" className="action-btn small" onClick={() => acknowledgeReminder(task.type)}>
              {task.type === 'bedtime' ? '完成睡前提醒' : '完成起床提醒'}
            </button>
          </div>
        ))}
        <button type="button" className="primary-button" onClick={onOpenDiary}>
          记录睡眠
        </button>
      </section>
      <section className="daily-card">
        <h2>推荐放松</h2>
        <button type="button" className="action-btn" onClick={() => onOpenRelaxation('breathing-478')}>
          4-7-8 呼吸
        </button>
      </section>
      <div className="today-action-grid">
        <button type="button" className="action-btn" onClick={onOpenAssessment}>
          睡眠自测
        </button>
        <button type="button" className="action-btn" onClick={() => onOpenKnowledge()}>
          睡眠知识
        </button>
      </div>
      {assessmentResult && (
        <p className="assessment-badge">
          最近 ISI {assessmentResult.isi.score}
        </p>
      )}
    </main>
  );
}
