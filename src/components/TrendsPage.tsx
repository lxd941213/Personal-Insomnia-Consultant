import type { CSSProperties } from 'react';
import { getDailyTaskLogs, getDiaryEntries } from '../storage/localStore';
import { buildTaskExecutionInsight, buildTrendSummary } from '../domain/trends';
import { buildProgramStats } from '../domain/program';
import type { SleepProfile } from '../domain/types';
import { buildSafetyDisplayCopy, triageSafety } from '../domain/safety';
import { SafetyCarePanel } from './SafetyCarePanel';

function formatMinutes(minutes: number | null): string {
  return minutes === null ? '--' : `${minutes}`;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} 分钟`;
  return mins === 0 ? `${hours} 小时` : `${hours}小时${mins}分`;
}

function MetricTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="trend-metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

type TrendHeroMeterStyle = CSSProperties & {
  '--record-progress': string;
};

export function TrendsPage({
  profile,
  today = new Date().toISOString().slice(0, 10),
  onOpenDiary,
}: {
  profile?: SleepProfile;
  today?: string;
  onOpenDiary?: () => void;
}) {
  const trends = buildTrendSummary(getDiaryEntries(), today);
  const safetyTriage = profile ? triageSafety({ profile }) : null;
  const programLogs = getDailyTaskLogs();
  const programStats = buildProgramStats(programLogs);
  const hasDiaryData = trends.last7Days.entryCount > 0;
  const programInsight = buildTaskExecutionInsight(programLogs);
  const recordQualityCopy = trends.recordQuality === 'usable'
    ? '记录已足够形成初步观察。'
    : '记录还不够，先避免过度解读。';
  const headline = hasDiaryData
    ? '本周睡眠已有可观察记录'
    : '先积累起床记录，再判断趋势';
  const headlineDetail = hasDiaryData
    ? `近 7 天已记录 ${trends.last7Days.entryCount} 天，重点观察入睡耗时、夜醒和白天状态。`
    : '趋势页依赖起床后的睡眠质量、入睡耗时和夜醒数据。完成一次起床记录后，这里会开始形成判断。';
  const recordProgress = Math.min(Math.max(trends.last7Days.entryCount, 0), 7) / 7;
  const recordProgressStyle = {
    '--record-progress': `${recordProgress * 360}deg`,
  } as TrendHeroMeterStyle;

  return (
    <main className="page trends-page">
      <header className="page-header-sticky">
        <div className="greeting-header">
          <div>
            <h1>睡眠趋势</h1>
            <p className="date-line">把日记和改善任务合在一起看，先判断记录是否足够。</p>
          </div>
        </div>
      </header>

      {safetyTriage && safetyTriage.level !== 'normal' && (
        <SafetyCarePanel level={safetyTriage.level} copy={buildSafetyDisplayCopy(safetyTriage)} />
      )}

      <section className="trend-hero-card" aria-labelledby="trend-overview-title">
        <div className="trend-hero-copy">
          <span>本周概览</span>
          <h2 id="trend-overview-title">{headline}</h2>
          <p>{headlineDetail}</p>
        </div>
        <div className="trend-hero-meter" style={recordProgressStyle} aria-label="近 7 天记录天数">
          <strong>{trends.last7Days.entryCount}</strong>
          <span>/ 7 天</span>
        </div>
      </section>

      <section className="trend-section" aria-labelledby="trend-metrics-title">
        <div className="trend-section-header">
          <h2 id="trend-metrics-title">核心指标</h2>
          <p>优先看近 7 天；30 天用于确认趋势是否稳定。</p>
        </div>
        <div className="trend-metric-grid">
          <MetricTile
            label="入睡耗时"
            value={`${formatMinutes(trends.last7Days.averageSleepLatencyMinutes)} 分钟`}
            helper="近 7 天平均"
          />
          <MetricTile
            label="睡眠时长"
            value={formatDuration(trends.last7Days.averageSleepDurationMinutes)}
            helper="近 7 天平均"
          />
          <MetricTile
            label="睡眠质量"
            value={`${trends.last30Days.averageSleepQuality ?? '--'}`}
            helper={`近 30 天记录 ${trends.last30Days.entryCount} 天`}
          />
          <MetricTile
            label="改善执行"
            value={`${programStats.completionRate}%`}
            helper={`连续完成 ${programStats.currentStreak} 天`}
          />
        </div>
      </section>

      <section className="trend-section" aria-labelledby="trend-insights-title">
        <div className="trend-section-header">
          <h2 id="trend-insights-title">趋势洞察</h2>
          <p>{recordQualityCopy}</p>
        </div>
        <div className="trend-insights">
          {trends.insights.map((insight) => <p key={insight}>{insight}</p>)}
          <p>{programInsight}</p>
        </div>
      </section>

      <section className="trend-section trend-program-panel" aria-labelledby="trend-program-title">
        <div className="trend-section-header">
          <h2 id="trend-program-title">改善执行</h2>
          <p>完成 {programStats.completedCount} 个任务，跳过 {programStats.skippedCount} 个任务。</p>
        </div>
        <div className="trend-progress-track" aria-label={`任务完成率 ${programStats.completionRate}%`}>
          <span style={{ width: `${programStats.completionRate}%` }} />
        </div>
      </section>

      {trends.last7Days.entryCount === 0 && (
        <button type="button" className="primary-button trend-primary-action" onClick={onOpenDiary}>去补充起床记录</button>
      )}
    </main>
  );
}
