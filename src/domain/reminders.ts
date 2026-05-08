import type { ReminderSettings } from './types';

export interface ReminderTask {
  id: string;
  label: string;
  type: 'bedtime' | 'wake';
}

export function buildDefaultReminderSettings(now = new Date()): ReminderSettings {
  const iso = now.toISOString();
  return {
    id: 'reminder-settings',
    bedtimeEnabled: true,
    bedtimeTime: '22:30',
    wakeEnabled: true,
    wakeTime: '07:00',
    lastBedtimeAckDate: null,
    lastWakeAckDate: null,
    createdAt: iso,
    updatedAt: iso,
    version: 1,
  };
}

export function buildTodayReminderTasks(settings: ReminderSettings | null, date: string): ReminderTask[] {
  if (!settings) return [];
  const tasks: ReminderTask[] = [];
  if (settings.bedtimeEnabled && settings.lastBedtimeAckDate !== date) {
    tasks.push({ id: `bedtime-${date}`, label: `${settings.bedtimeTime} 睡前准备提醒`, type: 'bedtime' });
  }
  if (settings.wakeEnabled && settings.lastWakeAckDate !== date) {
    tasks.push({ id: `wake-${date}`, label: `${settings.wakeTime} 起床后补充睡眠记录`, type: 'wake' });
  }
  return tasks;
}