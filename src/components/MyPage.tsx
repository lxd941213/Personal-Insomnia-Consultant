import type { SleepProfile } from '../domain/types';

export function MyPage({ profile, onReset }: { profile: SleepProfile; onReset: () => void }) {
  return (
    <main className="page my-page">
      <h1>我的</h1>
      <section className="settings-card">
        <h2>睡眠档案</h2>
        <p>
          {profile.ageRange} · {profile.mainConcern}
        </p>
        <p>
          通常睡眠 {profile.bedtime}-{profile.wakeTime}
        </p>
      </section>
      <section className="settings-card">
        <h2>提醒设置</h2>
        <p>本版本仅在应用内展示提醒，不请求系统通知权限。</p>
      </section>
      <section className="settings-card">
        <h2>本地数据</h2>
        <p>日记、趋势、方案和咨询记录仅保存在本浏览器。</p>
        <button type="button" onClick={onReset}>
          重置档案
        </button>
      </section>
    </main>
  );
}
