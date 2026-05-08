import type { AssessmentResult, MainConcern, SleepProfile, SleepScenario } from '../domain/types';
import { ScenarioLauncher } from './ScenarioLauncher';

const concernLabels: Record<MainConcern, string> = {
  hard_to_fall_asleep: '难以入睡',
  early_waking: '早醒',
  frequent_waking: '频繁醒来',
  vivid_dreams: '多梦',
  daytime_sleepiness: '白天嗜睡',
  late_night_habit: '夜间习惯问题',
  other: '其他',
};

interface DashboardPageProps {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  onStartAssessment: () => void;
  onOpenKnowledge: (scenario?: SleepScenario) => void;
  onOpenChat: (scenario?: SleepScenario) => void;
  onReset: () => void;
}

export function DashboardPage({
  profile,
  assessmentResult,
  onStartAssessment,
  onOpenKnowledge,
  onOpenChat,
  onReset,
}: DashboardPageProps) {
  return (
    <main className="page dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>睡眠健康助手</h1>
          <p className="dashboard-profile">
            {profile.ageRange} · {concernLabels[profile.mainConcern]}
          </p>
        </div>
        <button type="button" className="reset-btn" onClick={onReset}>
          重置档案
        </button>
      </header>

      {assessmentResult && (
        <div className="assessment-band">
          <div className="assessment-item">
            <span className="assessment-label">ISI:</span>
            <span className="assessment-value">
              {assessmentResult.isi.score} ({assessmentResult.isi.level})
            </span>
          </div>
          <div className="assessment-item">
            <span className="assessment-label">PSQI:</span>
            <span className="assessment-value">
              {assessmentResult.psqiLite.score} ({assessmentResult.psqiLite.level})
            </span>
          </div>
        </div>
      )}

      <section className="dashboard-section">
        <h2>选择场景</h2>
        <ScenarioLauncher mode="chat" onSelect={onOpenChat} />
      </section>

      <div className="dashboard-actions">
        <button type="button" className="action-btn" onClick={onStartAssessment}>
          睡眠评估
        </button>
        <button type="button" className="action-btn" onClick={() => onOpenKnowledge()}>
          睡眠知识
        </button>
        <button type="button" className="action-btn" onClick={() => onOpenChat()}>
          继续咨询
        </button>
      </div>
    </main>
  );
}
