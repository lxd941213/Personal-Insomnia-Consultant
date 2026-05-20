import { useState } from 'react';
import type { SleepProfile } from '../domain/types';
import { buildDefaultReminderSettings } from '../domain/reminders';
import { getReminderSettings, saveReminderSettings } from '../storage/localStore';

const concernLabels: Record<SleepProfile['mainConcern'], string> = {
  hard_to_fall_asleep: '入睡困难',
  early_waking: '早醒',
  frequent_waking: '频繁醒来',
  vivid_dreams: '多梦',
  daytime_sleepiness: '白天嗜睡',
  late_night_habit: '夜间习惯',
  other: '其他',
};

export function MyPage({ profile, onOpenResetDrawer }: { profile: SleepProfile; onOpenResetDrawer: () => void }) {
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
      <header className="page-header-sticky">
        <div className="greeting-header">
          <div>
            <h1>我的</h1>
            <p className="date-line">管理睡眠画像、提醒节奏和本地数据。</p>
          </div>
        </div>
      </header>

      <section className="my-profile-card" aria-labelledby="my-profile-title">
        <div className="my-profile-summary">
          <span>睡眠画像</span>
          <h2 id="my-profile-title">{concernLabels[profile.mainConcern]}</h2>
          <p>{profile.ageRange} · 已记录为主要睡眠困扰</p>
        </div>
        <div className="my-schedule-block" aria-label="通常睡眠时间">
          <strong>{profile.bedtime} - {profile.wakeTime}</strong>
          <span>通常睡眠</span>
        </div>
      </section>

      <section className="settings-card my-settings-card">
        <div className="my-section-header">
          <h2>提醒设置</h2>
          <p>本版本仅在应用内展示提醒，不请求系统通知权限。</p>
        </div>
        <div className="my-card-actions">
          <button type="button" className="my-primary-action" onClick={saveSettings}>
            保存提醒设置
          </button>
          {saved && <p className="save-confirmation">提醒设置已保存</p>}
        </div>
        <div className="reminder-list">
          <div className="reminder-row">
            <label className="reminder-toggle">
              <input
                type="checkbox"
                aria-label="启用睡前提醒"
                checked={settings.bedtimeEnabled}
                onChange={(event) => updateSetting({ bedtimeEnabled: event.target.checked })}
              />
              <span>
                <strong>启用睡前提醒</strong>
                <small>提前进入低刺激状态</small>
              </span>
            </label>
            <label className="reminder-time-field">
              睡前提醒时间
              <input
                value={settings.bedtimeTime}
                onChange={(event) => updateSetting({ bedtimeTime: event.target.value })}
              />
            </label>
          </div>
          <div className="reminder-row">
            <label className="reminder-toggle">
              <input
                type="checkbox"
                aria-label="启用起床提醒"
                checked={settings.wakeEnabled}
                onChange={(event) => updateSetting({ wakeEnabled: event.target.checked })}
              />
              <span>
                <strong>启用起床提醒</strong>
                <small>补充醒后睡眠记录</small>
              </span>
            </label>
            <label className="reminder-time-field">
              起床提醒时间
              <input
                value={settings.wakeTime}
                onChange={(event) => updateSetting({ wakeTime: event.target.value })}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="settings-card my-data-card">
        <div className="my-section-header">
          <h2>数据管理</h2>
          <p>日记、趋势、方案和咨询记录仅保存在本浏览器。</p>
        </div>
        <button type="button" className="my-danger-action" onClick={onOpenResetDrawer}>
          重置档案
        </button>
      </section>
    </main>
  );
}
