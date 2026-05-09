import { useState } from 'react';
import type { SleepProfile } from '../domain/types';
import { buildDefaultReminderSettings } from '../domain/reminders';
import { getReminderSettings, saveReminderSettings } from '../storage/localStore';

export function MyPage({ profile, onReset }: { profile: SleepProfile; onReset: () => void }) {
  const [settings, setSettings] = useState(() => getReminderSettings() ?? buildDefaultReminderSettings());
  const [saved, setSaved] = useState(false);

  function updateSetting(next: Partial<typeof settings>) {
    setSettings((current) => ({
      ...current,
      ...next,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    }));
    setSaved(false);
  }

  function saveSettings() {
    saveReminderSettings(settings);
    setSaved(true);
  }

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
        <label>
          <input
            type="checkbox"
            checked={settings.bedtimeEnabled}
            onChange={(event) => updateSetting({ bedtimeEnabled: event.target.checked })}
          />
          启用睡前提醒
        </label>
        <label>
          睡前提醒时间
          <input
            value={settings.bedtimeTime}
            onChange={(event) => updateSetting({ bedtimeTime: event.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.wakeEnabled}
            onChange={(event) => updateSetting({ wakeEnabled: event.target.checked })}
          />
          启用起床提醒
        </label>
        <label>
          起床提醒时间
          <input
            value={settings.wakeTime}
            onChange={(event) => updateSetting({ wakeTime: event.target.value })}
          />
        </label>
        <button type="button" onClick={saveSettings}>
          保存提醒设置
        </button>
        {saved && <p>提醒设置已保存</p>}
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
