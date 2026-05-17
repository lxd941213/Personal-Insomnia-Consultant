import { type FormEvent, useState, useEffect } from 'react';
import type { MainConcern, SleepProfile } from '../domain/types';

interface ProfileWizardProps {
  onComplete: (profile: SleepProfile) => void;
}

const concernOptions: Array<{ value: MainConcern; label: string }> = [
  { value: 'hard_to_fall_asleep', label: '难以入睡' },
  { value: 'early_waking', label: '早醒' },
  { value: 'frequent_waking', label: '频繁醒来' },
  { value: 'vivid_dreams', label: '多梦' },
  { value: 'daytime_sleepiness', label: '白天嗜睡' },
  { value: 'late_night_habit', label: '夜间习惯问题' },
  { value: 'other', label: '其他' },
];

const habits = [
  { label: '睡前玩手机', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
  )},
  { label: '午后摄入咖啡因', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
  )},
  { label: '夜间饮酒', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M12 21v-8"/><path d="M12 13a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4h-4"/><path d="M9 5l3-3 3 3"/><path d="M12 2v5"/></svg>
  )},
  { label: '睡前运动', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4v6m0 0l4-4m-4 4l-4-4"/><path d="M5 16l3.5-3.5"/><path d="M19 16l-3.5-3.5"/><circle cx="12" cy="20" r="2"/></svg>
  )},
];

const safetySignals = [
  { label: '严重症状', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  )},
  { label: '疑似睡眠呼吸暂停', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 13l-4-4"/><path d="M20.5 16.5c1.5 1.26 2 5 2 5s-3.74-.5-5-2c-.71-.84-.7-2.13.09-2.91a2.18 2.18 0 0 1 2.91-.09z"/><path d="M12 13l4-4"/></svg>
  )},
  { label: '自伤想法', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  )},
  { label: '药物依赖', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="M8.5 8.5l7 7"/></svg>
  )},
  { label: '重大基础疾病', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
  )},
  { label: '孕期或产后', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-3 3"/><path d="M12 8v10"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>
  )},
];

const emotionOptions = ['焦虑', '情绪低落', '烦躁', '平稳'];
const dietOptions = ['午后咖啡因', '夜间饮酒', '晚餐过晚', '辛辣高糖'];
const medicationOptions = ['未用药', '偶尔使用助眠产品', '长期使用助眠药', '正在服用其他药物'];
const medicalConditionOptions = ['无', '慢性病', '疼痛', '孕期或产后', '疑似呼吸暂停'];

export function ProfileWizard({ onComplete }: ProfileWizardProps) {
  const [profile, setProfile] = useState<SleepProfile>({
    ageRange: '',
    bedtime: '',
    wakeTime: '',
    mainConcern: 'hard_to_fall_asleep',
    concernDuration: '',
    stressLevel: '',
    habits: [],
    daytimeImpact: '',
    safetySignals: [],
    optionalContext: '',
    gender: 'unspecified',
    sleepDurationHours: '',
    occupationStress: 'unspecified',
    emotionState: [],
    exerciseHabit: '',
    dietHabit: [],
    phoneUsageHabit: '',
    medicationStatus: [],
    medicalConditions: [],
  });

  function update<K extends keyof SleepProfile>(key: K, value: SleepProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function toggleListValue(
    key: 'habits' | 'safetySignals' | 'emotionState' | 'dietHabit' | 'medicationStatus' | 'medicalConditions',
    value: string,
  ) {
    setProfile((current) => {
      const values = current[key] ?? [];
      return {
        ...current,
        [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onComplete(profile);
  }

  // 自动计算睡眠时长
  useEffect(() => {
    if (profile.bedtime && profile.wakeTime) {
      const [bedHour, bedMin] = profile.bedtime.split(':').map(Number);
      let [wakeHour, wakeMin] = profile.wakeTime.split(':').map(Number);
      let durationHours = wakeHour - bedHour;
      let durationMin = wakeMin - bedMin;
      if (durationMin < 0) {
        durationHours -= 1;
        durationMin += 60;
      }
      if (durationHours < 0) {
        durationHours += 24;
      }
      const totalMinutes = durationHours * 60 + durationMin;
      const hours = Math.round(totalMinutes / 60);
      if (hours >= 4 && hours <= 9 && profile.sleepDurationHours !== String(hours)) {
        update('sleepDurationHours', String(hours));
      }
    }
  }, [profile.bedtime, profile.wakeTime]);

  return (
    <main className="page">
      <div className="orb orb-1" />
      <div className="orb orb-3" />
      <form className="panel form-grid" onSubmit={submit}>
        <h1>建立您的睡眠档案</h1>
        <p className="form-subtitle">回答以下问题，获取个性化建议</p>
        <div className="card">
          <div className="card-title">基本信息</div>
          <div className="inline-row">
            <label>
              年龄段
              <select required value={profile.ageRange} onChange={(event) => update('ageRange', event.target.value)}>
                <option value="">请选择</option>
                {['18岁以下', '18-24岁', '25-34岁', '35-44岁', '45-59岁', '60岁以上'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              性别
              <select value={profile.gender ?? 'unspecified'} onChange={(event) => update('gender', event.target.value as SleepProfile['gender'])}>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="unspecified">暂不透露</option>
              </select>
            </label>
          </div>
          <div className="form-row three-col">
            <label>
              就寝时间
              <input required type="time" value={profile.bedtime} onChange={(event) => update('bedtime', event.target.value)} />
            </label>
            <label>
              起床时间
              <input required type="time" value={profile.wakeTime} onChange={(event) => update('wakeTime', event.target.value)} />
            </label>
            <label>
              睡眠时长
              <select value={profile.sleepDurationHours ?? ''} onChange={(event) => update('sleepDurationHours', event.target.value)}>
                <option value="">请选择</option>
                {['4', '5', '6', '7', '8', '9'].map((option) => <option key={option} value={option}>{option}小时左右</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-title">睡眠状况</div>
          <div className="form-row three-col">
            <label>
              主要睡眠问题
              <select required value={profile.mainConcern} onChange={(event) => update('mainConcern', event.target.value as MainConcern)}>
                {concernOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              问题持续时间
              <select required value={profile.concernDuration} onChange={(event) => update('concernDuration', event.target.value)}>
                <option value="">请选择</option>
                {['不到1周', '1-4周', '1-3个月', '3个月以上'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              压力水平
              <select required value={profile.stressLevel} onChange={(event) => update('stressLevel', event.target.value)}>
                <option value="">请选择</option>
                {['较低', '中等', '较高', '很高'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="form-row two-col">
            <label>
              运动习惯
              <select value={profile.exerciseHabit ?? ''} onChange={(event) => update('exerciseHabit', event.target.value)}>
                <option value="">请选择</option>
                {['几乎不运动', '每周1-2次轻运动', '每周3次以上中等运动', '经常夜间剧烈运动'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              手机使用习惯
              <select value={profile.phoneUsageHabit ?? ''} onChange={(event) => update('phoneUsageHabit', event.target.value)}>
                <option value="">请选择</option>
                {['睡前基本不用', '睡前偶尔使用', '睡前1小时内频繁使用', '醒来后会长时间看手机'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="form-row two-col">
            <label>
              白天影响（选填）
              <input value={profile.daytimeImpact} onChange={(event) => update('daytimeImpact', event.target.value)} />
            </label>
            <label>
              补充说明（选填）
              <textarea rows={3} style={{ minHeight: 'unset', height: '36px' }} value={profile.optionalContext} onChange={(event) => update('optionalContext', event.target.value)} />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-title">生活习惯</div>
          <fieldset className="chip-fieldset">
            <legend>睡眠相关习惯</legend>
            <div className="chip-grid">
              {habits.map((item) => {
                const selected = profile.habits.includes(item.label);
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`chip${selected ? ' selected' : ''}`}
                    onClick={() => toggleListValue('habits', item.label)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="chip-fieldset">
            <legend>情绪状态</legend>
            <div className="chip-grid">
              {emotionOptions.map((label) => {
                const selected = (profile.emotionState ?? []).includes(label);
                return <button key={label} type="button" className={`chip${selected ? ' selected' : ''}`} onClick={() => toggleListValue('emotionState', label)}>{label}</button>;
              })}
            </div>
          </fieldset>
          <fieldset className="chip-fieldset" style={{ marginBottom: 0 }}>
            <legend>饮食习惯</legend>
            <div className="chip-grid">
              {dietOptions.map((label) => {
                const selected = (profile.dietHabit ?? []).includes(label);
                return <button key={label} type="button" className={`chip${selected ? ' selected' : ''}`} onClick={() => toggleListValue('dietHabit', label)}>{label}</button>;
              })}
            </div>
          </fieldset>
        </div>

        <div className="card">
          <div className="card-title">健康信息</div>
          <fieldset className="chip-fieldset">
            <legend>基础疾病</legend>
            <div className="chip-grid">
              {medicalConditionOptions.map((label) => {
                const selected = (profile.medicalConditions ?? []).includes(label);
                return <button key={label} type="button" className={`chip${selected ? ' selected' : ''}`} onClick={() => toggleListValue('medicalConditions', label)}>{label}</button>;
              })}
            </div>
          </fieldset>
          <fieldset className="chip-fieldset">
            <legend>用药情况</legend>
            <div className="chip-grid">
              {medicationOptions.map((label) => {
                const selected = (profile.medicationStatus ?? []).includes(label);
                return <button key={label} type="button" className={`chip${selected ? ' selected' : ''}`} onClick={() => toggleListValue('medicationStatus', label)}>{label}</button>;
              })}
            </div>
          </fieldset>
          <fieldset className="chip-fieldset" style={{ marginBottom: 0 }}>
            <legend>安全信号</legend>
            <div className="chip-grid">
              {safetySignals.map((item) => {
                const selected = profile.safetySignals.includes(item.label);
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`chip${selected ? ' selected' : ''}`}
                    onClick={() => toggleListValue('safetySignals', item.label)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <button className="primary-button" type="submit">开始咨询</button>
        <p className="fine-print">您的档案仅存储在本设备的浏览器中</p>
      </form>
    </main>
  );
}
