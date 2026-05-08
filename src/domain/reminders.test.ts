import { describe, expect, it } from 'vitest';
import { buildDefaultReminderSettings, buildTodayReminderTasks } from './reminders';

describe('reminders', () => {
  it('creates sync-ready default in-app reminder settings', () => {
    expect(buildDefaultReminderSettings(new Date('2026-05-08T00:00:00.000Z'))).toMatchObject({
      id: 'reminder-settings',
      bedtimeEnabled: true,
      bedtimeTime: '22:30',
      wakeEnabled: true,
      wakeTime: '07:00',
      version: 1,
    });
  });

  it('builds pending tasks until acknowledged for the current date', () => {
    const settings = buildDefaultReminderSettings(new Date('2026-05-08T00:00:00.000Z'));
    expect(buildTodayReminderTasks(settings, '2026-05-08')).toEqual([
      { id: 'bedtime-2026-05-08', label: '22:30 睡前准备提醒', type: 'bedtime' },
      { id: 'wake-2026-05-08', label: '07:00 起床后补充睡眠记录', type: 'wake' },
    ]);
  });
});