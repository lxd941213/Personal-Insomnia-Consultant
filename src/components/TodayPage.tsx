import type { AssessmentResult, SleepProfile, SleepScenario } from '../domain/types';
import { buildDefaultReminderSettings, buildTodayReminderTasks } from '../domain/reminders';
import { getReminderSettings } from '../storage/localStore';
import { ScenarioLauncher } from './ScenarioLauncher';

interface TodayPageProps {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  onOpenChat: (scenario?: SleepScenario) => void;
  onOpenAssessment: () => void;
  onOpenKnowledge: (scenario?: SleepScenario) => void;
  onOpenRelaxation: (toolId: string) => void;
  onOpenDiary: () => void;
}

export function TodayPage({
  profile,
  assessmentResult,
  onOpenChat,
  onOpenAssessment,
  onOpenKnowledge,
  onOpenRelaxation,
  onOpenDiary,
}: TodayPageProps) {
  const today = new Date().toISOString().slice(0, 10);
  const settings = getReminderSettings() ?? buildDefaultReminderSettings();
  const tasks = buildTodayReminderTasks(settings, today);
  return (
    <main className="page today-page">
      <h1>今日睡眠</h1>
      <p>
        {profile.ageRange} · 通常睡眠 {profile.bedtime}-{profile.wakeTime}
      </p>
      <ScenarioLauncher mode="chat" onSelect={onOpenChat} />
      <section className="daily-card">
        <h2>今晚待办</h2>
        {tasks.map((task) => (
          <p key={task.id}>{task.label}</p>
        ))}
        <button type="button" onClick={onOpenDiary}>
          记录睡眠
        </button>
      </section>
      <section className="daily-card">
        <h2>推荐放松</h2>
        <button type="button" onClick={() => onOpenRelaxation('breathing-478')}>
          4-7-8 呼吸
        </button>
      </section>
      <button type="button" onClick={onOpenAssessment}>
        睡眠自测
      </button>
      <button type="button" onClick={() => onOpenKnowledge()}>
        睡眠知识
      </button>
      {assessmentResult && <p>最近 ISI {assessmentResult.isi.score}</p>}
    </main>
  );
}
