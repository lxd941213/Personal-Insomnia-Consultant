import { getDailyTaskLogs, getDiaryEntries } from '../storage/localStore';
import { buildTrendSummary } from '../domain/trends';
import { buildProgramStats } from '../domain/program';

export function TrendsPage({ today = new Date().toISOString().slice(0, 10), onOpenDiary }: { today?: string; onOpenDiary?: () => void }) {
  const trends = buildTrendSummary(getDiaryEntries(), today);
  const programLogs = getDailyTaskLogs();
  const programStats = buildProgramStats(programLogs);
  const programInsight = programLogs.length < 3
    ? '任务和睡眠记录较少，先继续完成每日任务，暂不判断改善趋势。'
    : `近阶段完成率 ${programStats.completionRate}%，睡眠变化需要结合入睡耗时、夜醒和白天精神继续观察。`;

  return (
    <main className="page trends-page">
      <h1>睡眠趋势</h1>
      <section className="metric-grid trend-metrics">
        <article className="metric-card trend-card">
          <h2>近 7 天</h2>
          <p className="metric-value">{trends.last7Days.entryCount} 天</p>
          <p className="metric-meta">记录 {trends.last7Days.entryCount} 天 · 平均入睡耗时 {trends.last7Days.averageSleepLatencyMinutes ?? '--'} 分钟</p>
        </article>
        <article className="metric-card trend-card">
          <h2>近 30 天</h2>
          <p className="metric-value">{trends.last30Days.entryCount} 天</p>
          <p className="metric-meta">记录 {trends.last30Days.entryCount} 天 · 平均睡眠质量 {trends.last30Days.averageSleepQuality ?? '--'}</p>
        </article>
        <article className="metric-card trend-card">
          <h2>改善执行</h2>
          <p className="metric-value">{programStats.completionRate}%</p>
          <p className="metric-meta">完成率 {programStats.completionRate}% · 连续完成 {programStats.currentStreak} 天</p>
        </article>
        <article className="metric-card trend-card">
          <h2>任务反馈</h2>
          <p className="metric-value">{programStats.completedCount} 个</p>
          <p className="metric-meta">完成 {programStats.completedCount} 个 · 跳过 {programStats.skippedCount} 个</p>
        </article>
      </section>
      <section className="trend-insights" aria-label="趋势洞察">
        {trends.insights.map((insight) => <p key={insight}>{insight}</p>)}
        <p>{programInsight}</p>
      </section>
      {trends.last7Days.entryCount === 0 && (
        <button type="button" className="action-btn" onClick={onOpenDiary}>去记录睡前状态</button>
      )}
    </main>
  );
}
