import { useState } from 'react';
import { buildDiaryEntry, upsertBedtimeCheckin, upsertWakeCheckin } from '../domain/sleepDiary';
import { getDiaryEntries, saveDiaryEntries } from '../storage/localStore';
import type { SleepDiaryEntry } from '../domain/types';

type DiaryTab = 'bedtime' | 'wake';

function getRecentDates(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function formatDateLabel(dateStr: string): { dayName: string; dayNum: string } {
  const d = new Date(dateStr);
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  return {
    dayName: dayNames[d.getDay()],
    dayNum: String(d.getDate()),
  };
}

function hasEntryForDate(entries: SleepDiaryEntry[], date: string): boolean {
  const entry = entries.find((e) => e.date === date);
  return !!(entry?.bedtimeCheckin || entry?.wakeCheckin);
}

export function DiaryPage({ selectedDate = new Date().toISOString().slice(0, 10) }: { selectedDate?: string }) {
  const [entries, setEntries] = useState(() => getDiaryEntries());
  const [activeDate, setActiveDate] = useState(selectedDate);
  const [activeTab, setActiveTab] = useState<DiaryTab>('bedtime');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const current = entries.find((entry) => entry.date === activeDate) ?? buildDiaryEntry(activeDate);

  // Bedtime state
  const [mood, setMood] = useState(current.bedtimeCheckin?.mood ?? '');
  const [stressLevel, setStressLevel] = useState(String(current.bedtimeCheckin?.stressLevel ?? 3));
  const [factors, setFactors] = useState(current.bedtimeCheckin?.factors.join('、') ?? '');
  const [plannedActions, setPlannedActions] = useState(current.bedtimeCheckin?.plannedActions.join('、') ?? '');
  const [bedtimeNotes, setBedtimeNotes] = useState(current.bedtimeCheckin?.notes ?? '');

  // Wake state
  const [sleepStart, setSleepStart] = useState(current.wakeCheckin?.sleepStart ?? '');
  const [wakeTime, setWakeTime] = useState(current.wakeCheckin?.wakeTime ?? '');
  const [sleepLatencyMinutes, setSleepLatencyMinutes] = useState(String(current.wakeCheckin?.sleepLatencyMinutes ?? ''));
  const [awakenings, setAwakenings] = useState(String(current.wakeCheckin?.awakenings ?? 0));
  const [sleepQuality, setSleepQuality] = useState(String(current.wakeCheckin?.sleepQuality ?? 3));
  const [dreamNote, setDreamNote] = useState(current.wakeCheckin?.dreamNote ?? '');
  const [daytimeFeeling, setDaytimeFeeling] = useState(current.wakeCheckin?.daytimeFeeling ?? '');
  const [wakeNotes, setWakeNotes] = useState(current.wakeCheckin?.notes ?? '');

  function parseList(value: string): string[] {
    return value
      .split(/[、,，]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function showToastMessage(message: string) {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }

  function saveEntry(nextEntry: SleepDiaryEntry) {
    const nextEntries = [...entries.filter((entry) => entry.date !== activeDate), nextEntry]
      .sort((a, b) => a.date.localeCompare(b.date));
    setEntries(nextEntries);
    saveDiaryEntries(nextEntries);
    showToastMessage(`已保存 ${activeDate} 的睡眠日记`);
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

  const recentDates = getRecentDates(7);

  return (
    <main className="page diary-page-refined page-enter">
      <h1>睡眠日记</h1>

      {/* Date strip */}
      <div className="date-strip">
        {recentDates.map((date) => {
          const { dayName, dayNum } = formatDateLabel(date);
          const isActive = date === activeDate;
          const hasData = hasEntryForDate(entries, date);
          return (
            <button
              key={date}
              type="button"
              className={`date-chip${isActive ? ' active' : ''}`}
              onClick={() => setActiveDate(date)}
            >
              <span className="day-name">{dayName}</span>
              <span className="day-num">{dayNum}</span>
              {hasData && <span className="dot" />}
            </button>
          );
        })}
      </div>

      {/* Tab switcher */}
      <div className="tab-switcher">
        <button
          type="button"
          className={activeTab === 'bedtime' ? 'active' : ''}
          onClick={() => setActiveTab('bedtime')}
        >
          <i data-lucide="moon" style={{ width: '14px', height: '14px', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}></i>睡前记录
        </button>
        <button
          type="button"
          className={activeTab === 'wake' ? 'active' : ''}
          onClick={() => setActiveTab('wake')}
        >
          <i data-lucide="sun" style={{ width: '14px', height: '14px', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}></i>起床记录
        </button>
      </div>

      {/* Bedtime form */}
      {activeTab === 'bedtime' && (
        <section className="diary-section">
          <div className="form-grid diary-form">
            <div className="form-grid-2">
              <label className="full-width">
                睡前情绪
                <input value={mood} onChange={(event) => setMood(event.target.value)} />
              </label>
              <label>
                压力程度
                <input value={stressLevel} onChange={(event) => setStressLevel(event.target.value)} inputMode="numeric" />
              </label>
              <label>
                影响因素
                <input value={factors} onChange={(event) => setFactors(event.target.value)} placeholder="用顿号分隔" />
              </label>
              <label className="full-width">
                计划完成
                <input value={plannedActions} onChange={(event) => setPlannedActions(event.target.value)} placeholder="用顿号分隔" />
              </label>
              <label className="full-width">
                睡前备注
                <textarea value={bedtimeNotes} onChange={(event) => setBedtimeNotes(event.target.value)} />
              </label>
            </div>
            <button type="button" className="primary-button" onClick={saveBedtime}>
              保存睡前记录
            </button>
          </div>
        </section>
      )}

      {/* Wake form */}
      {activeTab === 'wake' && (
        <section className="diary-section">
          <div className="form-grid diary-form">
            <div className="form-grid-2">
              <label>
                入睡时间
                <input value={sleepStart} onChange={(event) => setSleepStart(event.target.value)} />
              </label>
              <label>
                起床时间
                <input value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} />
              </label>
              <label>
                入睡耗时
                <input value={sleepLatencyMinutes} onChange={(event) => setSleepLatencyMinutes(event.target.value)} />
              </label>
              <label>
                夜醒次数
                <input value={awakenings} onChange={(event) => setAwakenings(event.target.value)} inputMode="numeric" />
              </label>
              <label className="full-width">
                睡眠质量
                <input value={sleepQuality} onChange={(event) => setSleepQuality(event.target.value)} inputMode="numeric" />
              </label>
              <label>
                梦境记录
                <input value={dreamNote} onChange={(event) => setDreamNote(event.target.value)} />
              </label>
              <label>
                白天状态
                <input value={daytimeFeeling} onChange={(event) => setDaytimeFeeling(event.target.value)} />
              </label>
              <label className="full-width">
                起床备注
                <textarea value={wakeNotes} onChange={(event) => setWakeNotes(event.target.value)} />
              </label>
            </div>
            <button type="button" className="primary-button" onClick={saveWake}>
              保存起床记录
            </button>
          </div>
        </section>
      )}

      {/* Toast */}
      <div className={`toast${showToast ? ' show' : ''}`}>{toastMessage}</div>
    </main>
  );
}
