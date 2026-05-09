import { useState } from 'react';
import { buildDiaryEntry, upsertBedtimeCheckin, upsertWakeCheckin } from '../domain/sleepDiary';
import { getDiaryEntries, saveDiaryEntries } from '../storage/localStore';
import type { SleepDiaryEntry } from '../domain/types';

export function DiaryPage({ selectedDate = new Date().toISOString().slice(0, 10) }: { selectedDate?: string }) {
  const [entries, setEntries] = useState(() => getDiaryEntries());
  const current = entries.find((entry) => entry.date === selectedDate) ?? buildDiaryEntry(selectedDate);
  const [mood, setMood] = useState(current.bedtimeCheckin?.mood ?? '');
  const [stressLevel, setStressLevel] = useState(String(current.bedtimeCheckin?.stressLevel ?? 3));
  const [factors, setFactors] = useState(current.bedtimeCheckin?.factors.join('、') ?? '');
  const [plannedActions, setPlannedActions] = useState(current.bedtimeCheckin?.plannedActions.join('、') ?? '');
  const [bedtimeNotes, setBedtimeNotes] = useState(current.bedtimeCheckin?.notes ?? '');
  const [sleepStart, setSleepStart] = useState(current.wakeCheckin?.sleepStart ?? '');
  const [wakeTime, setWakeTime] = useState(current.wakeCheckin?.wakeTime ?? '');
  const [sleepLatencyMinutes, setSleepLatencyMinutes] = useState(String(current.wakeCheckin?.sleepLatencyMinutes ?? ''));
  const [awakenings, setAwakenings] = useState(String(current.wakeCheckin?.awakenings ?? 0));
  const [sleepQuality, setSleepQuality] = useState(String(current.wakeCheckin?.sleepQuality ?? 3));
  const [dreamNote, setDreamNote] = useState(current.wakeCheckin?.dreamNote ?? '');
  const [daytimeFeeling, setDaytimeFeeling] = useState(current.wakeCheckin?.daytimeFeeling ?? '');
  const [wakeNotes, setWakeNotes] = useState(current.wakeCheckin?.notes ?? '');
  const [savedMessage, setSavedMessage] = useState('');

  function parseList(value: string): string[] {
    return value
      .split(/[、,，]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

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
      stressLevel: Number(stressLevel || 0),
      factors: parseList(factors),
      plannedActions: parseList(plannedActions),
      notes: bedtimeNotes,
    }));
  }

  function saveWake() {
    saveEntry(upsertWakeCheckin(current, {
      sleepStart,
      wakeTime,
      sleepLatencyMinutes: Number(sleepLatencyMinutes || 0),
      awakenings: Number(awakenings || 0),
      sleepQuality: Number(sleepQuality || 0),
      dreamNote,
      daytimeFeeling,
      notes: wakeNotes,
    }));
  }

  return (
    <main className="page diary-page">
      <h1>睡眠日记</h1>
      <section className="diary-section">
        <h2>睡前记录</h2>
        <div className="form-grid diary-form">
          <label>睡前情绪<input value={mood} onChange={(event) => setMood(event.target.value)} /></label>
          <label>压力程度<input value={stressLevel} onChange={(event) => setStressLevel(event.target.value)} inputMode="numeric" /></label>
          <label>影响因素<input value={factors} onChange={(event) => setFactors(event.target.value)} placeholder="用顿号分隔，例如 睡前玩手机、工作消息" /></label>
          <label>计划完成<input value={plannedActions} onChange={(event) => setPlannedActions(event.target.value)} placeholder="用顿号分隔，例如 4-7-8 呼吸" /></label>
          <label>睡前备注<textarea value={bedtimeNotes} onChange={(event) => setBedtimeNotes(event.target.value)} /></label>
          <button type="button" className="primary-button" onClick={saveBedtime}>保存睡前记录</button>
        </div>
      </section>
      <section className="diary-section">
        <h2>起床记录</h2>
        <div className="form-grid diary-form">
          <label>入睡时间<input value={sleepStart} onChange={(event) => setSleepStart(event.target.value)} /></label>
          <label>起床时间<input value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} /></label>
          <label>入睡耗时<input value={sleepLatencyMinutes} onChange={(event) => setSleepLatencyMinutes(event.target.value)} /></label>
          <label>夜醒次数<input value={awakenings} onChange={(event) => setAwakenings(event.target.value)} inputMode="numeric" /></label>
          <label>睡眠质量<input value={sleepQuality} onChange={(event) => setSleepQuality(event.target.value)} inputMode="numeric" /></label>
          <label>梦境记录<input value={dreamNote} onChange={(event) => setDreamNote(event.target.value)} /></label>
          <label>白天状态<input value={daytimeFeeling} onChange={(event) => setDaytimeFeeling(event.target.value)} /></label>
          <label>起床备注<textarea value={wakeNotes} onChange={(event) => setWakeNotes(event.target.value)} /></label>
          <button type="button" className="primary-button" onClick={saveWake}>保存起床记录</button>
        </div>
      </section>
      {savedMessage && <p className="saved-toast">{savedMessage}</p>}
    </main>
  );
}
