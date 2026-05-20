import { useEffect, useState } from 'react';
import { buildDiaryEntry, upsertBedtimeCheckin, upsertWakeCheckin, validateWakeCheckin } from '../domain/sleepDiary';
import { getDiaryEntries, saveDiaryEntries } from '../storage/localStore';
import type { SleepDiaryEntry } from '../domain/types';

type DiaryTab = 'bedtime' | 'wake';
type ChoiceOption = {
  label: string;
  value: string;
};

const moodOptions: ChoiceOption[] = [
  { label: '平静', value: '平静' },
  { label: '放松', value: '放松' },
  { label: '紧张', value: '紧张' },
  { label: '焦虑', value: '焦虑' },
  { label: '烦躁', value: '烦躁' },
  { label: '低落', value: '低落' },
];

const stressOptions: ChoiceOption[] = [
  { label: '很低', value: '1' },
  { label: '较低', value: '2' },
  { label: '中等', value: '3' },
  { label: '较高', value: '4' },
  { label: '很高', value: '5' },
];

const factorOptions = ['睡前玩手机', '工作消息', '咖啡/茶', '晚餐过晚', '运动太晚', '噪音/光线', '身体不适'];
const plannedActionOptions = ['4-7-8 呼吸', '拉伸', '热水澡/泡脚', '放下手机', '冥想音频', '写下待办'];

const sleepLatencyOptions: ChoiceOption[] = [
  { label: '≤15分钟', value: '10' },
  { label: '16-30分钟', value: '25' },
  { label: '31-60分钟', value: '45' },
  { label: '>60分钟', value: '75' },
];

const awakeningOptions: ChoiceOption[] = [
  { label: '0次', value: '0' },
  { label: '1次', value: '1' },
  { label: '2次', value: '2' },
  { label: '3次以上', value: '3' },
];

const sleepQualityOptions: ChoiceOption[] = [
  { label: '很好', value: '5' },
  { label: '较好', value: '4' },
  { label: '一般', value: '3' },
  { label: '较差', value: '2' },
  { label: '很差', value: '1' },
];

const dreamOptions: ChoiceOption[] = [
  { label: '无明显梦境', value: '无明显梦境' },
  { label: '多梦', value: '多梦' },
  { label: '噩梦', value: '噩梦' },
  { label: '梦醒后疲惫', value: '梦醒后疲惫' },
  { label: '记不清', value: '记不清' },
];

const daytimeFeelingOptions: ChoiceOption[] = [
  { label: '精神不错', value: '精神不错' },
  { label: '还可以', value: '还可以' },
  { label: '疲惫', value: '疲惫' },
  { label: '困倦', value: '困倦' },
  { label: '注意力差', value: '注意力差' },
  { label: '情绪低', value: '情绪低' },
];

function getRecentDates(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
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

function toggleChoice(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="diary-choice-field">
      <span className="diary-choice-label">{label}</span>
      <div className="diary-choice-grid">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`diary-choice${value === option.value ? ' selected' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiChoiceGroup({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="diary-choice-field">
      <span className="diary-choice-label">{label}</span>
      <div className="diary-choice-grid">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`diary-choice${values.includes(option) ? ' selected' : ''}`}
            onClick={() => onChange(toggleChoice(values, option))}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DiaryPage({ selectedDate = new Date().toISOString().slice(0, 10) }: { selectedDate?: string }) {
  const [entries, setEntries] = useState(() => getDiaryEntries());
  const [activeDate, setActiveDate] = useState(selectedDate);
  const [activeTab, setActiveTab] = useState<DiaryTab>('bedtime');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  const current = entries.find((entry) => entry.date === activeDate) ?? buildDiaryEntry(activeDate);

  // Bedtime state
  const [mood, setMood] = useState(current.bedtimeCheckin?.mood ?? '');
  const [stressLevel, setStressLevel] = useState(String(current.bedtimeCheckin?.stressLevel ?? 3));
  const [factors, setFactors] = useState(current.bedtimeCheckin?.factors ?? []);
  const [plannedActions, setPlannedActions] = useState(current.bedtimeCheckin?.plannedActions ?? []);
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

  useEffect(() => {
    const next = entries.find((entry) => entry.date === activeDate) ?? buildDiaryEntry(activeDate);
    setMood(next.bedtimeCheckin?.mood ?? '');
    setStressLevel(String(next.bedtimeCheckin?.stressLevel ?? 3));
    setFactors(next.bedtimeCheckin?.factors ?? []);
    setPlannedActions(next.bedtimeCheckin?.plannedActions ?? []);
    setBedtimeNotes(next.bedtimeCheckin?.notes ?? '');
    setSleepStart(next.wakeCheckin?.sleepStart ?? '');
    setWakeTime(next.wakeCheckin?.wakeTime ?? '');
    setSleepLatencyMinutes(String(next.wakeCheckin?.sleepLatencyMinutes ?? ''));
    setAwakenings(String(next.wakeCheckin?.awakenings ?? 0));
    setSleepQuality(String(next.wakeCheckin?.sleepQuality ?? 3));
    setDreamNote(next.wakeCheckin?.dreamNote ?? '');
    setDaytimeFeeling(next.wakeCheckin?.daytimeFeeling ?? '');
    setWakeNotes(next.wakeCheckin?.notes ?? '');
    setError('');
  }, [activeDate, entries]);

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
    setError('');
    saveEntry(upsertBedtimeCheckin(current, {
      mood,
      stressLevel: Number(stressLevel || 0),
      factors,
      plannedActions,
      notes: bedtimeNotes,
    }));
  }

  function saveWake() {
    const wakeCheckin = {
      sleepStart,
      wakeTime,
      sleepLatencyMinutes: Number(sleepLatencyMinutes || 0),
      awakenings: Number(awakenings || 0),
      sleepQuality: Number(sleepQuality || 0),
      dreamNote,
      daytimeFeeling,
      notes: wakeNotes,
    };
    const errors = validateWakeCheckin(wakeCheckin);
    if (errors.length > 0) {
      setError(errors.join('；'));
      return;
    }
    setError('');
    saveEntry(upsertWakeCheckin(current, wakeCheckin));
  }

  const recentDates = getRecentDates(7);

  return (
    <main className="page diary-page-refined page-enter">
      <header className="page-header-sticky">
        <div className="greeting-header">
          <div>
            <h1>睡眠日记</h1>
            <p className="date-line">用少量选择记录睡前和醒后状态。</p>
          </div>
        </div>
      </header>

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

      {error && <p className="error" role="alert">{error}</p>}

      {/* Bedtime form */}
      {activeTab === 'bedtime' && (
        <section className="diary-section">
          <div className="form-grid diary-form">
            <div className="diary-field-stack">
              <ChoiceGroup
                label="睡前情绪"
                options={moodOptions}
                value={mood}
                onChange={setMood}
              />
              <ChoiceGroup label="压力程度" options={stressOptions} value={stressLevel} onChange={setStressLevel} />
              <MultiChoiceGroup label="影响因素" options={factorOptions} values={factors} onChange={setFactors} />
              <MultiChoiceGroup
                label="计划完成"
                options={plannedActionOptions}
                values={plannedActions}
                onChange={setPlannedActions}
              />
              <label className="diary-text-field">
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
            <div className="diary-field-stack">
              <div className="diary-time-grid">
                <label className="diary-text-field">
                  入睡时间
                  <input type="time" value={sleepStart} onChange={(event) => setSleepStart(event.target.value)} />
                </label>
                <label className="diary-text-field">
                  起床时间
                  <input type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} />
                </label>
              </div>
              <ChoiceGroup
                label="入睡耗时"
                options={sleepLatencyOptions}
                value={sleepLatencyMinutes}
                onChange={setSleepLatencyMinutes}
              />
              <ChoiceGroup label="夜醒次数" options={awakeningOptions} value={awakenings} onChange={setAwakenings} />
              <ChoiceGroup
                label="睡眠质量"
                options={sleepQualityOptions}
                value={sleepQuality}
                onChange={setSleepQuality}
              />
              <ChoiceGroup
                label="梦境记录"
                options={dreamOptions}
                value={dreamNote}
                onChange={setDreamNote}
              />
              <ChoiceGroup
                label="白天状态"
                options={daytimeFeelingOptions}
                value={daytimeFeeling}
                onChange={setDaytimeFeeling}
              />
              <label className="diary-text-field">
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
