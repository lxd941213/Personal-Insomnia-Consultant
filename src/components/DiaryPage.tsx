import { useState } from 'react';
import { buildDiaryEntry, upsertBedtimeCheckin, upsertWakeCheckin } from '../domain/sleepDiary';
import { getDiaryEntries, saveDiaryEntries } from '../storage/localStore';
import type { SleepDiaryEntry } from '../domain/types';

export function DiaryPage({ selectedDate = new Date().toISOString().slice(0, 10) }: { selectedDate?: string }) {
  const [entries, setEntries] = useState(() => getDiaryEntries());
  const current = entries.find((entry) => entry.date === selectedDate) ?? buildDiaryEntry(selectedDate);
  const [mood, setMood] = useState(current.bedtimeCheckin?.mood ?? '');
  const [sleepStart, setSleepStart] = useState(current.wakeCheckin?.sleepStart ?? '');
  const [wakeTime, setWakeTime] = useState(current.wakeCheckin?.wakeTime ?? '');
  const [sleepLatencyMinutes, setSleepLatencyMinutes] = useState(String(current.wakeCheckin?.sleepLatencyMinutes ?? ''));
  const [savedMessage, setSavedMessage] = useState('');

  function saveEntry(nextEntry: SleepDiaryEntry) {
    const nextEntries = [...entries.filter((entry) => entry.date !== selectedDate), nextEntry]
      .sort((a, b) => a.date.localeCompare(b.date));
    setEntries(nextEntries);
    saveDiaryEntries(nextEntries);
    setSavedMessage(`已保存 ${selectedDate} 的睡眠日记`);
  }

  function saveBedtime() {
    saveEntry(upsertBedtimeCheckin(current, {
      mood,
      stressLevel: 3,
      factors: [],
      plannedActions: [],
      notes: '',
    }));
  }

  function saveWake() {
    saveEntry(upsertWakeCheckin(current, {
      sleepStart,
      wakeTime,
      sleepLatencyMinutes: Number(sleepLatencyMinutes || 0),
      awakenings: current.wakeCheckin?.awakenings ?? 0,
      sleepQuality: current.wakeCheckin?.sleepQuality ?? 3,
      dreamNote: current.wakeCheckin?.dreamNote ?? '',
      daytimeFeeling: current.wakeCheckin?.daytimeFeeling ?? '',
      notes: current.wakeCheckin?.notes ?? '',
    }));
  }

  return (
    <main className="page diary-page">
      <h1>睡眠日记</h1>
      <label>睡前情绪<input value={mood} onChange={(event) => setMood(event.target.value)} /></label>
      <button type="button" onClick={saveBedtime}>保存睡前记录</button>
      <label>入睡时间<input value={sleepStart} onChange={(event) => setSleepStart(event.target.value)} /></label>
      <label>起床时间<input value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} /></label>
      <label>入睡耗时<input value={sleepLatencyMinutes} onChange={(event) => setSleepLatencyMinutes(event.target.value)} /></label>
      <button type="button" onClick={saveWake}>保存起床记录</button>
      {savedMessage && <p>{savedMessage}</p>}
    </main>
  );
}