import { useEffect } from 'react';
import type { AssessmentResult, SleepProfile, SleepScenario } from '../domain/types';
import { ScenarioLauncher } from './ScenarioLauncher';

interface TodayPageProps {
  profile: SleepProfile;
  assessmentResult: AssessmentResult | null;
  onOpenChat: (scenario?: SleepScenario, initialInput?: string) => void;
  onOpenAssessment: () => void;
  onOpenKnowledge: (scenario?: SleepScenario) => void;
  onOpenRelaxation: (toolId: string) => void;
  today?: string;
  todayTask?: { day: number; title: string; status: string } | null;
  onOpenPlans?: () => void;
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
  today = new Date().toISOString().slice(0, 10),
  todayTask,
  onOpenPlans,
}: TodayPageProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

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
            <h1>首页</h1>
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

      {todayTask && onOpenPlans && (
        <section className="today-task-entry" aria-label="今日助眠任务">
          <div>
            <span>今日助眠任务</span>
            <h2>{todayTask.title}</h2>
            <p>第 {todayTask.day} 天 · {todayTask.status}</p>
          </div>
          <button type="button" className="action-btn" onClick={onOpenPlans}>去方案页执行</button>
        </section>
      )}

      <section className="home-tools-section" aria-label="睡眠工具">
        <div className="section-header">
          <h2>睡眠工具</h2>
        </div>
        <div className="home-tool-grid">
          <button type="button" className="home-tool-card" onClick={onOpenAssessment} aria-label="睡眠自测">
            <span className="tile-icon"><i data-lucide="clipboard-list" style={{ width: '24px', height: '24px' }}></i></span>
            <span className="tile-copy">
              <span className="tile-label">睡眠自测</span>
              <span className="tile-desc">快速了解失眠程度和睡眠质量</span>
            </span>
          </button>
          <button type="button" className="home-tool-card" onClick={() => onOpenKnowledge()} aria-label="睡眠知识">
            <span className="tile-icon"><i data-lucide="library" style={{ width: '24px', height: '24px' }}></i></span>
            <span className="tile-copy">
              <span className="tile-label">睡眠知识</span>
              <span className="tile-desc">查看科学睡眠建议和常见误区</span>
            </span>
          </button>
        </div>
      </section>

      {/* Horizontal scenario launcher */}
      <section aria-label="快速咨询">
        <div className="section-header">
          <h2>快速咨询</h2>
        </div>
        <ScenarioLauncher
          mode="chat"
          onSelect={onOpenChat}
          variant="horizontal"
          excludeScenarios={['sound_meditation']}
        />
      </section>

      {/* Quick action grid */}
      <section aria-label="推荐放松">
        <div className="section-header">
          <h2>推荐放松</h2>
        </div>
        <div className="quick-grid">
          <button type="button" className="quick-tile" onClick={() => onOpenRelaxation('breathing-478')}>
            <span className="tile-icon"><i data-lucide="wind" style={{ width: '24px', height: '24px' }}></i></span>
            <span className="tile-label">4-7-8 呼吸</span>
          </button>
          <button type="button" className="quick-tile" onClick={() => onOpenRelaxation('sound-meditation')}>
            <span className="tile-icon"><i data-lucide="music" style={{ width: '24px', height: '24px' }}></i></span>
            <span className="tile-label">白噪音 / 冥想音频</span>
          </button>
          <button type="button" className="quick-tile" onClick={() => onOpenRelaxation('muscle-relaxation')}>
            <span className="tile-icon"><i data-lucide="activity" style={{ width: '24px', height: '24px' }}></i></span>
            <span className="tile-label">渐进放松</span>
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
