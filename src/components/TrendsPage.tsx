import { getDiaryEntries } from '../storage/localStore';
import { buildTrendSummary } from '../domain/trends';

export function TrendsPage({ today = new Date().toISOString().slice(0, 10), onOpenDiary }: { today?: string; onOpenDiary?: () => void }) {
  const trends = buildTrendSummary(getDiaryEntries(), today);
  return (
    <main className="page trends-page">
      <h1>睡眠趋势</h1>
      <section className="metric-grid">
        <article className="metric-card">
          <h2>近 7 天</h2>
          <p>记录 {trends.last7Days.entryCount} 天</p>
          <p>平均入睡耗时 {trends.last7Days.averageSleepLatencyMinutes ?? '--'} 分钟</p>
        </article>
        <article className="metric-card">
          <h2>近 30 天</h2>
          <p>记录 {trends.last30Days.entryCount} 天</p>
          <p>平均睡眠质量 {trends.last30Days.averageSleepQuality ?? '--'}</p>
        </article>
      </section>
      {trends.insights.map((insight) => <p key={insight}>{insight}</p>)}
      {trends.last7Days.entryCount === 0 && (
        <button type="button" className="action-btn" onClick={onOpenDiary}>去记录睡前状态</button>
      )}
    </main>
  );
}